import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { AlertTriangle, Check, Copy, FileAudio, FileCode2, FileImage, FileText, FileVideo } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatFileSize, formatRelativeTime } from '@/lib/utils';
import { buildWorkspaceFileUrl, type FileNode } from '@/lib/api';
import { AUDIO_EXT, LARGE_FILE_THRESHOLD, VIDEO_EXT } from '@/lib/constants';

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
const MARKDOWN_EXT = ['md', 'markdown'];
const CODE_LANGUAGE: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  json: 'json',
  css: 'css',
  scss: 'scss',
  html: 'html',
  md: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  py: 'python',
  go: 'go',
  rs: 'rust',
  java: 'java',
  php: 'php',
  sql: 'sql',
  sh: 'bash',
  toml: 'toml',
  txt: 'text',
};

const LARGE_PREVIEW_BYTES = 1024 * 1024;
const PREVIEW_CHUNK_CHARS = 200_000;

const getExt = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

const MarkdownCode = ({
  className,
  children,
  inline,
}: {
  className?: string;
  children?: React.ReactNode;
  inline?: boolean;
}) => {
  const code = String(children ?? '').replace(/\n$/, '');

  if (inline) {
    return (
      <code 
        className={cn(
          className,
          "break-words break-all"
        )}
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          overflowWrap: 'break-word'
        }}
      >
        {code}
      </code>
    );
  }

  const match = /language-(\w+)/.exec(className ?? '');
  const language = match?.[1];

  return (
    <SyntaxHighlighter
      style={oneDark}
      language={language}
      PreTag="div"
      customStyle={{
        background: 'transparent',
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        overflowWrap: 'break-word',
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
};

type FilePreviewProps = {
  file: FileNode | null;
  content: string;
  loading: boolean;
  error?: string | null;
  workspace?: string;
  largeFileAcknowledged?: boolean;
  onLoadLargeFile?: (file: FileNode) => void;
  onDownload?: (file: FileNode) => void;
};

export default function FilePreview({
  file,
  content,
  loading,
  error,
  workspace,
  largeFileAcknowledged = false,
  onLoadLargeFile,
  onDownload,
}: FilePreviewProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const [previewLimit, setPreviewLimit] = useState(PREVIEW_CHUNK_CHARS);
  const [showFullContent, setShowFullContent] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);
  useEffect(() => {
    setCopied(false);
  }, [file?.path]);

  useEffect(() => {
    setImageLoaded(false);
  }, [file?.path]);

  useEffect(() => {
    if (!file?.path) {
      return;
    }
    const container = previewScrollRef.current;
    if (!container) {
      return;
    }
    const savedScrollTop = scrollPositionsRef.current.get(file.path);
    container.scrollTop = savedScrollTop ?? 0;
  }, [file?.path]);

  const handlePreviewScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!file?.path) {
      return;
    }
    scrollPositionsRef.current.set(file.path, event.currentTarget.scrollTop);
  };

  if (!file) {
    return (
      <Card className="h-full bg-card/80">
        <CardContent className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">Select a file</CardTitle>
            <p className="text-sm text-muted-foreground">
              Pick a file from the tree to preview its contents.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                Ctrl+K
              </kbd>
              Search files
            </span>
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>
              Navigate tree
            </span>
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                Enter
              </kbd>
              Open file
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ext = getExt(file.name);
  const isImage = IMAGE_EXT.includes(ext);
  const isMarkdown = MARKDOWN_EXT.includes(ext);
  const isPdf = ext === 'pdf';
  const isAudio = AUDIO_EXT.includes(ext);
  const isVideo = VIDEO_EXT.includes(ext);
  const language = CODE_LANGUAGE[ext] ?? 'text';
  const previewUrl = buildWorkspaceFileUrl(file.path, workspace);
  const canCopy = !isImage && !isAudio && !isVideo && !loading && !error;
  const fileSize = typeof file.size === 'number' ? file.size : null;
  const isLargeFile = fileSize !== null && fileSize > LARGE_FILE_THRESHOLD;
  const isBlockedByLargeFile = isLargeFile && !largeFileAcknowledged;
  const isTextPreview = !isImage && !isAudio && !isVideo;
  const shouldTruncate = isTextPreview && content.length >= LARGE_PREVIEW_BYTES;
  const isTruncated = shouldTruncate && !showFullContent && content.length > previewLimit;
  const displayContent = isTruncated ? content.slice(0, previewLimit) : content;

  useEffect(() => {
    if (!file?.path) {
      return;
    }
    if (!shouldTruncate) {
      setShowFullContent(true);
      setPreviewLimit(PREVIEW_CHUNK_CHARS);
      return;
    }
    setShowFullContent(false);
    setPreviewLimit(PREVIEW_CHUNK_CHARS);
  }, [file?.path, shouldTruncate]);

  const handleCopy = async () => {
    if (!canCopy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Clipboard may be unavailable; fail silently.
    }
  };

  const handleLoadMore = () => {
    setPreviewLimit((prev) => Math.min(prev + PREVIEW_CHUNK_CHARS, content.length));
  };

  const handleShowFull = () => {
    setShowFullContent(true);
  };

  return (
    <Card className="h-full max-w-[100vw] overflow-hidden bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          {isImage ? <FileImage className="h-5 w-5 text-primary" /> : null}
          {!isImage && isAudio ? <FileAudio className="h-5 w-5 text-primary" /> : null}
          {!isImage && !isAudio && isVideo ? <FileVideo className="h-5 w-5 text-primary" /> : null}
          {!isImage && !isAudio && !isVideo && isMarkdown ? <FileText className="h-5 w-5 text-primary" /> : null}
          {!isImage && !isAudio && !isVideo && !isMarkdown ? <FileCode2 className="h-5 w-5 text-primary" /> : null}
          <div>
            <CardTitle className="text-lg">{file.name}</CardTitle>
            <div className="text-xs text-muted-foreground">{file.path}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isTruncated ? (
            <Badge
              variant="outline"
              className="border-amber-400/60 text-amber-200"
            >
              Truncated
            </Badge>
          ) : null}
          {(file.size != null || file.mtime != null) && (
            <div className="text-xs text-muted-foreground">
              {file.size != null && formatFileSize(file.size)}
              {file.size != null && file.mtime != null && ' · '}
              {file.mtime != null && formatRelativeTime(file.mtime)}
            </div>
          )}
          <Badge variant="accent">{ext || 'file'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-86px)] overflow-hidden">
        {isBlockedByLargeFile ? (
          <Card className="border-amber-400/50 bg-amber-500/10">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-200" />
                    Large file warning
                  </div>
                  <CardTitle className="text-base text-amber-50">{file.name}</CardTitle>
                  <div className="text-xs text-amber-100/80">
                    {fileSize !== null
                      ? `${formatFileSize(fileSize)}. Loading this file may impact performance.`
                      : 'Loading this file may impact performance.'}
                  </div>
                </div>
                <Badge variant="outline" className="border-amber-300/60 text-amber-100">
                  {fileSize !== null ? formatFileSize(fileSize) : 'Large'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => file && onLoadLargeFile?.(file)}
              >
                Load Anyway
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => file && onDownload?.(file)}
              >
                Download
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="h-full animate-pulse">
            <div className="h-6 w-full rounded bg-muted/40" />
            <div className="mt-4 space-y-3">
              {[95, 88, 76, 92, 64, 84, 58, 72, 46, 66].map((width, index) => (
                <div
                  key={`preview-skeleton-${width}-${index}`}
                  className="h-3 rounded bg-muted/40"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-sm text-rose-300">{error}</div>
        ) : (
          <>
                        {isPdf ? (
              <iframe
                src={previewUrl}
                className="h-full w-full rounded-lg"
                style={{ minHeight: '70vh' }}
                title={file.name}
              />
            ) : isImage ? (
          <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-background/60 p-4">
            {!imageLoaded ? <div className="absolute inset-4 animate-pulse rounded-lg bg-muted/40 blur-sm" /> : null}
            <div className="flex h-full w-full items-center justify-center overflow-auto">
              <img
                src={previewUrl}
                alt={file.name}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                className={cn(
                  "h-full w-full rounded-lg object-contain shadow-soft transition-opacity duration-200",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
              />
            </div>
          </div>
            ) : isAudio ? (
              <div className="flex h-full items-center rounded-lg border border-border bg-background/60 p-4">
                <audio src={previewUrl} controls className="w-full" preload="metadata">
                  Your browser does not support audio playback.
                </audio>
              </div>
            ) : isVideo ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-border bg-background/60 p-4">
                <video
                  src={previewUrl}
                  controls
                  className="max-h-[70vh] w-full rounded-lg"
                  preload="metadata"
                >
                  Your browser does not support video playback.
                </video>
              </div>
            ) : isMarkdown ? (
          <div
            ref={previewScrollRef}
            onScroll={handlePreviewScroll}
            className="group relative max-h-[70vh] max-w-full overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-background/60 p-4"
          >
            {canCopy ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="absolute right-3 top-3 z-10 bg-background/70 text-xs text-foreground opacity-0 shadow-sm transition-opacity hover:bg-background/90 group-hover:opacity-100"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            ) : null}
            <div className="markdown-content prose prose-sm prose-invert max-w-none break-words prose-code:break-words prose-code:break-all prose-code:whitespace-pre-wrap prose-pre:break-words prose-pre:whitespace-pre-wrap">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: MarkdownCode,
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
            {isTruncated ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                <span>
                  Preview truncated. Showing {displayContent.length.toLocaleString()} of {content.length.toLocaleString()} characters.
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={handleLoadMore}>
                    Load more
                  </Button>
                  <Button type="button" size="sm" onClick={handleShowFull}>
                    Show full file
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
            ) : isTextPreview ? (
          <div
            ref={previewScrollRef}
            onScroll={handlePreviewScroll}
            className={cn(
              'file-preview-code group relative max-h-[70vh] max-w-full overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-background/60 p-4',
              language === 'text' ? '' : '' 
            )}
          >
            {canCopy ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="absolute right-3 top-3 z-10 bg-background/70 text-xs text-foreground opacity-0 shadow-sm transition-opacity hover:bg-background/90 group-hover:opacity-100"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            ) : null}
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              showLineNumbers
              wrapLongLines
              customStyle={{
                background: 'transparent',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {displayContent}
            </SyntaxHighlighter>
            {isTruncated ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                <span>
                  Preview truncated. Showing {displayContent.length.toLocaleString()} of {content.length.toLocaleString()} characters.
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={handleLoadMore}>
                    Load more
                  </Button>
                  <Button type="button" size="sm" onClick={handleShowFull}>
                    Show full file
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
