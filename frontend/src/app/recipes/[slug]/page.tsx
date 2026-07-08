'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SiteShell } from '@/components/site-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/store';
import { api, getErrorMessage } from '@/lib/api';
import { resolveImage, formatMinutes, difficultyLabel } from '@/lib/utils';
import type { Recipe } from '@/types';
import {
  Clock,
  Flame,
  Users,
  Heart,
  Star,
  ChefHat,
  Loader2,
  Eye,
} from 'lucide-react';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    api
      .get(`/recipes/${slug}`)
      .then((res) => setRecipe(res.data.data))
      .catch(() => toast.error('ไม่พบสูตรอาหาร'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleFavorite = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!recipe) return;
    setFavLoading(true);
    try {
      const { data } = await api.post(`/recipes/${recipe.id}/favorite`);
      setFavorited(data.data.favorited);
      toast.success(data.data.favorited ? 'เพิ่มในรายการโปรดแล้ว' : 'นำออกจากรายการโปรดแล้ว');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFavLoading(false);
    }
  };

  const handleReview = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!recipe) return;
    setSubmittingReview(true);
    try {
      await api.post(`/recipes/${recipe.id}/reviews`, { rating, comment: comment || undefined });
      toast.success('บันทึกรีวิวแล้ว');
      setComment('');
      // refresh
      const res = await api.get(`/recipes/${slug}`);
      setRecipe(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <SiteShell>
        <div className="container py-10">
          <Skeleton className="mb-6 h-80 w-full rounded-xl" />
          <Skeleton className="mb-3 h-10 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </SiteShell>
    );
  }

  if (!recipe) {
    return (
      <SiteShell>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">ไม่พบสูตรอาหารนี้</p>
          <Button className="mt-4" onClick={() => router.push('/recipes')}>
            กลับไปหน้าสูตรอาหาร
          </Button>
        </div>
      </SiteShell>
    );
  }

  const img = resolveImage(recipe.imageUrl);
  const steps = recipe.instructions
    .split('\n')
    .map((s) => s.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
  const avgRating =
    recipe.reviews && recipe.reviews.length
      ? recipe.reviews.reduce((a, r) => a + r.rating, 0) / recipe.reviews.length
      : 0;

  return (
    <SiteShell>
      <div className="container py-10">
        {/* Hero image */}
        <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-2xl bg-muted">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={recipe.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ChefHat className="h-16 w-16" />
            </div>
          )}
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* Main */}
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {recipe.categories.map(({ category }) => (
                <Badge key={category.id} variant="secondary">
                  {category.name}
                </Badge>
              ))}
              <Badge variant="accent">{difficultyLabel[recipe.difficulty]}</Badge>
            </div>

            <h1 className="font-display text-3xl font-semibold md:text-4xl">{recipe.title}</h1>
            {recipe.description && (
              <p className="mt-3 text-lg text-muted-foreground">{recipe.description}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {recipe.author && (
                <span className="flex items-center gap-1.5">
                  <ChefHat className="h-4 w-4" /> {recipe.author.name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> {recipe.views} ครั้ง
              </span>
              {avgRating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-accent text-accent" /> {avgRating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Steps */}
            <div className="mt-10">
              <h2 className="mb-5 font-display text-2xl font-semibold">วิธีทำ</h2>
              <ol className="space-y-4">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <p className="pt-1 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Reviews */}
            <div className="mt-12">
              <h2 className="mb-5 font-display text-2xl font-semibold">
                รีวิว ({recipe.reviews?.length ?? 0})
              </h2>

              {/* Add review */}
              <Card className="mb-6">
                <CardContent className="p-5">
                  <p className="mb-3 text-sm font-medium">ให้คะแนนเมนูนี้</p>
                  <div className="mb-3 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRating(n)}>
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            n <= rating ? 'fill-accent text-accent' : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="เล่าประสบการณ์การทำเมนูนี้..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button className="mt-3" onClick={handleReview} disabled={submittingReview}>
                    {submittingReview && <Loader2 className="h-4 w-4 animate-spin" />}
                    ส่งรีวิว
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {recipe.reviews?.map((review) => (
                  <div key={review.id} className="flex gap-3 border-b border-border pb-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={resolveImage(review.user.avatarUrl) ?? undefined} />
                      <AvatarFallback>{review.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{review.user.name}</span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < review.rating ? 'fill-accent text-accent' : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
                {(!recipe.reviews || recipe.reviews.length === 0) && (
                  <p className="text-sm text-muted-foreground">ยังไม่มีรีวิว เป็นคนแรกที่รีวิวเมนูนี้</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardContent className="p-5">
                <Button
                  variant={favorited ? 'secondary' : 'outline'}
                  className="mb-5 w-full"
                  onClick={handleFavorite}
                  disabled={favLoading}
                >
                  {favLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
                  )}
                  {favorited ? 'อยู่ในรายการโปรด' : 'เพิ่มในรายการโปรด'}
                </Button>

                <div className="mb-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted/60 p-3">
                    <Clock className="mx-auto mb-1 h-5 w-5 text-primary" />
                    <p className="text-xs text-muted-foreground">เวลา</p>
                    <p className="text-sm font-semibold">
                      {formatMinutes(recipe.cookMinutes + recipe.prepMinutes)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3">
                    <Users className="mx-auto mb-1 h-5 w-5 text-primary" />
                    <p className="text-xs text-muted-foreground">เสิร์ฟ</p>
                    <p className="text-sm font-semibold">{recipe.servings} ที่</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3">
                    <Flame className="mx-auto mb-1 h-5 w-5 text-primary" />
                    <p className="text-xs text-muted-foreground">แคลอรี่</p>
                    <p className="text-sm font-semibold">{recipe.calories ?? '-'}</p>
                  </div>
                </div>

                <h3 className="mb-3 font-display text-lg font-semibold">วัตถุดิบ</h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ri) => (
                    <li
                      key={ri.id}
                      className="flex items-center justify-between border-b border-border/60 pb-2 text-sm"
                    >
                      <span className={ri.optional ? 'text-muted-foreground' : ''}>
                        {ri.ingredient.name}
                        {ri.optional && <span className="ml-1 text-xs">(ถ้ามี)</span>}
                      </span>
                      <span className="text-muted-foreground">
                        {ri.quantity > 0 ? `${ri.quantity} ${ri.unit ?? ri.ingredient.unit ?? ''}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
