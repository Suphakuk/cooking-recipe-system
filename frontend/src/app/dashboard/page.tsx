'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { difficultyLabel } from '@/lib/utils';
import type { DashboardStats } from '@/types';
import { Users, UtensilsCrossed, Carrot, ScanLine, Star, Heart } from 'lucide-react';

const PIE_COLORS = ['#2F5D3A', '#8FB93F', '#D6482E', '#B8926A'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="p-8 text-muted-foreground">โหลดข้อมูลไม่สำเร็จ</div>;
  }

  const statCards = [
    { label: 'ผู้ใช้', value: stats.totals.users, icon: Users, color: 'text-primary' },
    { label: 'สูตรอาหาร', value: stats.totals.recipes, icon: UtensilsCrossed, color: 'text-secondary' },
    { label: 'วัตถุดิบ', value: stats.totals.ingredients, icon: Carrot, color: 'text-accent-foreground' },
    { label: 'การสแกน', value: stats.totals.detections, icon: ScanLine, color: 'text-primary' },
    { label: 'รีวิว', value: stats.totals.reviews, icon: Star, color: 'text-secondary' },
    { label: 'รายการโปรด', value: stats.totals.favorites, icon: Heart, color: 'text-secondary' },
  ];

  const difficultyData = stats.recipesByDifficulty.map((d) => ({
    name: difficultyLabel[d.difficulty] ?? d.difficulty,
    value: d.count,
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold">ภาพรวมระบบ</h1>
        <p className="text-muted-foreground">สรุปข้อมูลและสถิติการใช้งาน</p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <card.icon className={`mb-2 h-6 w-6 ${card.color}`} />
              <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users per day */}
        <Card>
          <CardHeader>
            <CardTitle>ผู้ใช้ใหม่ 7 วันล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.usersPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5DED2" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  fontSize={12}
                  stroke="#8a8175"
                />
                <YAxis allowDecimals={false} fontSize={12} stroke="#8a8175" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2F5D3A"
                  strokeWidth={2.5}
                  dot={{ fill: '#2F5D3A', r: 4 }}
                  name="ผู้ใช้ใหม่"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recipes by difficulty */}
        <Card>
          <CardHeader>
            <CardTitle>สูตรตามระดับความยาก</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={difficultyData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {difficultyData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recipes by category */}
        <Card>
          <CardHeader>
            <CardTitle>สูตรตามหมวดหมู่</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.recipesByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5DED2" />
                <XAxis dataKey="category" fontSize={11} stroke="#8a8175" />
                <YAxis allowDecimals={false} fontSize={12} stroke="#8a8175" />
                <Tooltip />
                <Bar dataKey="count" fill="#8FB93F" radius={[6, 6, 0, 0]} name="จำนวนสูตร" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top recipes */}
        <Card>
          <CardHeader>
            <CardTitle>5 เมนูยอดนิยม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topRecipes.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">{r.title}</span>
                  <span className="text-sm text-muted-foreground">{r.views} ครั้ง</span>
                </div>
              ))}
              {stats.topRecipes.length === 0 && (
                <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
