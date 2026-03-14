import { useEffect, useMemo, useRef, useCallback, type FocusEvent, type KeyboardEvent } from 'react';
import { ChevronDown, ChevronRight, File, FileCode2, FileImage, FileText, Folder, FolderOpen } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn, formatFileSize, formatRelativeTime } from '@/lib/utils';
import type { FileNode } from '@/lib/api';

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
const CODE_EXT = ['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'scss', 'md', 'yml', 'yaml', 'py', 'go', 'rs', 'java', 'php', 'sql', 'sh', 'toml'];

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext) return File;
  if (IMAGE_EXT.includes(ext)) return FileImage;
  if (ext === 'md') return FileText;
  if (CODE_EXT.includes(ext)) return FileCode2;
  return File;
};

type FileTreeProps = {
  nodes: FileNode[];
  openNodes: Set<string>;
  loadingNodes: Set<string>;
  selectedPath?: string | null;
  focusedPath?: string | null;
  onToggle: (path: string) => void;
  onSelect: (node: FileNode) => void;
  onFocusPathChange: (path: string | null) => void;
};

type VisibleNode = {
  node: FileNode;
  depth: number;
  parentPath: string | null;
};

const buildVisibleNodes = (nodes: FileNode[], openNodes: Set<string>) => {
  const acc: VisibleNode[] = [];

  const walk = (items: FileNode[], depth: number, parentPath: string | null) => {
    items.forEach((node) => {
      acc.push({ node, depth, parentPath });
      if (node.type === 'dir' && openNodes.has(node.path) && node.children && node.children.length > 0) {
        walk(node.children, depth + 1, node.path);
      }
    });
  };

  walk(nodes, 0, null);
  return acc;
};

export default function FileTree({
  nodes,
  openNodes,
  loadingNodes,
  selectedPath,
  focusedPath,
  onToggle,
  onSelect,
  onFocusPathChange,
}: FileTreeProps) {
  const visibleNodes = useMemo(() => buildVisibleNodes(nodes, openNodes), [nodes, openNodes]);
  const indexByPath = useMemo(
    () => new Map(visibleNodes.map((item, index) => [item.node.path, index])),
    [visibleNodes]
  );
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (visibleNodes.length === 0) {
      if (focusedPath) onFocusPathChange(null);
      return;
    }

    if (!focusedPath || !indexByPath.has(focusedPath)) {
      onFocusPathChange(visibleNodes[0].node.path);
    }
  }, [focusedPath, indexByPath, onFocusPathChange, visibleNodes]);

  const focusByIndex = useCallback(
    (index: number) => {
      const item = visibleNodes[index];
      if (!item) return;
      onFocusPathChange(item.node.path);
      const element = itemRefs.current[index];
      if (element) element.focus();
    },
    [onFocusPathChange, visibleNodes]
  );

  const findFirstChildIndex = useCallback(
    (startIndex: number) => {
      const startDepth = visibleNodes[startIndex]?.depth ?? 0;
      const startPath = visibleNodes[startIndex]?.node.path;
      if (!startPath) return null;

      for (let i = startIndex + 1; i < visibleNodes.length; i += 1) {
        if (visibleNodes[i].depth <= startDepth) break;
        if (visibleNodes[i].parentPath === startPath) return i;
      }
      return null;
    },
    [visibleNodes]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (visibleNodes.length === 0) return;

      const currentIndex = focusedPath && indexByPath.has(focusedPath)
        ? indexByPath.get(focusedPath) ?? 0
        : 0;
      const currentItem = visibleNodes[currentIndex];
      const currentNode = currentItem?.node;

      let handled = false;
      let nextIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          nextIndex = Math.min(currentIndex + 1, visibleNodes.length - 1);
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
          nextIndex = visibleNodes.length - 1;
          handled = true;
          break;
        case 'ArrowRight':
          if (currentNode?.type === 'dir') {
            const isOpen = openNodes.has(currentNode.path);
            if (!isOpen) {
              onToggle(currentNode.path);
              handled = true;
            } else {
              const childIndex = findFirstChildIndex(currentIndex);
              if (childIndex !== null) {
                nextIndex = childIndex;
                handled = true;
              }
            }
          }
          break;
        case 'ArrowLeft':
          if (currentNode?.type === 'dir' && openNodes.has(currentNode.path)) {
            onToggle(currentNode.path);
            handled = true;
          } else if (currentItem?.parentPath) {
            const parentIndex = indexByPath.get(currentItem.parentPath);
            if (parentIndex !== undefined) {
              nextIndex = parentIndex;
              handled = true;
            }
          }
          break;
        case 'Enter':
          if (currentNode) {
            if (currentNode.type === 'dir') {
              onToggle(currentNode.path);
            }
            onSelect(currentNode);
            handled = true;
          }
          break;
        default:
          break;
      }

      if (!handled) return;

      event.preventDefault();
      event.stopPropagation();

      if (nextIndex !== currentIndex) {
        focusByIndex(nextIndex);
      }
    },
    [findFirstChildIndex, focusByIndex, focusedPath, indexByPath, onSelect, onToggle, openNodes, visibleNodes]
  );

  const handleContainerFocus = useCallback(
    (event: FocusEvent<HTMLUListElement>) => {
      if (event.target !== event.currentTarget) return;
      if (visibleNodes.length === 0) return;

      const index = focusedPath && indexByPath.has(focusedPath)
        ? indexByPath.get(focusedPath) ?? 0
        : 0;
      const element = itemRefs.current[index];
      if (element) element.focus();
    },
    [focusedPath, indexByPath, visibleNodes]
  );

  const renderNodes = (items: FileNode[], depth: number) => {
    return (
      <ul
        className={cn('space-y-1', depth === 0 ? 'pl-0' : 'pl-4')}
        role={depth === 0 ? 'tree' : 'group'}
        tabIndex={depth === 0 ? 0 : undefined}
        onKeyDown={depth === 0 ? handleKeyDown : undefined}
        onFocus={depth === 0 ? handleContainerFocus : undefined}
      >
        {items.map((node) => {
          const isDir = node.type === 'dir';
          const isOpen = openNodes.has(node.path);
          const isLoading = loadingNodes.has(node.path);
          const isActive = selectedPath === node.path;
          const isFocused = focusedPath === node.path;
          const Icon = isDir ? (isOpen ? FolderOpen : Folder) : getFileIcon(node.name);
          const index = indexByPath.get(node.path);
          const relativeTime = formatRelativeTime(node.mtime);

          const commonButtonProps = {
            ref: index !== undefined
              ? (el: HTMLButtonElement | null) => {
                itemRefs.current[index] = el;
              }
              : undefined,
            role: 'treeitem',
            'aria-expanded': isDir ? isOpen : undefined,
            tabIndex: -1,
            onKeyDown: handleKeyDown,
            onFocus: () => onFocusPathChange(node.path),
            onClick: () => {
              onFocusPathChange(node.path);
              onSelect(node);
            },
          } as const;

          if (isDir) {
            return (
              <li key={node.path}>
                <Collapsible open={isOpen} onOpenChange={() => onToggle(node.path)}>
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors',
                      isActive ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-muted/60'
                    )}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'tree-item flex w-full min-h-11 items-center justify-start gap-2 px-1 py-2 text-left md:min-h-0 md:py-1.5',
                          isFocused && 'tree-item-focused'
                        )}
                        {...commonButtonProps}
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="truncate font-semibold text-foreground">{node.name}</span>
                        {isLoading ? <Badge variant="outline">Loading</Badge> : null}
                        {(() => {
                          const countLabel = typeof node.childCount === 'number' && node.childCount > 0
                            ? `${node.childCount}`
                            : '';
                          const meta = countLabel && relativeTime
                            ? `${countLabel} · ${relativeTime}`
                            : countLabel || relativeTime;
                          return meta ? (
                            <span className="ml-auto text-xs text-muted-foreground">{meta}</span>
                          ) : null;
                        })()}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="pt-1">
                    {node.children && node.children.length > 0 ? (
                      renderNodes(node.children, depth + 1)
                    ) : (
                      <div className="pl-8 text-xs text-muted-foreground">Empty</div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </li>
            );
          }

          return (
            <li key={node.path}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  'tree-item flex w-full min-h-11 items-center justify-start gap-2 rounded-lg px-2 py-2 text-left text-sm md:min-h-0 md:py-1.5',
                  isActive ? 'bg-primary/20 text-foreground' : 'text-muted-foreground hover:bg-muted/60',
                  isFocused && 'tree-item-focused'
                )}
                {...commonButtonProps}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{node.name}</span>
                {(() => {
                  const sizeLabel = typeof node.size === 'number' ? formatFileSize(node.size) : '';
                  const meta = sizeLabel && relativeTime
                    ? `${sizeLabel} · ${relativeTime}`
                    : sizeLabel || relativeTime;
                  return meta ? (
                    <span className="ml-auto text-xs text-muted-foreground">{meta}</span>
                  ) : null;
                })()}
              </Button>
            </li>
          );
        })}
      </ul>
    );
  };

  return renderNodes(nodes, 0);
}
