'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/store';
import { api, getErrorMessage } from '@/lib/api';
import { resolveImage } from '@/lib/utils';
import type { User } from '@/types';
import { Search, Loader2, Trash2, ShieldCheck, ShieldOff, Shield } from 'lucide-react';

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', {
        params: { page, limit: 12, search: search || undefined },
      });
      setUsers(data.data);
      setTotalPages(data.meta.totalPages);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const changeRole = async (u: User, roleName: string) => {
    setBusyId(u.id);
    try {
      await api.patch(`/users/${u.id}`, { role: roleName });
      toast.success(`เปลี่ยนสิทธิ์ ${u.name} เป็น ${roleName === 'ADMIN' ? 'แอดมิน' : 'ผู้ใช้'} แล้ว`);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (u: User) => {
    setBusyId(u.id);
    try {
      await api.patch(`/users/${u.id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'ระงับผู้ใช้แล้ว' : 'เปิดใช้งานผู้ใช้แล้ว');
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (u: User) => {
    if (!confirm(`ลบผู้ใช้ "${u.name}"? การกระทำนี้ย้อนกลับไม่ได้`)) return;
    setBusyId(u.id);
    try {
      await api.delete(`/users/${u.id}`);
      toast.success('ลบผู้ใช้แล้ว');
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold">จัดการผู้ใช้</h1>
        <p className="text-muted-foreground">ดูแลบัญชีผู้ใช้ กำหนดสิทธิ์ และระงับการใช้งาน</p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="ค้นหาผู้ใช้ (ชื่อ/อีเมล)..."
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
              <th className="px-4 py-3 text-left font-medium">ผู้ใช้</th>
              <th className="px-4 py-3 text-left font-medium">สถานะ</th>
              <th className="px-4 py-3 text-left font-medium">สิทธิ์</th>
              <th className="px-4 py-3 text-right font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : users.length ? (
              users.map((u) => {
                const isSelf = me?.id === u.id;
                return (
                  <tr key={u.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={resolveImage(u.avatarUrl) ?? undefined} />
                          <AvatarFallback>{u.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {u.name}
                            {isSelf && <span className="ml-1 text-xs text-muted-foreground">(คุณ)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <Badge variant="accent">ใช้งานอยู่</Badge>
                      ) : (
                        <Badge variant="tomato">ถูกระงับ</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={u.role.name}
                        onValueChange={(v) => changeRole(u, v)}
                        disabled={isSelf || busyId === u.id}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">
                            <span className="flex items-center gap-1.5">
                              <Shield className="h-3.5 w-3.5" /> ผู้ใช้
                            </span>
                          </SelectItem>
                          <SelectItem value="ADMIN">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5" /> แอดมิน
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isSelf || busyId === u.id}
                          onClick={() => toggleActive(u)}
                          title={u.isActive ? 'ระงับ' : 'เปิดใช้งาน'}
                        >
                          {u.isActive ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          disabled={isSelf || busyId === u.id}
                          onClick={() => remove(u)}
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
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  ไม่พบผู้ใช้
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
