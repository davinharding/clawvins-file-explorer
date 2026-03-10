import { describe, it, expect } from 'vitest';
import { formatFileSize } from '@/lib/utils';

describe('formatFileSize', () => {
  it('formats bytes into human readable sizes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1048576)).toBe('1.0 MB');
  });

  it('handles invalid input gracefully', () => {
    expect(formatFileSize()).toBe('');
    expect(formatFileSize(null)).toBe('');
    expect(formatFileSize(Number.NaN)).toBe('');
  });
});
