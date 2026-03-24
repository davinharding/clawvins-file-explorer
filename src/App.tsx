import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import {
  Download,
  File,
  FolderTree,
  Link2,
  Menu,
  RefreshCw,
  TerminalSquare,
  X,
} from 'lucide-react';

import Breadcrumbs, { type BreadcrumbItem } from '@/components/Breadcrumbs';
import ContextMenu from '@/components/ContextMenu';
import DirectoryView from '@/components/DirectoryView';
import FilePreview from '@/components/FilePreview';
import FileTree from '@/components/FileTree';
import SearchBar from '@/components/SearchBar';
import ShortcutHelp from '@/components/ShortcutHelp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { buildWorkspaceFileUrl, fetchFileContent, listDirectory, type FileNode } from '@/lib/api';
import { LARGE_FILE_THRESHOLD } from '@/lib/constants';
import { collectDirPaths, filterTree } from '@/lib/tree';
import { cn } from '@/lib/utils';

const WORKSPACES = [
  { id: 'workspace', label: 'Clawvin' },
  { id: 'workspace-coder', label: 'Patch' },
  { id: 'workspace-scout', label: 'Scout' },
  { id: 'workspace-health', label: 'Vitals' },
  { id: 'workspace-alpha', label: 'Alpha' },
  { id: 'workspace-iris', label: 'Iris' },
  { id: 'workspace-nova', label: 'Nova' },
  { id: 'workspace-finance', label: 'Ledger' },
  { id: 'workspace-atlas', label: 'Atlas' },
];

const RECENT_LIMIT = 5;
const RECENT_STORAGE_PREFIX = 'fe_recent_';

const getParentPath = (p: string) => {
  if (!p) return '';
  const parts = p.split('/');
  parts.pop();
  return parts.join('/');
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

const getRecentStorageKey = (workspaceId: string) => `${RECENT_STORAGE_PREFIX}${workspaceId}`;

const parseRecentFiles = (raw: string | null): FileNode[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FileNode =>
        item &&
        typeof item === 'object' &&
        item.type === 'file' &&
        typeof item.name === 'string' &&
        typeof item.path === 'string'
    );
  } catch {
    return [];
  }
};

type ContextMenuState = {
  node: FileNode;
  position: { x: number; y: number };
};

export default function App() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set());
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [largeFileAcknowledged, setLargeFileAcknowledged] = useState(false);
  const [recentFiles, setRecentFiles] = useState<FileNode[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [workspace, setWorkspace] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('workspace') ?? 'workspace';
  });
  const [isMobile, setIsMobile] = useState(() =>
    window.matchMedia('(max-width: 767px)').matches
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState<boolean>(false);
  const drawerTouchStartX = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const inMemoryRecents = useRef<Map<string, FileNode[]>>(new Map());

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

  const readRecentFiles = useCallback(
    (workspaceId: string) => {
      const key = getRecentStorageKey(workspaceId);
      try {
        return parseRecentFiles(localStorage.getItem(key)).slice(0, RECENT_LIMIT);
      } catch {
        return inMemoryRecents.current.get(key) ?? [];
      }
    },
    []
  );

  const persistRecentFiles = useCallback((workspaceId: string, files: FileNode[]) => {
    const key = getRecentStorageKey(workspaceId);
    try {
      localStorage.setItem(key, JSON.stringify(files));
    } catch {
      inMemoryRecents.current.set(key, files);
    }
  }, []);

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
    setRecentFiles(readRecentFiles(workspace));
  }, [readRecentFiles, workspace]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isMobile && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [drawerOpen, isMobile]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTypingTarget =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (isTypingTarget) return;

      if (event.key === '?') {
        event.preventDefault();
        setShortcutHelpOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (document.activeElement === searchInputRef.current) return;
      if (selectedFile) {
        setSelectedFile(null);
        return;
      }
      if (currentPath) {
        setCurrentPath(getParentPath(currentPath));
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [currentPath, selectedFile]);

  useEffect(() => {
    if (!selectedFile || selectedFile.type !== 'file') {
      setFileContent('');
      setFileError(null);
      setFileLoading(false);
      return;
    }

    const fileSize = typeof selectedFile.size === 'number' ? selectedFile.size : null;
    const isLargeFile = fileSize !== null && fileSize > LARGE_FILE_THRESHOLD;
    if (isLargeFile && !largeFileAcknowledged) {
      setFileContent('');
      setFileError(null);
      setFileLoading(false);
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
  }, [largeFileAcknowledged, selectedFile, workspace]);

  useEffect(() => {
    setLargeFileAcknowledged(false);
  }, [selectedFile?.path]);

  useEffect(() => {
    persistRecentFiles(workspace, recentFiles);
  }, [persistRecentFiles, recentFiles, workspace]);

  const filteredTree = useMemo(() => filterTree(tree, search), [tree, search]);
  const searchMatchCount = useMemo(() => {
    const countNodes = (nodes: FileNode[]): number => nodes.reduce((total, node) => (
      total + 1 + (node.children ? countNodes(node.children) : 0)
    ), 0);

    if (!search.trim()) return 0;
    return countNodes(filteredTree);
  }, [filteredTree, search]);
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
      handleNavigate(node.path);
    } else {
      setSelectedFile(node);
      setCurrentPath(getParentPath(node.path));
    }
    if (node.type === 'file') {
      setRecentFiles((prev) => {
        const next = [node, ...prev.filter((item) => item.path !== node.path)];
        return next.slice(0, RECENT_LIMIT);
      });
    }
    if (isMobile && node.type === 'file') {
      setDrawerOpen(false);
    }
  };

  const handleRemoveRecent = (path: string) => {
    setRecentFiles((prev) => prev.filter((item) => item.path !== path));
  };

  const breadcrumbs = useMemo(() => buildBreadcrumbs(currentPath), [currentPath]);
  const currentDirectory = useMemo(
    () => (currentPath ? findNode(tree, currentPath) : null),
    [currentPath, tree]
  );

  const handleNavigate = (p: string) => {
    setSelectedFile(null);
    setCurrentPath(p);
    const next = new Set(openNodes);
    if (p) next.add(p);
    setOpenNodes(next);
    const target = findNode(tree, p);
    if (target?.type === 'dir' && target.children === undefined && !loadingNodes.has(p)) {
      void loadDirectory(p);
    }
  };

  useEffect(() => {
    if (!currentPath || selectedFile) return;
    const target = findNode(tree, currentPath);
    if (target?.type === 'dir' && target.children === undefined && !loadingNodes.has(currentPath)) {
      void loadDirectory(currentPath);
    }
  }, [currentPath, loadDirectory, loadingNodes, selectedFile, tree]);

  const handleDrawerTouchStart = (event: TouchEvent<HTMLElement>) => {
    drawerTouchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleDrawerTouchMove = (event: TouchEvent<HTMLElement>) => {
    if (drawerTouchStartX.current === null) return;
    const deltaX = event.touches[0]?.clientX - drawerTouchStartX.current;
    if (deltaX < -60) {
      setDrawerOpen(false);
      drawerTouchStartX.current = null;
    }
  };

  const handleDrawerTouchEnd = () => {
    drawerTouchStartX.current = null;
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

  const handleCopyPath = async (node?: FileNode | null) => {
    const target = node ?? selectedFile;
    if (!target) return;
    await navigator.clipboard.writeText(target.path);
  };

  const handleDownload = (node?: FileNode | null) => {
    const target = node ?? selectedFile;
    if (!target || target.type !== 'file') return;
    const url = buildWorkspaceFileUrl(target.path, workspace);
    const link = document.createElement('a');
    link.href = url;
    link.download = target.name;
    link.click();
  };

  const handleOpenInNewTab = (node: FileNode) => {
    if (node.type !== 'file') return;
    const url = buildWorkspaceFileUrl(node.path, workspace);
    window.open(url, '_blank', 'noopener');
  };

  const handleContextMenu = (node: FileNode, position: { x: number; y: number }) => {
    setContextMenu({ node, position });
  };

  const currentWorkspaceLabel = WORKSPACES.find((w) => w.id === workspace)?.label ?? workspace;
  const sidebarContent = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">File Tree</span>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {isMobile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close file tree"
              onClick={() => setDrawerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <SearchBar value={search} onChange={setSearch} inputRef={searchInputRef} matchCount={searchMatchCount} />
      {recentFiles.length > 0 ? (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Recent</span>
          </div>
          <div className="space-y-1">
            {recentFiles.map((file) => {
              const parentPath = getParentPath(file.path) || '/';
              return (
                <div
                  key={file.path}
                  className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1 text-left transition hover:bg-muted/50"
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(file)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    title={file.path}
                  >
                    <File className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-foreground">{file.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{parentPath}</div>
                    </div>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    aria-label={`Remove ${file.name} from recent files`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveRecent(file.path);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      <Separator className="my-3" />
      <ScrollArea className="flex-1">
        {treeLoading ? (
          <div className="space-y-2 animate-pulse">
            {[60, 80, 52, 70, 45, 75, 58].map((width, index) => (
              <div
                key={`tree-skeleton-${width}-${index}`}
                className={`flex items-center gap-2 ${index % 2 === 1 ? 'pl-4' : 'pl-0'}`}
              >
                <div className="h-4 w-4 rounded-full bg-muted/40" />
                <div className="h-3 rounded bg-muted/40" style={{ width: `${width}%` }} />
              </div>
            ))}
          </div>
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
            focusedPath={focusedPath}
            onToggle={handleToggle}
            onSelect={handleSelect}
            onFocusPathChange={setFocusedPath}
            onContextMenu={handleContextMenu}
            searchQuery={search}
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
    </>
  );

  return (
    <div className="min-h-screen bg-grid">
      <div className="flex min-h-screen flex-col px-4 py-4 lg:px-6">
        {/* Header */}
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open file tree"
              aria-expanded={drawerOpen}
              aria-controls="mobile-file-drawer"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
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
            <div className="lg:hidden">
              <select
                value={workspace}
                onChange={(event) => setWorkspace(event.target.value)}
                className="h-10 rounded-lg border border-border bg-muted/40 px-3 text-xs font-semibold text-foreground"
                aria-label="Select workspace"
              >
                {WORKSPACES.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
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
          </div>
        </header>

        {isMobile ? (
          <>
            <div
              className={cn('drawer-overlay', drawerOpen && 'is-open')}
              onClick={() => setDrawerOpen(false)}
            />
            <aside
              id="mobile-file-drawer"
              className={cn('drawer-panel', drawerOpen && 'is-open')}
              onTouchStart={handleDrawerTouchStart}
              onTouchMove={handleDrawerTouchMove}
              onTouchEnd={handleDrawerTouchEnd}
            >
              <Card className="flex h-full flex-col bg-card/90 p-4">
                {sidebarContent}
              </Card>
            </aside>
          </>
        ) : null}

        <div className="grid flex-1 gap-5 lg:grid-cols-[280px_1fr]">
          {contextMenu ? (
            <ContextMenu
              position={contextMenu.position}
              onClose={() => setContextMenu(null)}
              items={[
                {
                  label: 'Copy Path',
                  onClick: () => void handleCopyPath(contextMenu.node),
                },
                ...(contextMenu.node.type === 'file'
                  ? [
                      {
                        label: 'Download',
                        onClick: () => handleDownload(contextMenu.node),
                      },
                      {
                        label: 'Open in New Tab',
                        onClick: () => handleOpenInNewTab(contextMenu.node),
                      },
                    ]
                  : []),
                ...(contextMenu.node.type === 'dir'
                  ? [
                      {
                        label: openNodes.has(contextMenu.node.path) ? 'Collapse' : 'Expand',
                        onClick: () => handleToggle(contextMenu.node.path),
                      },
                    ]
                  : []),
              ]}
            />
          ) : null}
          {/* Sidebar */}
          <Card className="hidden h-[calc(100vh-140px)] flex-col bg-card/80 p-4 lg:flex">
            {sidebarContent}
          </Card>

          {/* Main Content */}
          <div className="flex h-[calc(100vh-140px)] flex-col gap-4">
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
              {selectedFile ? (
                <FilePreview
                  file={selectedFile}
                  content={fileContent}
                  loading={fileLoading}
                  error={fileError}
                  workspace={workspace}
                  largeFileAcknowledged={largeFileAcknowledged}
                  onLoadLargeFile={() => setLargeFileAcknowledged(true)}
                  onDownload={handleDownload}
                />
              ) : currentPath ? (
                <DirectoryView
                  path={currentPath}
                  entries={currentDirectory?.children ?? []}
                  loading={
                    loadingNodes.has(currentPath) || currentDirectory?.children === undefined
                  }
                  onOpenFile={(node) => handleSelect(node)}
                  onOpenDirectory={(node) => handleNavigate(node.path)}
                  workspace={workspace}
                />
              ) : (
                <Card className="flex h-full flex-col items-center justify-center bg-card/80">
                  <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <FolderTree className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold">Select a folder</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Choose a directory to explore its contents or open a file preview.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        {shortcutHelpOpen && <ShortcutHelp onClose={() => setShortcutHelpOpen(false)} />}
      </div>
    </div>
  );
}
