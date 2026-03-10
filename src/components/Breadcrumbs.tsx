import { useEffect, useRef } from 'react';
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const scrollToEnd = () => {
      container.scrollLeft = container.scrollWidth;
    };

    const frame = requestAnimationFrame(scrollToEnd);
    return () => cancelAnimationFrame(frame);
  }, [items]);

  return (
    <nav className={cn('flex items-center gap-1 text-xs text-muted-foreground', className)}>
      <button
        type="button"
        onClick={() => onNavigate?.('')}
        className="flex shrink-0 items-center gap-1 rounded px-1 py-0.5 hover:text-foreground transition-colors"
      >
        <Home className="h-3 w-3" />
      </button>
      <div className="relative min-w-0 flex-1">
        <div
          ref={scrollRef}
          className="flex flex-nowrap items-center gap-1 overflow-x-auto scrollbar-hide"
        >
          {items.map((item, index) => (
            <div key={`${item.path}-${index}`} className="flex items-center gap-1 shrink-0">
              <ChevronRight className="h-3 w-3 shrink-0" />
              {index === items.length - 1 ? (
                <span className="max-w-[120px] truncate font-medium text-foreground sm:max-w-[200px]">
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate?.(item.path)}
                  className="max-w-[120px] truncate rounded px-1 py-0.5 hover:text-foreground transition-colors sm:max-w-[200px]"
                >
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="breadcrumb-fade pointer-events-none absolute inset-y-0 left-0 w-8 bg-background/80"
        />
      </div>
    </nav>
  );
}
