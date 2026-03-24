import { Upload } from 'lucide-react';
import { useMemo, useState, type DragEvent, type ReactNode } from 'react';

import { uploadFiles } from '@/lib/api';
import { cn } from '@/lib/utils';

type DropZoneProps = {
  children: ReactNode;
  path: string;
  workspace: string;
  onUploadSuccess: () => void;
  className?: string;
  statusClassName?: string;
};

export default function DropZone({
  children,
  path,
  workspace,
  onUploadSuccess,
  className,
  statusClassName,
}: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const statusText = useMemo(() => {
    if (uploading) return 'Uploading files...';
    if (error) return error;
    return null;
  }, [error, uploading]);

  const hasFiles = (event: DragEvent<HTMLElement>) =>
    Array.from(event.dataTransfer?.types ?? []).includes('Files');

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    if (!dragOver) setDragOver(true);
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDragOver(false);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    setError(null);
    const droppedFiles = Array.from(event.dataTransfer.files ?? []);
    if (droppedFiles.length === 0) return;

    setUploading(true);
    try {
      await uploadFiles(droppedFiles, path, workspace);
      setSuccess(true);
      onUploadSuccess();
      window.setTimeout(() => setSuccess(false), 1200);
    } catch (uploadError) {
      setError((uploadError as Error).message);
      window.setTimeout(() => setError(null), 3000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={cn('relative', className)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(event) => void handleDrop(event)}
    >
      {children}
      {dragOver ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-primary/15">
          <div className="flex items-center gap-2 rounded-xl bg-card/90 px-4 py-3 text-primary shadow-lg">
            <Upload className="h-5 w-5" />
            <span className="text-sm font-semibold">Drop files to upload</span>
          </div>
        </div>
      ) : null}
      <div
        className={cn(
          'mt-2 min-h-5 text-xs transition-colors',
          statusClassName,
          uploading && 'text-primary',
          error && 'text-rose-400',
          success && 'text-emerald-400'
        )}
        role="status"
        aria-live="polite"
      >
        {statusText ?? (success ? 'Upload successful' : null)}
      </div>
      {success ? (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-emerald-400/60 animate-pulse" />
      ) : null}
    </div>
  );
}
