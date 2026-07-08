'use client';

import { useEffect, useState, useCallback } from 'react';
import { SiteShell } from '@/components/site-shell';
import { RecipeCard } from '@/components/recipe-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import type { Recipe, Category } from '@/types';
import { Search } from 'lucide-react';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/recipes', {
        params: {
          page,
          limit: 12,
          search: search || undefined,
          difficulty: difficulty !== 'all' ? difficulty : undefined,
          categoryId: categoryId !== 'all' ? categoryId : undefined,
          sort,
        },
      });
      setRecipes(data.data);
      setTotalPages(data.meta.totalPages);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, difficulty, categoryId, sort]);

  useEffect(() => {
    const t = setTimeout(fetchRecipes, 300);
    return () => clearTimeout(t);
  }, [fetchRecipes]);

  return (
    <SiteShell>
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold md:text-4xl">สูตรอาหารทั้งหมด</h1>
          <p className="mt-2 text-muted-foreground">ค้นหาเมนูที่ถูกใจจากคลังสูตรของเรา</p>
        </div>

        {/* Filters */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="ค้นหาสูตร..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Select
            value={categoryId}
            onValueChange={(v) => {
              setCategoryId(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="หมวดหมู่" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={difficulty}
            onValueChange={(v) => {
              setDifficulty(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="ระดับความยาก" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกระดับ</SelectItem>
              <SelectItem value="EASY">ง่าย</SelectItem>
              <SelectItem value="MEDIUM">ปานกลาง</SelectItem>
              <SelectItem value="HARD">ยาก</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger>
              <SelectValue placeholder="เรียงตาม" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">ใหม่ล่าสุด</SelectItem>
              <SelectItem value="popular">ยอดนิยม</SelectItem>
              <SelectItem value="fastest">ทำเร็วสุด</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : recipes.length ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ก่อนหน้า
                </Button>
                <span className="px-4 text-sm text-muted-foreground">
                  หน้า {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ถัดไป
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            <p>ไม่พบสูตรอาหารที่ตรงกับเงื่อนไข</p>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
