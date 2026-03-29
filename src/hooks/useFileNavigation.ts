import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';

import type { BreadcrumbItem } from '@/components/Breadcrumbs';
import type { FileNode } from '@/lib/api';
import { buildHash, parseHash } from '@/lib/utils';

const getParentPath = (p: string) => {
  if (!p) return '';
  const parts = p.split('/');
  parts.pop();
  return parts.join('/');
};

const buildBreadcrumbs = (p: string): BreadcrumbItem[] => {
  if (!p) return [];
  const parts = p.split('/');
  const crumbs: BreadcrumbItem[] = [];
  parts.forEach((part, idx) => {
    crumbs.push({
      label: part,
      path: parts.slice(0, idx + 1).join('/'),
    });
  });
  return crumbs;
};

function findNode(nodes: FileNode[], p: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === p) return node;
    if (node.children) {
      const found = findNode(node.children, p);
      if (found) return found;
    }
  }
  return null;
}

type UseFileNavigationArgs = {
  tree: FileNode[];
  workspace: string;
  loadDirectory: (path: string) => Promise<void>;
  setRecentFiles?: (node: FileNode) => void;
  isMobile?: boolean;
  onCloseDrawer?: () => void;
};

export function useFileNavigation({
  tree,
  workspace,
  loadDirectory,
  setRecentFiles,
  isMobile = false,
  onCloseDrawer,
}: UseFileNavigationArgs) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set());
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  const breadcrumbs = useMemo(() => buildBreadcrumbs(currentPath), [currentPath]);

  const handleNavigate = useCallback(
    (p: string) => {
      startTransition(() => {
        setSelectedFile(null);
      });
      setCurrentPath(p);
      setOpenNodes((prev) => {
        const next = new Set(prev);
        if (p) next.add(p);
        return next;
      });
      const target = findNode(tree, p);
      if (target?.type === 'dir' && target.children === undefined && !loadingNodes.has(p)) {
        void loadDirectory(p);
      }
    },
    [loadDirectory, loadingNodes, tree]
  );

  const expandAncestors = useCallback(
    async (filePath: string) => {
      const parts = filePath.split('/');
      if (parts.length <= 1) return;

      for (let i = 1; i < parts.length; i += 1) {
        const ancestorPath = parts.slice(0, i).join('/');

        setOpenNodes((prev) => {
          const next = new Set(prev);
          next.add(ancestorPath);
          return next;
        });

        const ancestorNode = findNode(tree, ancestorPath);
        if (ancestorNode?.type === 'dir' && ancestorNode.children === undefined) {
          await loadDirectory(ancestorPath);
        }
      }
    },
    [loadDirectory, tree]
  );

  const handleSelect = useCallback(
    async (node: FileNode) => {
      if (node.type === 'dir') {
        handleNavigate(node.path);
      } else {
        await expandAncestors(node.path);
        startTransition(() => {
          setSelectedFile(node);
        });
        setCurrentPath(getParentPath(node.path));
      }

      if (node.type === 'file') {
        setRecentFiles?.(node);
      }
      if (isMobile && node.type === 'file') {
        onCloseDrawer?.();
      }
    },
    [expandAncestors, handleNavigate, isMobile, onCloseDrawer, setRecentFiles]
  );

  useEffect(() => {
    const parsed = parseHash(window.location.hash);
    if (parsed.path) {
      setCurrentPath(parsed.path);
      setOpenNodes(new Set(parsed.path.split('/').filter(Boolean).map((_part, idx, parts) => parts.slice(0, idx + 1).join('/'))));
    }
    if (parsed.file) {
      const node = findNode(tree, parsed.file);
      if (node && node.type === 'file') {
        setSelectedFile(node);
      }
    }
  }, [tree]);

  useEffect(() => {
    const nextHash = buildHash(currentPath, selectedFile?.path ?? '');
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  }, [currentPath, selectedFile?.path, workspace]);

  useEffect(() => {
    const onPopState = () => {
      const parsed = parseHash(window.location.hash);
      setCurrentPath(parsed.path ?? '');
      if (parsed.file) {
        const node = findNode(tree, parsed.file);
        if (node && node.type === 'file') {
          setSelectedFile(node);
        } else {
          setSelectedFile(null);
        }
      } else {
        setSelectedFile(null);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [tree]);

  return {
    currentPath,
    selectedFile,
    openNodes,
    loadingNodes,
    breadcrumbs,
    setCurrentPath,
    setSelectedFile,
    setOpenNodes,
    setLoadingNodes,
    handleNavigate,
    expandAncestors,
    handleSelect,
  };
}
