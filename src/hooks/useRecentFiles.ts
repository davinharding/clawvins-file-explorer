import { useEffect, useMemo, useState } from 'react';
import type { FileNode } from '../lib/fileExplorer';

const RECENT_LIMIT = 10;
const memoryRecentByWorkspace = new Map<string, FileNode[]>();

function keyFor(workspace: string) {
  return `fe.recent.${workspace}`;
}

function loadRecent(workspace: string): FileNode[] {
  try {
    const raw = localStorage.getItem(keyFor(workspace));
    if (!raw) return memoryRecentByWorkspace.get(workspace) ?? [];
    const parsed = JSON.parse(raw) as FileNode[];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return memoryRecentByWorkspace.get(workspace) ?? [];
  }
  return [];
}

function persistRecent(workspace: string, recentFiles: FileNode[]) {
  memoryRecentByWorkspace.set(workspace, recentFiles);
  try {
    localStorage.setItem(keyFor(workspace), JSON.stringify(recentFiles));
  } catch {
    // noop
  }
}

export function useRecentFiles(workspace: string) {
  const [recentFiles, setRecentFiles] = useState<FileNode[]>(() => loadRecent(workspace));

  useEffect(() => {
    setRecentFiles(loadRecent(workspace));
  }, [workspace]);

  useEffect(() => {
    persistRecent(workspace, recentFiles);
  }, [workspace, recentFiles]);

  const api = useMemo(() => ({
    addRecent: (node: FileNode) => {
      setRecentFiles((prev) => {
        const next = [node, ...prev.filter((item) => item.path !== node.path)].slice(0, RECENT_LIMIT);
        return next;
      });
    },
    removeRecent: (path: string) => {
      setRecentFiles((prev) => prev.filter((item) => item.path !== path));
    },
  }), []);

  return { recentFiles, addRecent: api.addRecent, removeRecent: api.removeRecent };
}
