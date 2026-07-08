import { prisma } from '../config/prisma';

export const DashboardService = {
  async stats() {
    const [
      totalUsers,
      totalRecipes,
      totalIngredients,
      totalDetections,
      totalReviews,
      totalFavorites,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.recipe.count(),
      prisma.ingredient.count(),
      prisma.detection.count(),
      prisma.review.count(),
      prisma.favorite.count(),
    ]);

    // Recipes grouped by difficulty
    const byDifficultyRaw = await prisma.recipe.groupBy({
      by: ['difficulty'],
      _count: { _all: true },
    });
    const recipesByDifficulty = byDifficultyRaw.map((r) => ({
      difficulty: r.difficulty,
      count: r._count._all,
    }));

    // Top 5 viewed recipes
    const topRecipes = await prisma.recipe.findMany({
      orderBy: { views: 'desc' },
      take: 5,
      select: { id: true, title: true, views: true, slug: true },
    });

    // Recipe count per category
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, _count: { select: { recipes: true } } },
      orderBy: { name: 'asc' },
    });
    const recipesByCategory = categories.map((c) => ({
      category: c.name,
      count: c._count.recipes,
    }));

    // New users over the last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const dayBuckets: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayBuckets[key] = 0;
    }
    for (const u of recentUsers) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (key in dayBuckets) dayBuckets[key] += 1;
    }
    const usersPerDay = Object.entries(dayBuckets).map(([date, count]) => ({ date, count }));

    return {
      totals: {
        users: totalUsers,
        recipes: totalRecipes,
        ingredients: totalIngredients,
        detections: totalDetections,
        reviews: totalReviews,
        favorites: totalFavorites,
      },
      recipesByDifficulty,
      recipesByCategory,
      topRecipes,
      usersPerDay,
    };
  },
};
