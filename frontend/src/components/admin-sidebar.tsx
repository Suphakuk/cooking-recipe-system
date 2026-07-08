'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Carrot,
  FolderTree,
  Users,
  ChefHat,
  Home,
} from 'lucide-react';

const links = [
  { href: '/dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  { href: '/dashboard/recipes', label: 'จัดการสูตรอาหาร', icon: UtensilsCrossed },
  { href: '/dashboard/ingredients', label: 'จัดการวัตถุดิบ', icon: Carrot },
  { href: '/dashboard/categories', label: 'จัดการหมวดหมู่', icon: FolderTree },
  { href: '/dashboard/users', label: 'จัดการผู้ใช้', icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ChefHat className="h-4 w-4" />
        </span>
        <span className="font-display text-lg font-semibold">แอดมิน</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const active =
            link.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          กลับสู่หน้าเว็บ
        </Link>
      </div>
    </aside>
  );
}
