import { Folder } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFileIcon } from '@/lib/icons';
import { formatFileSize, formatRelativeTime } from '@/lib/utils';
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

export default function DirectoryView({
  path,
  entries,
  loading,
  onOpenFile,
  onOpenDirectory,
}: DirectoryViewProps) {
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
          ) : entries.length === 0 ? (
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
              {entries.map((node) => {
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
