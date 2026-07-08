'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useAuth } from '@/lib/store';

export function Providers({ children }: { children: React.ReactNode }) {
  const loadMe = useAuth((s) => s.loadMe);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  return (
    <>
      {children}
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: { fontFamily: 'var(--font-jakarta)' },
        }}
      />
    </>
  );
}
