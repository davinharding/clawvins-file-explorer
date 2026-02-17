import { ChevronDown, ChevronRight, File, FileCode2, FileImage, FileText, Folder, FolderOpen } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
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
  onToggle: (path: string) => void;
  onSelect: (node: FileNode) => void;
  depth?: number;
};

export default function FileTree({
  nodes,
  openNodes,
  loadingNodes,
  selectedPath,
  onToggle,
  onSelect,
  depth = 0,
}: FileTreeProps) {
  return (
    <ul className={cn('space-y-1', depth === 0 ? 'pl-0' : 'pl-4')}
    >
      {nodes.map((node) => {
        const isDir = node.type === 'dir';
        const isOpen = openNodes.has(node.path);
        const isLoading = loadingNodes.has(node.path);
        const isActive = selectedPath === node.path;
        const Icon = isDir ? (isOpen ? FolderOpen : Folder) : getFileIcon(node.name);

        if (isDir) {
          return (
            <li key={node.path}>
              <Collapsible open={isOpen} onOpenChange={() => onToggle(node.path)}>
                <div className={cn(
                  'flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors',
                  isActive ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-muted/60'
                )}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="flex w-full items-center justify-start gap-2 px-1 text-left"
                      onClick={() => onSelect(node)}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="truncate font-semibold text-foreground">{node.name}</span>
                      {isLoading ? <Badge variant="outline">Loading</Badge> : null}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="pt-1">
                  {node.children && node.children.length > 0 ? (
                    <FileTree
                      nodes={node.children}
                      openNodes={openNodes}
                      loadingNodes={loadingNodes}
                      selectedPath={selectedPath}
                      onToggle={onToggle}
                      onSelect={onSelect}
                      depth={depth + 1}
                    />
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
              onClick={() => onSelect(node)}
              className={cn(
                'flex w-full items-center justify-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm',
                isActive ? 'bg-primary/20 text-foreground' : 'text-muted-foreground hover:bg-muted/60'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{node.name}</span>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
