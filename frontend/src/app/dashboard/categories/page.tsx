'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api, getErrorMessage } from '@/lib/api';
import type { Category } from '@/types';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      setItems(data.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setDialogOpen(true);
  };

  const openEdit = (item: Category) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description ?? '' });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('กรุณากรอกชื่อหมวดหมู่');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/categories/${editing.id}`, form);
        toast.success('แก้ไขหมวดหมู่แล้ว');
      } else {
        await api.post('/categories', form);
        toast.success('เพิ่มหมวดหมู่แล้ว');
      }
      setDialogOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Category) => {
    if (!confirm(`ลบหมวดหมู่ "${item.name}"?`)) return;
    try {
      await api.delete(`/categories/${item.id}`);
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
          <h1 className="font-display text-3xl font-semibold">จัดการหมวดหมู่</h1>
          <p className="text-muted-foreground">จัดหมวดหมู่ให้สูตรอาหาร</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> เพิ่มหมวดหมู่
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground">กำลังโหลด...</p>
        ) : items.length ? (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-lg border border-border bg-card p-5 card-shadow"
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-display text-lg font-semibold">{item.name}</h3>
                <div className="flex gap-1">
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
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {item._count?.recipes ?? 0} สูตร
              </p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">ยังไม่มีหมวดหมู่</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">ชื่อหมวดหมู่</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
