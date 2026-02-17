import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (path: string) => void;
  className?: string;
}

export default function Breadcrumbs({ items, onNavigate, className }: BreadcrumbsProps) {
  return (
    <nav className={cn('flex flex-wrap items-center gap-1 text-xs text-muted-foreground', className)}>
      <button
        type="button"
        onClick={() => onNavigate?.('')}
        className="flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground transition-colors"
      >
        <Home className="h-3 w-3" />
      </button>
      {items.map((item, index) => (
        <div key={`${item.path}-${index}`} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {index === items.length - 1 ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate?.(item.path)}
              className="rounded px-1 py-0.5 hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}
