import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';
import type { FileNode } from '@/lib/api';
import { filterTree } from '@/lib/tree';

const { tree } = vi.hoisted(() => ({
  tree: [
    {
      type: 'dir',
      name: 'docs',
      path: 'docs',
      children: [
        {
          type: 'dir',
          name: 'guides',
          path: 'docs/guides',
          children: [{ type: 'file', name: 'intro.txt', path: 'docs/guides/intro.txt' }],
        },
      ],
    },
    { type: 'file', name: 'image.png', path: 'image.png' },
  ] as FileNode[],
}));

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    listDirectory: vi.fn().mockResolvedValue(tree),
    fetchFileContent: vi.fn().mockResolvedValue('content'),
  };
});

describe('Search and filter', () => {
  it('focuses search input with Ctrl+K', async () => {
    render(<App />);
    await screen.findByText('docs');

    const [input] = screen.getAllByPlaceholderText('Search files') as HTMLInputElement[];
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(document.activeElement).toBe(input);
  });

  it('filters tree nodes by query', async () => {
    const filtered = filterTree(tree, 'intro');

    const hasPath = (nodes: FileNode[], path: string): boolean =>
      nodes.some((node) => node.path === path || (node.children ? hasPath(node.children, path) : false));

    expect(hasPath(filtered, 'docs/guides/intro.txt')).toBe(true);
    expect(hasPath(filtered, 'image.png')).toBe(false);
  });
});
