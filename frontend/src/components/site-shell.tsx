import { Navbar } from '@/components/navbar';
import { ChefHat } from 'lucide-react';

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-background">
        <div className="container flex flex-col items-center justify-between gap-3 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">ครัวเปิดตู้</span>
          </div>
          <p>© {new Date().getFullYear()} Cooking Recipe Recommendation System</p>
        </div>
      </footer>
    </div>
  );
}
