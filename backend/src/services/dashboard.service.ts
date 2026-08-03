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

    // Top 5 most-scanned ingredients (from detection items that matched a known ingredient)
    const scannedGroups = await prisma.detectionItem.groupBy({
      by: ['ingredientId'],
      where: { ingredientId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { ingredientId: 'desc' } },
      take: 5,
    });
    const scannedIngredientIds = scannedGroups.map((g) => g.ingredientId as number);
    const scannedIngredients = scannedIngredientIds.length
      ? await prisma.ingredient.findMany({ where: { id: { in: scannedIngredientIds } } })
      : [];
    const topScannedIngredients = scannedGroups.map((g) => {
      const ing = scannedIngredients.find((i) => i.id === g.ingredientId);
      return { id: g.ingredientId as number, name: ing?.name ?? 'ไม่ทราบชื่อ', count: g._count._all };
    });

    // Top 5 most-recommended recipes (recipes that showed up in /recommend results most often)
    const topRecommendedRecipes = await prisma.recipe.findMany({
      where: { recommendedCount: { gt: 0 } },
      orderBy: { recommendedCount: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, recommendedCount: true },
    });

    // Top 5 most-watched videos (recipes with a video, ranked by actual play clicks)
    const topWatchedVideos = await prisma.recipe.findMany({
      where: { videoUrl: { not: null }, videoViews: { gt: 0 } },
      orderBy: { videoViews: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, videoViews: true },
    });

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
      topScannedIngredients,
      topRecommendedRecipes,
      topWatchedVideos,
    };
  },
};
