import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { FileCode2, FileImage, FileText, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
    return <code className={className}>{code}</code>;
  }

  const match = /language-(\w+)/.exec(className ?? '');
  const language = match?.[1];

  return (
    <SyntaxHighlighter
      style={oneDark}
      language={language}
      PreTag="div"
      customStyle={{ background: 'transparent', margin: 0 }}
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
  if (!file) {
    return (
      <Card className="h-full bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Select a file</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Pick a file from the tree to preview its contents.
        </CardContent>
      </Card>
    );
  }

  const ext = getExt(file.name);
  const isImage = IMAGE_EXT.includes(ext);
  const isMarkdown = MARKDOWN_EXT.includes(ext);
  const language = CODE_LANGUAGE[ext] ?? 'text';
  const previewUrl = buildWorkspaceFileUrl(file.path, workspace);

  return (
    <Card className="h-full bg-card/80">
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
      <CardContent className="h-[calc(100%-86px)]">
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
          <div className="markdown-content max-h-[70vh] overflow-auto rounded-lg border border-border bg-background/60 p-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: MarkdownCode,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className={cn('max-h-[70vh] overflow-auto rounded-lg border border-border bg-background/60 p-4', language === 'text' ? '' : '')}>
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              showLineNumbers
              wrapLongLines
              customStyle={{ background: 'transparent', margin: 0 }}
            >
              {content}
            </SyntaxHighlighter>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
