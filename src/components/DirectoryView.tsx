import { useCallback, useEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import { Folder, FolderOpen } from 'lucide-react';

import { getFileIcon, isImageFile } from '@/lib/icons';
import { buildWorkspaceFileUrl } from '@/lib/api';
import { formatFileSize, formatRelativeTime } from '@/lib/utils';
import type { FileNode } from '@/lib/api';

type DirectoryViewProps = {
  entries: FileNode[];
  workspace?: string | null;
  viewMode: 'grid' | 'list';
  onOpenFile: (node: FileNode) => void;
  onOpenDirectory: (node: FileNode) => void;
  sortBy: 'name' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
  path?: string;
  loading?: boolean;
};

type VisibleNode = {
  node: FileNode;
};

const buildVisibleNodes = (nodes: FileNode[]) => nodes.map((node) => ({ node } as VisibleNode));

const GRID_ITEM_MIN_WIDTH = 240;

export default function DirectoryView({
  entries,
  workspace,
  viewMode,
  onOpenFile,
  onOpenDirectory,
  sortBy,
  sortOrder,
}: DirectoryViewProps) {
  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;

        let comparison = 0;

        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'date') {
          const aTime = a.mtime ? Date.parse(a.mtime) : 0;
          const bTime = b.mtime ? Date.parse(b.mtime) : 0;
          comparison = aTime - bTime;
        } else {
          const aSize = a.type === 'file' ? a.size ?? 0 : 0;
          const bSize = b.type === 'file' ? b.size ?? 0 : 0;
          comparison = aSize - bSize;
        }

        if (comparison === 0) {
          comparison = a.name.localeCompare(b.name);
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      }),
    [entries, sortBy, sortOrder]
  );

  const visibleNodes = useMemo(() => buildVisibleNodes(sortedEntries), [sortedEntries]);
  const indexByPath = useMemo(
    () => new Map(visibleNodes.map((item, index) => [item.node.path, index])),
    [visibleNodes]
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (visibleNodes.length === 0) {
      focusedPathRef.current = null;
      return;
    }

    if (!focusedPathRef.current || !indexByPath.has(focusedPathRef.current)) {
      focusedPathRef.current = visibleNodes[0].node.path;
    }
  }, [indexByPath, visibleNodes]);

  const focusByIndex = useCallback(
    (index: number) => {
      const item = visibleNodes[index];
      if (!item) return;
      focusedPathRef.current = item.node.path;
      const element = itemRefs.current[index];
      if (element) {
        element.focus();
      }
    },
    [visibleNodes]
  );

  const getGridColumnCount = useCallback(() => {
    const container = containerRef.current;
    if (!container) return 1;
    const width = container.clientWidth;
    if (!width || Number.isNaN(width)) return 1;
    return Math.max(1, Math.floor(width / GRID_ITEM_MIN_WIDTH));
  }, []);

  const openEntry = useCallback(
    (node: FileNode) => {
      if (node.type === 'dir') {
        onOpenDirectory(node);
      } else {
        onOpenFile(node);
      }
    },
    [onOpenDirectory, onOpenFile]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (visibleNodes.length === 0) return;

      const currentIndex = focusedPathRef.current && indexByPath.has(focusedPathRef.current)
        ? indexByPath.get(focusedPathRef.current) ?? 0
        : 0;
      const lastIndex = visibleNodes.length - 1;
      let nextIndex = currentIndex;
      let handled = false;

      if (viewMode === 'list') {
        switch (event.key) {
          case 'ArrowDown':
            nextIndex = Math.min(currentIndex + 1, lastIndex);
            handled = true;
            break;
          case 'ArrowUp':
            nextIndex = Math.max(currentIndex - 1, 0);
            handled = true;
            break;
          case 'Home':
            nextIndex = 0;
            handled = true;
            break;
          case 'End':
            nextIndex = lastIndex;
            handled = true;
            break;
          case 'Enter': {
            const node = visibleNodes[currentIndex]?.node;
            if (node) {
              openEntry(node);
              handled = true;
            }
            break;
          }
          default:
            break;
        }
      } else {
        const cols = getGridColumnCount();

        switch (event.key) {
          case 'ArrowRight':
            nextIndex = Math.min(currentIndex + 1, lastIndex);
            handled = true;
            break;
          case 'ArrowLeft':
            nextIndex = Math.max(currentIndex - 1, 0);
            handled = true;
            break;
          case 'ArrowDown':
            nextIndex = Math.min(currentIndex + cols, lastIndex);
            handled = true;
            break;
          case 'ArrowUp':
            nextIndex = Math.max(currentIndex - cols, 0);
            handled = true;
            break;
          case 'Home':
            nextIndex = 0;
            handled = true;
            break;
          case 'End':
            nextIndex = lastIndex;
            handled = true;
            break;
          case 'Enter': {
            const node = visibleNodes[currentIndex]?.node;
            if (node) {
              openEntry(node);
              handled = true;
            }
            break;
          }
          default:
            break;
        }
      }

      if (!handled) return;

      event.preventDefault();
      if (nextIndex !== currentIndex || event.key !== 'Enter') {
        focusByIndex(nextIndex);
      }
    },
    [focusByIndex, getGridColumnCount, indexByPath, openEntry, viewMode, visibleNodes]
  );

  const handleItemFocus = useCallback((path: string) => {
    focusedPathRef.current = path;
  }, []);

  if (sortedEntries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-card/40 p-10 text-center text-sm text-muted-foreground">
        This directory is empty.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      role={viewMode === 'grid' ? 'grid' : 'listbox'}
      aria-label="Directory contents"
      className="outline-none"
      tabIndex={-1}
    >
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {sortedEntries.map((node, index) => {
            const Icon = node.type === 'dir' ? FolderOpen : getFileIcon(node.name);
            const metaLabel =
              node.type === 'dir'
                ? `${node.childCount ?? 0} items`
                : `${formatFileSize(node.size)} · ${formatRelativeTime(node.mtime) || '—'}`;
            const isFocused = focusedPathRef.current === node.path;

            return (
              <button
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                key={node.path}
                type="button"
                onClick={() => openEntry(node)}
                onFocus={() => handleItemFocus(node.path)}
                className={`dir-item flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-left transition hover:border-primary/60 hover:bg-card ${isFocused ? 'dir-item-focused' : ''}`}
                title={node.path}
                tabIndex={isFocused ? 0 : -1}
                aria-selected={isFocused}
                role="gridcell"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/60 overflow-hidden">
                  {node.type === 'file' && isImageFile(node.name) && workspace ? (
                    <img
                      src={buildWorkspaceFileUrl(node.path, workspace)}
                      alt={node.name}
                      className="h-10 w-10 object-cover rounded-xl"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const icon = target.nextElementSibling as HTMLElement;
                        if (icon) icon.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <Icon
                    className={
                      node.type === 'dir'
                        ? 'h-5 w-5 text-primary'
                        : 'h-5 w-5 text-muted-foreground'
                    }
                    style={{
                      display: node.type === 'file' && isImageFile(node.name) && workspace ? 'none' : 'block'
                    }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {node.name}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {metaLabel}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {sortedEntries.map((node, index) => {
            const Icon = node.type === 'dir' ? Folder : getFileIcon(node.name);
            const sizeLabel = node.type === 'file' ? formatFileSize(node.size) : '—';
            const timeLabel = formatRelativeTime(node.mtime) || '—';
            const isFocused = focusedPathRef.current === node.path;

            return (
              <button
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                key={node.path}
                type="button"
                onClick={() => openEntry(node)}
                onFocus={() => handleItemFocus(node.path)}
                className={`dir-item flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-muted/50 ${isFocused ? 'dir-item-focused' : ''}`}
                title={node.path}
                tabIndex={isFocused ? 0 : -1}
                aria-selected={isFocused}
                role="option"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-background/60 overflow-hidden">
                  {node.type === 'file' && isImageFile(node.name) && workspace ? (
                    <img
                      src={buildWorkspaceFileUrl(node.path, workspace)}
                      alt={node.name}
                      className="h-8 w-8 object-cover rounded-md"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const icon = target.nextElementSibling as HTMLElement;
                        if (icon) icon.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <Icon
                    className={
                      node.type === 'dir'
                        ? 'h-4 w-4 text-primary'
                        : 'h-4 w-4 text-muted-foreground'
                    }
                    style={{
                      display: node.type === 'file' && isImageFile(node.name) && workspace ? 'none' : 'block'
                    }}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{node.name}</p>
                  <p className="text-xs text-muted-foreground">{node.type === 'dir' ? 'Directory' : sizeLabel}</p>
                </div>
                <div className="text-xs text-muted-foreground">{timeLabel}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
