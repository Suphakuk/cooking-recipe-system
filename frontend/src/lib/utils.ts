import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';

// Resolve a stored image path (e.g. "/uploads/x.jpg") to a full URL
export function resolveImage(url?: string | null): string | null {
  if (!url) return null;
  // base64 data URLs and absolute http(s) URLs are used as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  return `${SERVER_URL}${url}`;
}

export function formatMinutes(min: number): string {
  if (min <= 0) return '-';
  if (min < 60) return `${min} นาที`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ชม. ${m} นาที` : `${h} ชม.`;
}

// Convert a YouTube watch/share URL into an embeddable iframe URL.
// Returns null if the URL isn't a recognizable YouTube link — callers
// should fall back to a plain link instead of embedding an iframe.
export function getYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (u.pathname.startsWith('/embed/')) {
        return url; // already an embed URL
      }
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export const difficultyLabel: Record<string, string> = {
  EASY: 'ง่าย',
  MEDIUM: 'ปานกลาง',
  HARD: 'ยาก',
};
