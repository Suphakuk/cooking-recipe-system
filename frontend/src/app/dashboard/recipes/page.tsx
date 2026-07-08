'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api, getErrorMessage } from '@/lib/api';
import { resolveImage, difficultyLabel, formatMinutes } from '@/lib/utils';
import type { Recipe } from '@/types';
import { Plus, Pencil, Trash2, Search, Loader2, Eye, Utensils } from 'lucide-react';

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/recipes', {
        params: { page, limit: 10, search: search || undefined, includeUnpublished: true },
      });
      setRecipes(data.data);
      setTotalPages(data.meta.totalPages);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchRecipes, 300);
    return () => clearTimeout(t);
  }, [fetchRecipes]);

  const remove = async (recipe: Recipe) => {
    if (!confirm(`ลบสูตร "${recipe.title}"?`)) return;
    try {
      await api.delete(`/recipes/${recipe.id}`);
      toast.success('ลบสูตรแล้ว');
      fetchRecipes();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">จัดการสูตรอาหาร</h1>
          <p className="text-muted-foreground">เพิ่ม แก้ไข หรือลบสูตรอาหาร</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/recipes/new">
            <Plus className="h-4 w-4" /> เพิ่มสูตรอาหาร
          </Link>
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
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

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">สูตร</th>
              <th className="px-4 py-3 text-left font-medium">ระดับ</th>
              <th className="px-4 py-3 text-left font-medium">เวลา</th>
              <th className="px-4 py-3 text-left font-medium">สถานะ</th>
              <th className="px-4 py-3 text-left font-medium">ยอดชม</th>
              <th className="px-4 py-3 text-right font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : recipes.length ? (
              recipes.map((r) => {
                const img = resolveImage(r.imageUrl);
                return (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt={r.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Utensils className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium line-clamp-1">{r.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="accent">{difficultyLabel[r.difficulty]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatMinutes(r.cookMinutes + r.prepMinutes)}
                    </td>
                    <td className="px-4 py-3">
                      {r.isPublished ? (
                        <Badge variant="accent">เผยแพร่</Badge>
                      ) : (
                        <Badge variant="secondary">ฉบับร่าง</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> {r.views}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" asChild>
                          <Link href={`/dashboard/recipes/${r.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => remove(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  ยังไม่มีสูตรอาหาร
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
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
    </div>
  );
}
