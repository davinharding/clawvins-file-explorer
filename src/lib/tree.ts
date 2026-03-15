import type { FileNode } from '@/lib/api';

export const collectDirPaths = (nodes: FileNode[], acc: Set<string>) => {
  nodes.forEach((node) => {
    if (node.type === 'dir') {
      acc.add(node.path);
      if (node.children) collectDirPaths(node.children, acc);
    }
  });
};

export const filterTree = (nodes: FileNode[], query: string): FileNode[] => {
  if (!query) return nodes;
  const q = query.toLowerCase();
  return nodes
    .map((node) => {
      if (node.type === 'dir') {
        const children = node.children ? filterTree(node.children, query) : [];
        if (node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q) || children.length > 0) {
          return { ...node, children };
        }
        return null;
      }
      if (node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q)) return node;
      return null;
    })
    .filter(Boolean) as FileNode[];
};
