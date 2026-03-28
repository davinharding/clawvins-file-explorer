import type { FileNode } from '@/lib/api';
import { formatFileSize, formatRelativeTime } from '@/lib/utils';

type StatusBarProps = {
  currentDirectory: FileNode | null;
  selectedFile: FileNode | null;
  currentPath: string;
};

const getNodeTypeLabel = (node: FileNode): string => {
  const ext = node.name.includes('.') ? node.name.split('.').pop()?.toUpperCase() : '';
  if (node.type === 'dir') return 'Folder';
  if (ext) return ext;
  return 'File';
};

export default function StatusBar({ currentDirectory, selectedFile, currentPath }: StatusBarProps) {
  const entries = currentDirectory?.type === 'dir' ? currentDirectory.children ?? [] : [];

  const folderCount = entries.filter((entry) => entry.type === 'dir').length;
  const fileCount = entries.filter((entry) => entry.type === 'file').length;
  const itemCount = entries.length;
  const totalSizeBytes = entries.reduce((sum, entry) => {
    if (entry.type !== 'file' || typeof entry.size !== 'number' || Number.isNaN(entry.size)) {
      return sum;
    }
    return sum + entry.size;
  }, 0);

  const browseLabel = `${itemCount} items (${folderCount} folders, ${fileCount} files) · ${formatFileSize(totalSizeBytes) || '0 B'}`;

  const selectedLabel = selectedFile
    ? `${selectedFile.name} · ${formatFileSize(selectedFile.size) || '—'} · Modified ${formatRelativeTime(selectedFile.mtime) || '—'} · ${getNodeTypeLabel(selectedFile)}`
    : null;

  const pathLabel = currentPath || '/';

  return (
    <footer className="flex h-8 items-center justify-between border-t border-border bg-muted/60 px-3 text-xs text-muted-foreground">
      <div className="min-w-0 flex-1 truncate">
        <span>{selectedLabel ?? browseLabel}</span>
        {!selectedFile ? <span className="ml-3">? for shortcuts</span> : null}
      </div>
      <div className="ml-3 max-w-[45%] shrink-0 truncate text-right" title={pathLabel}>
        {pathLabel}
      </div>
    </footer>
  );
}
