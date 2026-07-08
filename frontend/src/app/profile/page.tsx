'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { SiteShell } from '@/components/site-shell';
import { RouteGuard } from '@/components/route-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/store';
import { api, getErrorMessage } from '@/lib/api';
import { resolveImage } from '@/lib/utils';
import { Loader2, Shield } from 'lucide-react';

function ProfileContent() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await api.patch('/users/profile', { name, avatarUrl });
      setUser(data.data);
      toast.success('บันทึกโปรไฟล์แล้ว');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch('/users/change-password', { currentPassword, newPassword });
      toast.success('เปลี่ยนรหัสผ่านแล้ว');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-8 flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={resolveImage(user?.avatarUrl) ?? undefined} />
          <AvatarFallback className="text-lg">
            {user?.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-display text-2xl font-semibold">{user?.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{user?.email}</span>
            {user?.role.name === 'ADMIN' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                <Shield className="h-3 w-3" /> แอดมิน
              </span>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">ข้อมูลส่วนตัว</TabsTrigger>
          <TabsTrigger value="password">รหัสผ่าน</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลส่วนตัว</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">ชื่อ</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="avatar">ลิงก์รูปโปรไฟล์ (URL)</Label>
                <Input
                  id="avatar"
                  placeholder="https://..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>
              <Button onClick={saveProfile} disabled={savingProfile}>
                {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                บันทึก
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current">รหัสผ่านปัจจุบัน</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new">รหัสผ่านใหม่</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <Button onClick={savePassword} disabled={savingPassword}>
                {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                เปลี่ยนรหัสผ่าน
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <SiteShell>
      <RouteGuard>
        <ProfileContent />
      </RouteGuard>
    </SiteShell>
  );
}
