import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  FolderTree,
  Link2,
  RefreshCw,
  TerminalSquare,
} from 'lucide-react';

import Breadcrumbs, { type BreadcrumbItem } from '@/components/Breadcrumbs';
import FilePreview from '@/components/FilePreview';
import FileTree from '@/components/FileTree';
import SearchBar from '@/components/SearchBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { buildWorkspaceFileUrl, fetchFileContent, listDirectory, type FileNode } from '@/lib/api';
import { cn } from '@/lib/utils';

const WORKSPACES = [
  { id: 'workspace', label: 'Clawvin' },
  { id: 'workspace-coder', label: 'Patch' },
  { id: 'workspace-scout', label: 'Scout' },
  { id: 'workspace-health', label: 'Vitals' },
  { id: 'workspace-finance', label: 'Ledger' },
  { id: 'workspace-atlas', label: 'Atlas' },
];

const getParentPath = (p: string) => {
  if (!p) return '';
  const parts = p.split('/');
  parts.pop();
  return parts.join('/');
};

const collectDirPaths = (nodes: FileNode[], acc: Set<string>) => {
  nodes.forEach((node) => {
    if (node.type === 'dir') {
      acc.add(node.path);
      if (node.children) collectDirPaths(node.children, acc);
    }
  });
};

const filterTree = (nodes: FileNode[], query: string): FileNode[] => {
  if (!query) return nodes;
  const q = query.toLowerCase();
  return nodes
    .map((node) => {
      if (node.type === 'dir') {
        const children = node.children ? filterTree(node.children, query) : [];
        if (node.name.toLowerCase().includes(q) || children.length > 0) {
          return { ...node, children };
        }
        return null;
      }
      if (node.name.toLowerCase().includes(q)) return node;
      return null;
    })
    .filter(Boolean) as FileNode[];
};

const buildBreadcrumbs = (p: string): BreadcrumbItem[] => {
  if (!p) return [];
  const parts = p.split('/');
  const crumbs: BreadcrumbItem[] = [];
  parts.forEach((part, idx) => {
    crumbs.push({
      label: part,
      path: parts.slice(0, idx + 1).join('/'),
    });
  });
  return crumbs;
};

const updateNodeChildren = (nodes: FileNode[], p: string, children: FileNode[]): FileNode[] => {
  return nodes.map((node) => {
    if (node.path === p) {
      return { ...node, children };
    }
    if (node.children) {
      return { ...node, children: updateNodeChildren(node.children, p, children) };
    }
    return node;
  });
};

function findNode(nodes: FileNode[], p: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === p) return node;
    if (node.children) {
      const found = findNode(node.children, p);
      if (found) return found;
    }
  }
  return null;
}

export default function App() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [search, setSearch] = useState('');
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set());
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('workspace') ?? 'workspace';
  });

  const loadDirectory = useCallback(
    async (p: string) => {
      setLoadingNodes((prev) => new Set(prev).add(p));
      try {
        const children = await listDirectory(p, workspace);
        setTree((prev) => (p ? updateNodeChildren(prev, p, children) : children));
      } finally {
        setLoadingNodes((prev) => {
          const next = new Set(prev);
          next.delete(p);
          return next;
        });
      }
    },
    [workspace]
  );

  useEffect(() => {
    const init = async () => {
      setTreeLoading(true);
      setTreeError(null);
      setTree([]);
      setSelectedFile(null);
      setCurrentPath('');
      setOpenNodes(new Set());
      try {
        const root = await listDirectory('', workspace);
        setTree(root);
      } catch (error) {
        setTreeError((error as Error).message);
      } finally {
        setTreeLoading(false);
      }
    };

    void init();
  }, [workspace]);

  useEffect(() => {
    if (!selectedFile || selectedFile.type !== 'file') {
      setFileContent('');
      setFileError(null);
      return;
    }

    const fetchContent = async () => {
      setFileLoading(true);
      setFileError(null);
      try {
        const content = await fetchFileContent(selectedFile.path, workspace);
        setFileContent(content);
      } catch (error) {
        setFileError((error as Error).message);
      } finally {
        setFileLoading(false);
      }
    };

    void fetchContent();
  }, [selectedFile, workspace]);

  const filteredTree = useMemo(() => filterTree(tree, search), [tree, search]);
  const searchOpenNodes = useMemo(() => {
    if (!search) return openNodes;
    const all = new Set<string>();
    collectDirPaths(filteredTree, all);
    return all;
  }, [filteredTree, openNodes, search]);

  const handleToggle = (p: string) => {
    const isOpen = openNodes.has(p);
    const next = new Set(openNodes);
    if (isOpen) {
      next.delete(p);
    } else {
      next.add(p);
      const target = findNode(tree, p);
      if (target && (!target.children || target.children.length === 0)) {
        void loadDirectory(p);
      }
    }
    setOpenNodes(next);
  };

  const handleSelect = (node: FileNode) => {
    if (node.type === 'dir') {
      setCurrentPath(node.path);
    } else {
      setSelectedFile(node);
      setCurrentPath(getParentPath(node.path));
    }
  };

  const breadcrumbs = useMemo(() => buildBreadcrumbs(currentPath), [currentPath]);

  const handleNavigate = (p: string) => {
    setCurrentPath(p);
    const next = new Set(openNodes);
    if (p) next.add(p);
    setOpenNodes(next);
  };

  const handleRefresh = () => {
    if (currentPath) {
      void loadDirectory(currentPath);
    } else {
      setTreeLoading(true);
      listDirectory('', workspace)
        .then(setTree)
        .catch((error) => setTreeError((error as Error).message))
        .finally(() => setTreeLoading(false));
    }
  };

  const handleCopyPath = async () => {
    if (!selectedFile) return;
    await navigator.clipboard.writeText(selectedFile.path);
  };

  const handleDownload = () => {
    if (!selectedFile) return;
    const url = buildWorkspaceFileUrl(selectedFile.path, workspace);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    link.click();
  };

  const currentWorkspaceLabel = WORKSPACES.find((w) => w.id === workspace)?.label ?? workspace;

  return (
    <div className="min-h-screen bg-grid">
      <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col p-6">
        {/* Header */}
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-glow">
              <FolderTree className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">File Explorer</h1>
              <p className="text-sm text-muted-foreground">Mission Control · {currentWorkspaceLabel}</p>
            </div>
          </div>

          {/* Workspace Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {WORKSPACES.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => setWorkspace(ws.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  workspace === ws.id
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'bg-muted/40 text-muted-foreground border border-border hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {ws.label}
              </button>
            ))}
          </div>
        </header>

        <div className="grid flex-1 gap-5 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <Card className="flex h-[calc(100vh-180px)] flex-col bg-card/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">File Tree</span>
              <Button type="button" variant="ghost" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <SearchBar value={search} onChange={setSearch} />
            <Separator className="my-3" />
            <ScrollArea className="flex-1">
              {treeLoading ? (
                <div className="text-sm text-muted-foreground">Loading tree...</div>
              ) : treeError ? (
                <div className="text-sm text-rose-300">{treeError}</div>
              ) : filteredTree.length === 0 ? (
                <div className="text-sm text-muted-foreground">No matches</div>
              ) : (
                <FileTree
                  nodes={filteredTree}
                  openNodes={searchOpenNodes}
                  loadingNodes={loadingNodes}
                  selectedPath={selectedFile?.path ?? currentPath}
                  onToggle={handleToggle}
                  onSelect={handleSelect}
                />
              )}
            </ScrollArea>
            <Separator className="my-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{tree.length} root items</span>
              <span className="flex items-center gap-1">
                <TerminalSquare className="h-3 w-3" /> /ws/{workspace}
              </span>
            </div>
          </Card>

          {/* Main Content */}
          <div className="flex h-[calc(100vh-180px)] flex-col gap-4">
            <Card className="bg-card/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Breadcrumbs items={breadcrumbs} onNavigate={handleNavigate} />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPath}
                    disabled={!selectedFile}
                  >
                    <Link2 className="h-4 w-4" /> Copy path
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!selectedFile}
                  >
                    <Download className="h-4 w-4" /> Download
                  </Button>
                </div>
              </div>
            </Card>

            <div className="flex-1 overflow-hidden">
              <FilePreview
                file={selectedFile}
                content={fileContent}
                loading={fileLoading}
                error={fileError}
                workspace={workspace}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
