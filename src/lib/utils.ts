import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes?: number | null): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return '';
  if (Math.abs(bytes) < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = Math.abs(bytes);
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const formatted = value >= 10 ? value.toFixed(0) : value.toFixed(1);
  return `${bytes < 0 ? '-' : ''}${formatted} ${units[unitIndex]}`;
}

export function formatRelativeTime(ms?: number | null): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '';
  const diff = Date.now() - ms;
  if (!Number.isFinite(diff)) return '';
  if (diff < 0) return 'just now';

  const second = 1000;
  const minute = 60 * second;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < week) return `${Math.floor(diff / day)}d ago`;
  if (diff < month) return `${Math.floor(diff / week)}w ago`;
  if (diff < year) return `${Math.floor(diff / month)}mo ago`;
  return `${Math.floor(diff / year)}y ago`;
}

export function buildHash(path: string, file: string): string {
  const params = new URLSearchParams();
  if (path) params.set('path', path);
  if (file) params.set('file', file);
  const serialized = params.toString();
  return serialized ? `#${serialized}` : '';
}

export function parseHash(hash: string): { path: string; file: string } {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(normalized);
  return {
    path: params.get('path') ?? '',
    file: params.get('file') ?? '',
  };
}
