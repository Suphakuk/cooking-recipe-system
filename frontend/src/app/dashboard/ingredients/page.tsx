'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api, getErrorMessage } from '@/lib/api';
import type { Ingredient } from '@/types';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';

export default function AdminIngredientsPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', nameEn: '', unit: '' });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ingredients', {
        params: { limit: 100, search: search || undefined },
      });
      setItems(data.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchItems, 300);
    return () => clearTimeout(t);
  }, [fetchItems]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', nameEn: '', unit: '' });
    setDialogOpen(true);
  };

  const openEdit = (item: Ingredient) => {
    setEditing(item);
    setForm({ name: item.name, nameEn: item.nameEn ?? '', unit: item.unit ?? '' });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('กรุณากรอกชื่อวัตถุดิบ');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/ingredients/${editing.id}`, form);
        toast.success('แก้ไขวัตถุดิบแล้ว');
      } else {
        await api.post('/ingredients', form);
        toast.success('เพิ่มวัตถุดิบแล้ว');
      }
      setDialogOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Ingredient) => {
    if (!confirm(`ลบวัตถุดิบ "${item.name}"?`)) return;
    try {
      await api.delete(`/ingredients/${item.id}`);
      toast.success('ลบแล้ว');
      fetchItems();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">จัดการวัตถุดิบ</h1>
          <p className="text-muted-foreground">เพิ่ม แก้ไข หรือลบวัตถุดิบในระบบ</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> เพิ่มวัตถุดิบ
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="ค้นหาวัตถุดิบ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">ชื่อ (ไทย)</th>
              <th className="px-4 py-3 text-left font-medium">ชื่อ (อังกฤษ)</th>
              <th className="px-4 py-3 text-left font-medium">หน่วย</th>
              <th className="px-4 py-3 text-right font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : items.length ? (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.nameEn ?? '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.unit ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => remove(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  ไม่พบวัตถุดิบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'แก้ไขวัตถุดิบ' : 'เพิ่มวัตถุดิบ'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">ชื่อ (ไทย)</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="nameEn">ชื่อ (อังกฤษ)</Label>
              <Input
                id="nameEn"
                placeholder="เช่น tomato (ใช้จับคู่กับผลตรวจจับ AI)"
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="unit">หน่วย</Label>
              <Input
                id="unit"
                placeholder="เช่น กรัม, ฟอง, ลูก"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
