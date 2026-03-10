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
      { type: 'file', name: 'readme.md', path: 'docs/readme.md', size: 2048 },
      {
        type: 'dir',
        name: 'guides',
        path: 'docs/guides',
        children: [{ type: 'file', name: 'intro.txt', path: 'docs/guides/intro.txt' }],
      },
    ],
  },
  { type: 'file', name: 'image.png', path: 'image.png', size: 1536 },
];

function Harness() {
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set(['docs']));
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

describe('FileTree', () => {
  it('renders nested nodes when expanded and collapses on toggle', () => {
    render(<Harness />);

    expect(screen.getByText('readme.md')).not.toBeNull();
    const docsButton = screen.getByRole('treeitem', { name: 'docs' });

    fireEvent.click(docsButton);
    expect(screen.queryByText('readme.md')).toBeNull();

    fireEvent.click(docsButton);
    expect(screen.getByText('readme.md')).not.toBeNull();
  });

  it('shows formatted file sizes for file nodes', () => {
    render(<Harness />);
    expect(screen.getAllByText('1.5 KB').length).toBeGreaterThan(0);
  });
});
