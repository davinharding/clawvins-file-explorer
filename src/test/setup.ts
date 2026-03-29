/// <reference types="node" />
import { vi } from 'vitest';

(globalThis as { process?: { env: Record<string, string> } }).process ??= { env: {} };
(globalThis as { process: { env: Record<string, string> } }).process.env.NODE_ENV = 'test';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

if (!('clipboard' in navigator)) {
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
}

if (!('scrollTo' in window)) {
  Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });
}
