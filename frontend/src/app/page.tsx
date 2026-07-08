'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { Button } from '@/components/ui/button';
import { RecipeCard } from '@/components/recipe-card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import type { Recipe } from '@/types';
import { Sparkles, Search, ScanLine, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/recipes', { params: { limit: 6, sort: 'popular' } })
      .then((res) => setRecipes(res.data.data))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center gap-6 animate-fade-up">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              เปิดตู้เย็น แล้วให้เราคิดเมนูให้
            </span>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] md:text-6xl">
              มีของอยู่ในตู้
              <br />
              <span className="text-primary">ทำอะไรกินดี?</span>
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              เลือกวัตถุดิบที่มีอยู่ แล้วเราจะแนะนำเมนูที่ทำได้ทันที พร้อมบอกว่าขาดอะไรบ้าง
              ไม่ต้องเสียของ ไม่ต้องคิดนาน
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/recommend">
                  เริ่มเลือกวัตถุดิบ <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/recipes">ดูสูตรทั้งหมด</Link>
              </Button>
            </div>
          </div>

          {/* Signature visual: a cutting board of ingredient chips */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 card-shadow">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-lg font-semibold">เขียงของฉัน</span>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  5 อย่าง
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['🍅 มะเขือเทศ', '🥚 ไข่ไก่', '🧄 กระเทียม', '🌶️ พริก', '🧅 หัวหอม', '🍚 ข้าวสวย', '🥩 หมู'].map(
                  (chip, i) => (
                    <span
                      key={chip}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-sm shadow-sm"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      {chip}
                    </span>
                  )
                )}
              </div>
              <div className="mt-5 rounded-xl bg-primary/5 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">ผัดกะเพราหมูสับ</span>
                  <span className="text-primary font-semibold">ทำได้ 100%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-full rounded-full bg-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-background">
        <div className="container grid gap-6 py-14 md:grid-cols-3">
          {[
            { icon: ScanLine, title: 'ถ่ายรูปวัตถุดิบ', desc: 'อัปโหลดรูป ระบบจะช่วยระบุวัตถุดิบให้ (เชื่อมต่อ AI ได้ภายหลัง)' },
            { icon: Search, title: 'เลือกสิ่งที่มี', desc: 'แตะเลือกวัตถุดิบในตู้เย็นของคุณจากรายการ' },
            { icon: Sparkles, title: 'รับเมนูแนะนำ', desc: 'ดูเมนูที่ทำได้ เรียงตามความเข้ากันของวัตถุดิบ' },
          ].map((step) => (
            <div key={step.title} className="flex flex-col gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold">เมนูยอดนิยม</h2>
            <p className="text-muted-foreground">สูตรที่คนดูมากที่สุด</p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/recipes">
              ดูทั้งหมด <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : recipes.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">ยังไม่มีสูตรอาหาร — เข้าสู่ระบบแอดมินเพื่อเพิ่มสูตร</p>
        )}
      </section>
    </SiteShell>
  );
}
