'use client';

import Link from 'next/link';
import { Clock, Flame, Star, Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { resolveImage, formatMinutes, difficultyLabel } from '@/lib/utils';
import type { Recipe } from '@/types';

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const img = resolveImage(recipe.imageUrl);
  const totalTime = recipe.cookMinutes + recipe.prepMinutes;

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card card-shadow transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={recipe.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Utensils className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge variant="accent">{difficultyLabel[recipe.difficulty]}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg font-semibold leading-tight line-clamp-1 group-hover:text-primary">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {formatMinutes(totalTime)}
          </span>
          {recipe.calories ? (
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" /> {recipe.calories} kcal
            </span>
          ) : null}
          {recipe._count?.reviews ? (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {recipe._count.reviews} รีวิว
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
