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

export const difficultyLabel: Record<string, string> = {
  EASY: 'ง่าย',
  MEDIUM: 'ปานกลาง',
  HARD: 'ยาก',
};
