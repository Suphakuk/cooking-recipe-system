import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { getPagination, buildMeta } from '../utils/helpers';

export const IngredientService = {
  async list(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const search = String(query.search ?? '').trim();
    const activeOnly = String(query.activeOnly ?? '') === 'true';

    const where = {
      ...(activeOnly ? { isActive: true } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { nameEn: { contains: search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.ingredient.count({ where }),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  async getById(id: number) {
    const item = await prisma.ingredient.findUnique({ where: { id } });
    if (!item) throw ApiError.notFound('Ingredient not found');
    return item;
  },

  async create(data: {
    name: string;
    nameEn?: string;
    unit?: string;
    imageUrl?: string;
    isActive?: boolean;
  }) {
    return prisma.ingredient.create({ data });
  },

  async update(id: number, data: Record<string, unknown>) {
    await this.getById(id);
    return prisma.ingredient.update({ where: { id }, data });
  },

  async remove(id: number) {
    await this.getById(id);
    await prisma.ingredient.delete({ where: { id } });
    return { message: 'Ingredient deleted' };
  },
};
