'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SiteShell } from '@/components/site-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api, getErrorMessage } from '@/lib/api';
import { resolveImage, formatMinutes, difficultyLabel } from '@/lib/utils';
import type { Ingredient, RecommendResult, DetectionResult } from '@/types';
import {
  Sparkles,
  Search,
  X,
  ScanLine,
  Loader2,
  Check,
  ChefHat,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function RecommendPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [selected, setSelected] = useState<Map<number, Ingredient>>(new Map());
  const [search, setSearch] = useState('');
  const [matchMode, setMatchMode] = useState<'any' | 'all'>('any');
  const [results, setResults] = useState<RecommendResult[] | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get('/ingredients', { params: { limit: 100, activeOnly: true } })
      .then((res) => setIngredients(res.data.data))
      .catch(() => toast.error('โหลดวัตถุดิบไม่สำเร็จ'))
      .finally(() => setLoadingIngredients(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ingredients.filter(
      (i) =>
        !selected.has(i.id) &&
        (!q || i.name.toLowerCase().includes(q) || i.nameEn?.toLowerCase().includes(q))
    );
  }, [ingredients, search, selected]);

  const toggle = (ing: Ingredient) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(ing.id)) next.delete(ing.id);
      else next.set(ing.id, ing);
      return next;
    });
    setResults(null);
  };

  const clearAll = () => {
    setSelected(new Map());
    setResults(null);
  };

  const handleRecommend = async () => {
    if (selected.size === 0) {
      toast.error('เลือกวัตถุดิบอย่างน้อย 1 อย่าง');
      return;
    }
    setLoadingResults(true);
    try {
      const { data } = await api.post('/recipes/recommend', {
        ingredientIds: Array.from(selected.keys()),
        matchMode,
        limit: 24,
      });
      setResults(data.data);
      if (data.data.length === 0) toast.info('ไม่พบเมนูที่ตรงกับวัตถุดิบนี้');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingResults(false);
    }
  };

  const handleDetect = async (file: File) => {
    setDetecting(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await api.post<{ data: DetectionResult }>('/detections', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const detected = data.data.matchedIngredients;
      if (detected.length === 0) {
        toast.info('ไม่พบวัตถุดิบที่รู้จักในรูป ลองเลือกเองได้');
      } else {
        setSelected((prev) => {
          const next = new Map(prev);
          for (const d of detected) {
            const full = ingredients.find((i) => i.id === d.id);
            if (full) next.set(full.id, full);
          }
          return next;
        });
        toast.success(`ตรวจพบ ${detected.length} วัตถุดิบ (โมเดลจำลอง)`);
      }
      setResults(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDetecting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const selectedList = Array.from(selected.values());

  return (
    <SiteShell>
      <div className="container py-10">
        <div className="mb-8 max-w-2xl">
          <h1 className="font-display text-3xl font-semibold md:text-4xl">แนะนำเมนูจากวัตถุดิบ</h1>
          <p className="mt-2 text-muted-foreground">
            เลือกวัตถุดิบที่มีอยู่ในตู้เย็น หรืออัปโหลดรูปเพื่อให้ระบบช่วยระบุ
            แล้วเราจะแนะนำเมนูที่ทำได้
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left: ingredient picker */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="ค้นหาวัตถุดิบ เช่น ไข่ กระเทียม..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleDetect(e.target.files[0])}
              />
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={detecting}
              >
                {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                สแกนจากรูป
              </Button>
            </div>

            {loadingIngredients ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 20 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-24 rounded-full" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filtered.map((ing) => (
                  <button
                    key={ing.id}
                    onClick={() => toggle(ing)}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    {ing.name}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground">ไม่พบวัตถุดิบที่ค้นหา</p>
                )}
              </div>
            )}
          </div>

          {/* Right: cutting board */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    <span className="font-display text-lg font-semibold">เขียงของฉัน</span>
                  </div>
                  {selected.size > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      ล้างทั้งหมด
                    </button>
                  )}
                </div>

                {selectedList.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    ยังไม่ได้เลือกวัตถุดิบ
                    <br />
                    แตะวัตถุดิบทางซ้ายเพื่อเพิ่ม
                  </p>
                ) : (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {selectedList.map((ing) => (
                      <span
                        key={ing.id}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary"
                      >
                        {ing.name}
                        <button onClick={() => toggle(ing)} className="hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="mb-4 flex rounded-lg border border-border p-1">
                  <button
                    onClick={() => setMatchMode('any')}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      matchMode === 'any' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    มีบางอย่าง
                  </button>
                  <button
                    onClick={() => setMatchMode('all')}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      matchMode === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    ครบทุกอย่าง
                  </button>
                </div>

                <Button className="w-full" onClick={handleRecommend} disabled={loadingResults}>
                  {loadingResults ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  แนะนำเมนู ({selected.size})
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results */}
        {results !== null && (
          <div className="mt-12">
            <h2 className="mb-6 font-display text-2xl font-semibold">
              {results.length > 0 ? `พบ ${results.length} เมนูที่แนะนำ` : 'ไม่พบเมนูที่ตรงกัน'}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => (
                <RecommendCard key={r.recipe.id} result={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}

function RecommendCard({ result }: { result: RecommendResult }) {
  const { recipe, coverage, matchedCount, requiredCount, missingIngredients } = result;
  const img = resolveImage(recipe.imageUrl);
  const pct = Math.round(coverage * 100);
  const totalTime = recipe.cookMinutes + recipe.prepMinutes;

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card card-shadow transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={recipe.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ChefHat className="h-10 w-10" />
          </div>
        )}
        <div className="absolute right-3 top-3">
          <Badge variant={pct === 100 ? 'default' : 'accent'}>
            {pct === 100 ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" /> ทำได้เลย
              </span>
            ) : (
              `ตรง ${pct}%`
            )}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg font-semibold leading-tight line-clamp-1 group-hover:text-primary">
          {recipe.title}
        </h3>

        {/* Match meter */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              มีวัตถุดิบ {matchedCount}/{requiredCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatMinutes(totalTime)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-primary' : 'bg-accent'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {missingIngredients.length > 0 && (
          <div className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
            <span>
              ขาด: {missingIngredients.slice(0, 3).map((m) => m.name).join(', ')}
              {missingIngredients.length > 3 && ` +${missingIngredients.length - 3}`}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
