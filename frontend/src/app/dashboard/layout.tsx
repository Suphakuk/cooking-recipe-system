'use client';

import { RouteGuard } from '@/components/route-guard';
import { AdminSidebar } from '@/components/admin-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard adminOnly>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-background">{children}</div>
      </div>
    </RouteGuard>
  );
}
