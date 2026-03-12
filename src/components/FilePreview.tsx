import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Check, Copy, FileCode2, FileImage, FileText, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { buildWorkspaceFileUrl, type FileNode } from '@/lib/api';

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
};

export default function FilePreview({ file, content, loading, error, workspace }: FilePreviewProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);

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
  const language = CODE_LANGUAGE[ext] ?? 'text';
  const previewUrl = buildWorkspaceFileUrl(file.path, workspace);
  const canCopy = !isImage && !loading && !error;

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

  return (
    <Card className="h-full max-w-[100vw] overflow-hidden bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          {isImage ? <FileImage className="h-5 w-5 text-primary" /> : null}
          {!isImage && isMarkdown ? <FileText className="h-5 w-5 text-primary" /> : null}
          {!isImage && !isMarkdown ? <FileCode2 className="h-5 w-5 text-primary" /> : null}
          <div>
            <CardTitle className="text-lg">{file.name}</CardTitle>
            <div className="text-xs text-muted-foreground">{file.path}</div>
          </div>
        </div>
        <Badge variant="accent">{ext || 'file'}</Badge>
      </CardHeader>
      <CardContent className="h-[calc(100%-86px)] overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading content...
          </div>
        ) : error ? (
          <div className="text-sm text-rose-300">{error}</div>
        ) : isImage ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-border bg-background/60 p-4">
            <img
              src={previewUrl}
              alt={file.name}
              className="max-h-[70vh] max-w-full rounded-lg shadow-soft"
            />
          </div>
        ) : isMarkdown ? (
          <div className="group relative max-h-[70vh] max-w-full overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-background/60 p-4">
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
              {content}
            </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div
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
              {content}
            </SyntaxHighlighter>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
