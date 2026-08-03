import type { Metadata } from 'next';
import { Jost, Caveat } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jost',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-caveat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ครัวเปิดตู้ · Cooking Recipe Recommendation',
  description: 'บอกว่าในตู้เย็นมีอะไร แล้วเราจะบอกว่าทำอะไรกินได้',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${jost.variable} ${caveat.variable}`}>
      <body className="bg-paper min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
