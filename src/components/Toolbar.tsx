import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  Download,
  HardDrive,
  LayoutGrid,
  Link2,
  List,
  SlidersHorizontal,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

type ToolbarProps = {
  sortBy: 'name' | 'date' | 'size';
  setSortBy: (value: 'name' | 'date' | 'size') => void;
  sortOrder: 'asc' | 'desc';
  toggleSortOrder: () => void;
  viewMode: 'grid' | 'list';
  toggleViewMode: () => void;
  onCopyPath: () => void;
  onDownload: () => void;
  hasSelectedFile: boolean;
};

export default function Toolbar({
  sortBy,
  setSortBy,
  sortOrder,
  toggleSortOrder,
  viewMode,
  toggleViewMode,
  onCopyPath,
  onDownload,
  hasSelectedFile,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onCopyPath} disabled={!hasSelectedFile}>
        <Link2 className="h-4 w-4" /> Copy path
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onDownload} disabled={!hasSelectedFile}>
        <Download className="h-4 w-4" /> Download
      </Button>

      <div className="hidden items-center gap-2 lg:flex">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSortBy('name')}
          aria-label="Sort by name"
          title="Sort by name (Shift+S)"
          className={sortBy === 'name' ? 'border-primary text-primary' : ''}
        >
          <ArrowUpDown className="h-4 w-4" /> Name
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSortBy('date')}
          aria-label="Sort by date"
          title="Sort by date (Shift+S)"
          className={sortBy === 'date' ? 'border-primary text-primary' : ''}
        >
          <Calendar className="h-4 w-4" /> Date
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSortBy('size')}
          aria-label="Sort by size"
          title="Sort by size (Shift+S)"
          className={sortBy === 'size' ? 'border-primary text-primary' : ''}
        >
          <HardDrive className="h-4 w-4" /> Size
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleSortOrder}
          aria-label={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
          title={sortOrder === 'asc' ? 'Ascending (Shift+O)' : 'Descending (Shift+O)'}
        >
          {sortOrder === 'asc' ? (
            <>
              <ArrowUp className="h-4 w-4" /> Asc
            </>
          ) : (
            <>
              <ArrowDown className="h-4 w-4" /> Desc
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleViewMode}
          aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          title={viewMode === 'grid' ? 'Switch to list view (V)' : 'Switch to grid view (V)'}
        >
          {viewMode === 'grid' ? (
            <>
              <LayoutGrid className="h-4 w-4" /> Grid
            </>
          ) : (
            <>
              <List className="h-4 w-4" /> List
            </>
          )}
        </Button>
      </div>

      <details className="relative lg:hidden">
        <summary className="list-none">
          <Button type="button" variant="outline" size="sm" asChild>
            <span aria-label="Open view and sort controls" title="View and sort controls">
              <SlidersHorizontal className="h-4 w-4" /> Controls
            </span>
          </Button>
        </summary>
        <div className="absolute right-0 z-10 mt-2 min-w-[14rem] rounded-md border bg-card p-2 shadow-lg">
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSortBy('name')}
              aria-label="Sort by name"
              title="Sort by name (Shift+S)"
              className={sortBy === 'name' ? 'border-primary text-primary' : ''}
            >
              <ArrowUpDown className="h-4 w-4" /> Name
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSortBy('date')}
              aria-label="Sort by date"
              title="Sort by date (Shift+S)"
              className={sortBy === 'date' ? 'border-primary text-primary' : ''}
            >
              <Calendar className="h-4 w-4" /> Date
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSortBy('size')}
              aria-label="Sort by size"
              title="Sort by size (Shift+S)"
              className={sortBy === 'size' ? 'border-primary text-primary' : ''}
            >
              <HardDrive className="h-4 w-4" /> Size
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleSortOrder}
              aria-label={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
              title={sortOrder === 'asc' ? 'Ascending (Shift+O)' : 'Descending (Shift+O)'}
            >
              {sortOrder === 'asc' ? (
                <>
                  <ArrowUp className="h-4 w-4" /> Asc
                </>
              ) : (
                <>
                  <ArrowDown className="h-4 w-4" /> Desc
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleViewMode}
              aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              title={viewMode === 'grid' ? 'Switch to list view (V)' : 'Switch to grid view (V)'}
            >
              {viewMode === 'grid' ? (
                <>
                  <LayoutGrid className="h-4 w-4" /> Grid
                </>
              ) : (
                <>
                  <List className="h-4 w-4" /> List
                </>
              )}
            </Button>
          </div>
        </div>
      </details>
    </div>
  );
}
