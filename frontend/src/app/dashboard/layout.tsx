'use client';

import { RouteGuard } from '@/components/route-guard';
import { AdminSidebar } from '@/components/admin-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard adminOnly>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 overflow-x-hidden bg-background">{children}</div>
      </div>
    </RouteGuard>
  );
}
