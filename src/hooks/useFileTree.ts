import { useCallback, useEffect, useMemo, useState } from 'react';

import { listDirectory, type FileNode } from '@/lib/api';
import { collectDirPaths, filterTree } from '@/lib/tree';

type UseFileTreeArgs = {
  workspace: string;
  search: string;
  setLoadingNodes?: React.Dispatch<React.SetStateAction<Set<string>>>;
};

const updateNodeChildren = (nodes: FileNode[], p: string, children: FileNode[]): FileNode[] => {
  return nodes.map((node) => {
    if (node.path === p) {
      return { ...node, children };
    }
    if (node.children) {
      return { ...node, children: updateNodeChildren(node.children, p, children) };
    }
    return node;
  });
};

export function useFileTree({ workspace, search, setLoadingNodes }: UseFileTreeArgs) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);

  const loadDirectory = useCallback(
    async (path: string) => {
      setLoadingNodes?.((prev) => {
        const next = new Set(prev);
        next.add(path);
        return next;
      });
      try {
        const children = await listDirectory(path, workspace);
        setTree((prev) => updateNodeChildren(prev, path, children));
      } catch (error) {
        setTreeError((error as Error).message);
      } finally {
        setLoadingNodes?.((prev) => {
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
      }
    },
    [setLoadingNodes, workspace]
  );

  useEffect(() => {
    let active = true;
    setTreeLoading(true);
    setTreeError(null);

    void (async () => {
      try {
        const rootNodes = await listDirectory('', workspace);
        if (!active) return;
        setTree(rootNodes);
      } catch (error) {
        if (!active) return;
        setTreeError((error as Error).message);
        setTree([]);
      } finally {
        if (active) setTreeLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [workspace]);

  const filteredTree = useMemo(() => filterTree(tree, search), [search, tree]);

  const searchOpenNodes = useMemo(() => {
    if (!search) return new Set<string>();
    const all = new Set<string>();
    collectDirPaths(filteredTree, all);
    return all;
  }, [filteredTree, search]);

  return {
    tree,
    treeLoading,
    treeError,
    loadDirectory,
    filteredTree,
    searchOpenNodes,
    setTree,
    setTreeError,
  };
}
