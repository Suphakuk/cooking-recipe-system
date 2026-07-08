'use client';

import { useEffect, useState } from 'react';
import { SiteShell } from '@/components/site-shell';
import { RouteGuard } from '@/components/route-guard';
import { RecipeCard } from '@/components/recipe-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Recipe } from '@/types';
import { Heart } from 'lucide-react';

function FavoritesContent() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/recipes/me/favorites', { params: { limit: 50 } })
      .then((res) => setRecipes(res.data.data))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center gap-3">
        <Heart className="h-7 w-7 text-secondary" />
        <h1 className="font-display text-3xl font-semibold md:text-4xl">รายการโปรด</h1>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      ) : recipes.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-4 text-muted-foreground">ยังไม่มีเมนูในรายการโปรด</p>
          <Button asChild>
            <Link href="/recipes">เลือกดูสูตรอาหาร</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <SiteShell>
      <RouteGuard>
        <FavoritesContent />
      </RouteGuard>
    </SiteShell>
  );
}
