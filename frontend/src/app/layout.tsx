import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ครัวเปิดตู้ · Cooking Recipe Recommendation',
  description: 'บอกว่าในตู้เย็นมีอะไร แล้วเราจะบอกว่าทำอะไรกินได้',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body className="bg-paper min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
