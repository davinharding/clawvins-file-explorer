import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Folder } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFileIcon } from '@/lib/icons';
import { cn, formatFileSize, formatRelativeTime } from '@/lib/utils';
import type { FileNode } from '@/lib/api';

const getMetaLabel = (sizeLabel: string, timeLabel: string) => {
  if (!sizeLabel && !timeLabel) return '—';
  if (!sizeLabel) return timeLabel;
  if (!timeLabel) return sizeLabel;
  return `${sizeLabel} · ${timeLabel}`;
};

type DirectoryViewProps = {
  path: string;
  entries: FileNode[];
  loading?: boolean;
  onOpenFile: (node: FileNode) => void;
  onOpenDirectory: (node: FileNode) => void;
};

type SortField = 'name' | 'size' | 'modified' | 'type';
type SortDir = 'asc' | 'desc';

const SORT_STORAGE_KEY = 'fe_dir_sort';

const sortButtons: { field: SortField; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'size', label: 'Size' },
  { field: 'modified', label: 'Modified' },
  { field: 'type', label: 'Type' },
];

export default function DirectoryView({
  path,
  entries,
  loading,
  onOpenFile,
  onOpenDirectory,
}: DirectoryViewProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SORT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { field?: unknown; direction?: unknown };
      if (
        (parsed.field === 'name' ||
          parsed.field === 'size' ||
          parsed.field === 'modified' ||
          parsed.field === 'type') &&
        (parsed.direction === 'asc' || parsed.direction === 'desc')
      ) {
        setSortField(parsed.field);
        setSortDir(parsed.direction);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ field: sortField, direction: sortDir }));
    } catch (_) {}
  }, [sortDir, sortField]);

  const sortedEntries = useMemo(() => {
    const getExtension = (name: string) => {
      const lastDot = name.lastIndexOf('.');
      if (lastDot <= 0 || lastDot === name.length - 1) return '';
      return name.slice(lastDot + 1).toLocaleLowerCase();
    };

    const compareName = (a: FileNode, b: FileNode) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'accent' });

    const directoryFirst = (a: FileNode, b: FileNode) => {
      if (a.type === b.type) return 0;
      return a.type === 'dir' ? -1 : 1;
    };

    return [...entries].sort((a, b) => {
      const directoryBias = directoryFirst(a, b);
      if (directoryBias !== 0) return directoryBias;

      let comparison = 0;
      if (sortField === 'name') {
        comparison = compareName(a, b);
      } else if (sortField === 'size') {
        comparison = (a.size ?? 0) - (b.size ?? 0);
      } else if (sortField === 'modified') {
        comparison = (a.mtime ?? 0) - (b.mtime ?? 0);
      } else {
        const extCompare = getExtension(a.name).localeCompare(getExtension(b.name), undefined, {
          sensitivity: 'accent',
        });
        comparison = extCompare === 0 ? compareName(a, b) : extCompare;
      }

      if (comparison === 0) {
        comparison = compareName(a, b);
      }

      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [entries, sortField, sortDir]);

  const onSortClick = (field: SortField) => {
    if (field === sortField) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDir('asc');
  };

  return (
    <Card className="flex h-full max-w-[100vw] flex-col overflow-hidden bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm">Directory</CardTitle>
          <p className="text-xs text-muted-foreground">{path}</p>
        </div>
        <span className="text-xs text-muted-foreground">{entries.length} items</span>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <ScrollArea className="h-full">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {sortButtons.map((button) => {
              const isActive = button.field === sortField;
              const DirectionIcon = sortDir === 'asc' ? ArrowUp : ArrowDown;

              return (
                <Button
                  key={button.field}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSortClick(button.field)}
                  className={cn(
                    'rounded-full px-3',
                    isActive ? 'bg-primary/20 text-foreground hover:bg-primary/20' : 'bg-muted/40'
                  )}
                >
                  {button.label}
                  {isActive ? <DirectionIcon className="h-3.5 w-3.5" /> : null}
                </Button>
              );
            })}
          </div>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`dir-skeleton-${index}`}
                  className="flex items-center gap-3 rounded-2xl border border-border/40 bg-muted/30 p-4"
                >
                  <div className="h-10 w-10 rounded-xl bg-muted/40" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-muted/40" />
                    <div className="h-3 w-1/2 rounded bg-muted/30" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                <Folder className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">This directory is empty</p>
                <p className="text-xs text-muted-foreground">Add files to see them here.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sortedEntries.map((node) => {
                const Icon = node.type === 'dir' ? Folder : getFileIcon(node.name);
                const sizeLabel = node.type === 'file' ? formatFileSize(node.size) : '';
                const timeLabel = formatRelativeTime(node.mtime);
                const metaLabel = getMetaLabel(sizeLabel || '—', timeLabel || '—');

                return (
                  <button
                    key={node.path}
                    type="button"
                    onClick={() =>
                      node.type === 'dir' ? onOpenDirectory(node) : onOpenFile(node)
                    }
                    className="group flex w-full items-start gap-3 rounded-2xl border border-border/40 bg-muted/30 p-4 text-left transition hover:bg-muted/50"
                    title={node.path}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/60">
                      <Icon
                        className={
                          node.type === 'dir'
                            ? 'h-5 w-5 text-primary'
                            : 'h-5 w-5 text-muted-foreground'
                        }
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
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
