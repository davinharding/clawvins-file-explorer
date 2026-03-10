import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import FileTree from '@/components/FileTree';
import type { FileNode } from '@/lib/api';

const nodes: FileNode[] = [
  {
    type: 'dir',
    name: 'docs',
    path: 'docs',
    children: [
      { type: 'file', name: 'readme.md', path: 'docs/readme.md' },
      {
        type: 'dir',
        name: 'guides',
        path: 'docs/guides',
        children: [{ type: 'file', name: 'intro.txt', path: 'docs/guides/intro.txt' }],
      },
    ],
  },
];

function Harness() {
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set(['docs', 'docs/guides']));
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  return (
    <FileTree
      nodes={nodes}
      openNodes={openNodes}
      loadingNodes={new Set()}
      selectedPath={selectedPath}
      focusedPath={focusedPath}
      onToggle={(path) => {
        const next = new Set(openNodes);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        setOpenNodes(next);
      }}
      onSelect={(node) => setSelectedPath(node.path)}
      onFocusPathChange={setFocusedPath}
    />
  );
}

describe('FileTree keyboard navigation', () => {
  it('moves focus with arrow keys and selects on Enter', () => {
    render(<Harness />);

    const tree = screen.getByRole('tree');
    tree.focus();

    fireEvent.keyDown(tree, { key: 'ArrowDown' });
    const readmeButton = screen.getByRole('treeitem', { name: 'readme.md' });
    expect(readmeButton.className).toContain('tree-item-focused');

    fireEvent.keyDown(tree, { key: 'ArrowDown' });
    const guidesButton = screen.getByRole('treeitem', { name: 'guides' });
    expect(guidesButton.className).toContain('tree-item-focused');

    fireEvent.keyDown(tree, { key: 'ArrowDown' });
    const introButton = screen.getByRole('treeitem', { name: 'intro.txt' });
    expect(introButton.className).toContain('tree-item-focused');

    fireEvent.keyDown(tree, { key: 'Enter' });
    expect(introButton.className).toContain('bg-primary/20');
  });
});
