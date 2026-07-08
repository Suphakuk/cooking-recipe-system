import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { slugify, getPagination, buildMeta } from '../utils/helpers';

interface RecipeIngredientInput {
  ingredientId: number;
  quantity?: number;
  unit?: string;
  optional?: boolean;
  note?: string;
}

interface RecipeInput {
  title?: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  servings?: number;
  cookMinutes?: number;
  prepMinutes?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  calories?: number;
  isPublished?: boolean;
  categoryIds?: number[];
  ingredients?: RecipeIngredientInput[];
}

const RECIPE_INCLUDE = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  categories: { include: { category: true } },
  ingredients: { include: { ingredient: true } },
  _count: { select: { favorites: true, reviews: true } },
} satisfies Prisma.RecipeInclude;

export const RecipeService = {
  async list(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const search = String(query.search ?? '').trim();
    const difficulty = String(query.difficulty ?? '').trim().toUpperCase();
    const categoryId = parseInt(String(query.categoryId ?? ''), 10);
    const sort = String(query.sort ?? 'newest');
    const includeUnpublished =
      query.includeUnpublished === true ||
      query.includeUnpublished === 'true' ||
      query.includeUnpublished === '1';

    const where: Prisma.RecipeWhereInput = {
      ...(includeUnpublished ? {} : { isPublished: true }),
      ...(search ? { title: { contains: search } } : {}),
      ...(['EASY', 'MEDIUM', 'HARD'].includes(difficulty)
        ? { difficulty: difficulty as 'EASY' | 'MEDIUM' | 'HARD' }
        : {}),
      ...(categoryId
        ? { categories: { some: { categoryId } } }
        : {}),
    };

    let orderBy: Prisma.RecipeOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'popular') orderBy = { views: 'desc' };
    if (sort === 'fastest') orderBy = { cookMinutes: 'asc' };

    const [items, total] = await Promise.all([
      prisma.recipe.findMany({ where, include: RECIPE_INCLUDE, skip, take: limit, orderBy }),
      prisma.recipe.count({ where }),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  async getBySlug(slug: string) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug },
      include: {
        ...RECIPE_INCLUDE,
        reviews: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!recipe) throw ApiError.notFound('Recipe not found');

    // Increment views (fire and forget)
    prisma.recipe
      .update({ where: { id: recipe.id }, data: { views: { increment: 1 } } })
      .catch(() => undefined);

    return recipe;
  },

  async getById(id: number) {
    const recipe = await prisma.recipe.findUnique({ where: { id }, include: RECIPE_INCLUDE });
    if (!recipe) throw ApiError.notFound('Recipe not found');
    return recipe;
  },

  async create(authorId: number, data: RecipeInput) {
    if (!data.title || !data.instructions) {
      throw ApiError.badRequest('Title and instructions are required');
    }

    return prisma.recipe.create({
      data: {
        title: data.title,
        slug: slugify(data.title),
        description: data.description,
        instructions: data.instructions,
        imageUrl: data.imageUrl,
        servings: data.servings ?? 1,
        cookMinutes: data.cookMinutes ?? 0,
        prepMinutes: data.prepMinutes ?? 0,
        difficulty: data.difficulty ?? 'EASY',
        calories: data.calories,
        isPublished: data.isPublished ?? true,
        authorId,
        categories: {
          create: (data.categoryIds ?? []).map((categoryId) => ({ categoryId })),
        },
        ingredients: {
          create: (data.ingredients ?? []).map((ri) => ({
            ingredientId: ri.ingredientId,
            quantity: ri.quantity ?? 0,
            unit: ri.unit,
            optional: ri.optional ?? false,
            note: ri.note,
          })),
        },
      },
      include: RECIPE_INCLUDE,
    });
  },

  async update(id: number, data: RecipeInput) {
    await this.getById(id);

    return prisma.$transaction(async (tx) => {
      // Replace relations if provided
      if (data.categoryIds) {
        await tx.recipeCategory.deleteMany({ where: { recipeId: id } });
      }
      if (data.ingredients) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
      }

      return tx.recipe.update({
        where: { id },
        data: {
          ...(data.title ? { title: data.title, slug: slugify(data.title) } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.instructions ? { instructions: data.instructions } : {}),
          ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
          ...(data.servings !== undefined ? { servings: data.servings } : {}),
          ...(data.cookMinutes !== undefined ? { cookMinutes: data.cookMinutes } : {}),
          ...(data.prepMinutes !== undefined ? { prepMinutes: data.prepMinutes } : {}),
          ...(data.difficulty ? { difficulty: data.difficulty } : {}),
          ...(data.calories !== undefined ? { calories: data.calories } : {}),
          ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
          ...(data.categoryIds
            ? { categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) } }
            : {}),
          ...(data.ingredients
            ? {
                ingredients: {
                  create: data.ingredients.map((ri) => ({
                    ingredientId: ri.ingredientId,
                    quantity: ri.quantity ?? 0,
                    unit: ri.unit,
                    optional: ri.optional ?? false,
                    note: ri.note,
                  })),
                },
              }
            : {}),
        },
        include: RECIPE_INCLUDE,
      });
    });
  },

  async remove(id: number) {
    await this.getById(id);
    await prisma.recipe.delete({ where: { id } });
    return { message: 'Recipe deleted' };
  },

  /**
   * Recommend recipes based on a set of ingredient ids.
   * - matchMode "any": recipes containing at least one of the ingredients
   * - matchMode "all": recipes containing all of the ingredients
   * Results are scored by how many of the selected ingredients they use
   * and what fraction of the recipe's required ingredients you already have.
   */
  async recommend(ingredientIds: number[], matchMode: 'any' | 'all', limit: number) {
    const candidates = await prisma.recipe.findMany({
      where: {
        isPublished: true,
        ingredients: { some: { ingredientId: { in: ingredientIds } } },
      },
      include: RECIPE_INCLUDE,
    });

    const selected = new Set(ingredientIds);

    const scored = candidates
      .map((recipe) => {
        const required = recipe.ingredients.filter((ri) => !ri.optional);
        const requiredIds = required.map((ri) => ri.ingredientId);
        const matched = requiredIds.filter((id) => selected.has(id));
        const missing = required.filter((ri) => !selected.has(ri.ingredientId));

        const coverage = requiredIds.length > 0 ? matched.length / requiredIds.length : 0;
        // Score: weight coverage strongly, plus raw match count
        const score = coverage * 100 + matched.length;

        return {
          recipe,
          matchedCount: matched.length,
          requiredCount: requiredIds.length,
          coverage: parseFloat(coverage.toFixed(3)),
          missingIngredients: missing.map((ri) => ({
            id: ri.ingredient.id,
            name: ri.ingredient.name,
          })),
          score,
        };
      })
      .filter((r) => (matchMode === 'all' ? r.matchedCount === r.requiredCount && r.requiredCount > 0 : true))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  },

  // ---------- Favorites ----------
  async toggleFavorite(userId: number, recipeId: number) {
    await this.getById(recipeId);
    const existing = await prisma.favorite.findUnique({
      where: { userId_recipeId: { userId, recipeId } },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await prisma.favorite.create({ data: { userId, recipeId } });
    return { favorited: true };
  },

  async listFavorites(userId: number, query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const [rows, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        include: { recipe: { include: RECIPE_INCLUDE } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.favorite.count({ where: { userId } }),
    ]);
    return { items: rows.map((r) => r.recipe), meta: buildMeta(total, page, limit) };
  },

  // ---------- Reviews ----------
  async addReview(userId: number, recipeId: number, rating: number, comment?: string) {
    await this.getById(recipeId);
    return prisma.review.upsert({
      where: { userId_recipeId: { userId, recipeId } },
      update: { rating, comment },
      create: { userId, recipeId, rating, comment },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
  },
};
