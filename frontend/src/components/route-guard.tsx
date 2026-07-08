'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function RouteGuard({ children, adminOnly = false }: Props) {
  const { user, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.replace('/login');
    } else if (adminOnly && user.role.name !== 'ADMIN') {
      router.replace('/');
    }
  }, [user, initialized, adminOnly, router]);

  if (!initialized || !user || (adminOnly && user.role.name !== 'ADMIN')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
