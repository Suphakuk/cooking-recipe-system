'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api, getErrorMessage } from '@/lib/api';
import { resolveImage } from '@/lib/utils';
import type { Category, Ingredient, Recipe } from '@/types';
import { Loader2, Plus, Trash2, ArrowLeft, ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface IngredientRow {
  ingredientId: string;
  quantity: string;
  unit: string;
  optional: boolean;
}

interface Props {
  recipeId?: number; // if provided => edit mode
}

export function RecipeForm({ recipeId }: Props) {
  const router = useRouter();
  const isEdit = !!recipeId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    servings: '2',
    prepMinutes: '10',
    cookMinutes: '20',
    difficulty: 'EASY',
    calories: '',
    isPublished: true,
  });
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [rows, setRows] = useState<IngredientRow[]>([
    { ingredientId: '', quantity: '', unit: '', optional: false },
  ]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      api.get('/ingredients', { params: { limit: 200 } }),
    ]).then(([cat, ing]) => {
      setCategories(cat.data.data);
      setAllIngredients(ing.data.data);
    });
  }, []);

  useEffect(() => {
    if (!recipeId) return;
    api
      .get(`/recipes/id/${recipeId}`)
      .then((res) => {
        const r: Recipe = res.data.data;
        setForm({
          title: r.title,
          description: r.description ?? '',
          instructions: r.instructions,
          servings: String(r.servings),
          prepMinutes: String(r.prepMinutes),
          cookMinutes: String(r.cookMinutes),
          difficulty: r.difficulty,
          calories: r.calories ? String(r.calories) : '',
          isPublished: r.isPublished,
        });
        setSelectedCategories(r.categories.map((c) => c.category.id));
        setRows(
          r.ingredients.length
            ? r.ingredients.map((ri) => ({
                ingredientId: String(ri.ingredient.id),
                quantity: String(ri.quantity),
                unit: ri.unit ?? '',
                optional: ri.optional,
              }))
            : [{ ingredientId: '', quantity: '', unit: '', optional: false }]
        );
        if (r.imageUrl) setImagePreview(resolveImage(r.imageUrl));
      })
      .catch(() => toast.error('โหลดสูตรไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [recipeId]);

  const handleImage = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const updateRow = (index: number, patch: Partial<IngredientRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () =>
    setRows((prev) => [...prev, { ingredientId: '', quantity: '', unit: '', optional: false }]);

  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const submit = async () => {
    if (!form.title.trim()) return toast.error('กรุณากรอกชื่อเมนู');
    if (!form.instructions.trim()) return toast.error('กรุณากรอกวิธีทำ');

    const validRows = rows.filter((r) => r.ingredientId);
    if (validRows.length === 0) return toast.error('เลือกวัตถุดิบอย่างน้อย 1 อย่าง');

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('instructions', form.instructions);
      fd.append('servings', form.servings);
      fd.append('prepMinutes', form.prepMinutes);
      fd.append('cookMinutes', form.cookMinutes);
      fd.append('difficulty', form.difficulty);
      if (form.calories) fd.append('calories', form.calories);
      fd.append('isPublished', String(form.isPublished));
      fd.append('categoryIds', JSON.stringify(selectedCategories));
      fd.append(
        'ingredients',
        JSON.stringify(
          validRows.map((r) => ({
            ingredientId: Number(r.ingredientId),
            quantity: r.quantity ? Number(r.quantity) : 0,
            unit: r.unit || undefined,
            optional: r.optional,
          }))
        )
      );
      if (imageFile) fd.append('image', imageFile);

      if (isEdit) {
        await api.patch(`/recipes/${recipeId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('บันทึกการแก้ไขแล้ว');
      } else {
        await api.post('/recipes', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('เพิ่มสูตรอาหารแล้ว');
      }
      router.push('/dashboard/recipes');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href="/dashboard/recipes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> กลับ
      </Link>
      <h1 className="mb-6 font-display text-3xl font-semibold">
        {isEdit ? 'แก้ไขสูตรอาหาร' : 'เพิ่มสูตรอาหาร'}
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">ชื่อเมนู</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">คำอธิบายสั้น</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="instructions">วิธีทำ (บรรทัดละ 1 ขั้นตอน)</Label>
                <Textarea
                  id="instructions"
                  className="min-h-[180px]"
                  placeholder={'1. ตั้งกระทะ...\n2. ใส่กระเทียม...'}
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>วัตถุดิบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rows.map((row, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[180px] flex-1">
                    <Label className="text-xs">วัตถุดิบ</Label>
                    <Select
                      value={row.ingredientId}
                      onValueChange={(v) => updateRow(i, { ingredientId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือก" />
                      </SelectTrigger>
                      <SelectContent>
                        {allIngredients.map((ing) => (
                          <SelectItem key={ing.id} value={String(ing.id)}>
                            {ing.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <Label className="text-xs">ปริมาณ</Label>
                    <Input
                      type="number"
                      value={row.quantity}
                      onChange={(e) => updateRow(i, { quantity: e.target.value })}
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">หน่วย</Label>
                    <Input
                      value={row.unit}
                      onChange={(e) => updateRow(i, { unit: e.target.value })}
                    />
                  </div>
                  <label className="flex h-10 items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={row.optional}
                      onChange={(e) => updateRow(i, { optional: e.target.checked })}
                    />
                    ถ้ามี
                  </label>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="h-4 w-4" /> เพิ่มวัตถุดิบ
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>รูปภาพ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg border border-dashed border-border bg-muted">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon className="mb-2 h-8 w-8" />
                    <span className="text-xs">ยังไม่มีรูป</span>
                  </div>
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>รายละเอียด</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">จำนวนเสิร์ฟ</Label>
                  <Input
                    type="number"
                    value={form.servings}
                    onChange={(e) => setForm({ ...form, servings: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">แคลอรี่</Label>
                  <Input
                    type="number"
                    value={form.calories}
                    onChange={(e) => setForm({ ...form, calories: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">เตรียม (นาที)</Label>
                  <Input
                    type="number"
                    value={form.prepMinutes}
                    onChange={(e) => setForm({ ...form, prepMinutes: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">ปรุง (นาที)</Label>
                  <Input
                    type="number"
                    value={form.cookMinutes}
                    onChange={(e) => setForm({ ...form, cookMinutes: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">ระดับความยาก</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(v) => setForm({ ...form, difficulty: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">ง่าย</SelectItem>
                    <SelectItem value="MEDIUM">ปานกลาง</SelectItem>
                    <SelectItem value="HARD">ยาก</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 text-xs">หมวดหมู่</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        selectedCategories.includes(c.id)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card hover:border-primary'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                />
                เผยแพร่สูตรนี้
              </label>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'บันทึกการแก้ไข' : 'สร้างสูตรอาหาร'}
          </Button>
        </div>
      </div>
    </div>
  );
}
