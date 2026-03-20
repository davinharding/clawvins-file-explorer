import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Reset dropdown on path change
  useEffect(() => {
    setDropdownOpen(false);
  }, [items]);

  const handleDropdownItemClick = (path: string) => {
    setDropdownOpen(false);
    onNavigate?.(path);
  };

  // Overflow logic: if items > 3, show [first] > [...] > [second-to-last] > [last]
  const shouldCollapse = items.length > 3;
  const hiddenItems = shouldCollapse ? items.slice(1, items.length - 2) : [];

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
          {!shouldCollapse ? (
            // Normal render: items <= 3
            items.map((item, index) => (
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
            ))
          ) : (
            // Collapsed render: [first] > [...] > [second-to-last] > [last]
            <>
              {/* First item */}
              <div className="flex items-center gap-1 shrink-0">
                <ChevronRight className="h-3 w-3 shrink-0" />
                <button
                  type="button"
                  onClick={() => onNavigate?.(items[0].path)}
                  className="max-w-[120px] truncate rounded px-1 py-0.5 hover:text-foreground transition-colors sm:max-w-[200px]"
                >
                  {items[0].label}
                </button>
              </div>

              {/* Dropdown button */}
              <div className="flex items-center gap-1 shrink-0 relative">
                <ChevronRight className="h-3 w-3 shrink-0" />
                <button
                  ref={buttonRef}
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="rounded px-1 py-0.5 hover:text-foreground transition-colors"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg p-1 min-w-[160px]"
                  >
                    {hiddenItems.map((item, index) => (
                      <button
                        key={`${item.path}-${index}`}
                        type="button"
                        onClick={() => handleDropdownItemClick(item.path)}
                        className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted/50 transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Second-to-last item */}
              <div className="flex items-center gap-1 shrink-0">
                <ChevronRight className="h-3 w-3 shrink-0" />
                <button
                  type="button"
                  onClick={() => onNavigate?.(items[items.length - 2].path)}
                  className="max-w-[120px] truncate rounded px-1 py-0.5 hover:text-foreground transition-colors sm:max-w-[200px]"
                >
                  {items[items.length - 2].label}
                </button>
              </div>

              {/* Last item */}
              <div className="flex items-center gap-1 shrink-0">
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span className="max-w-[120px] truncate font-medium text-foreground sm:max-w-[200px]">
                  {items[items.length - 1].label}
                </span>
              </div>
            </>
          )}
        </div>
        <div
          aria-hidden="true"
          className="breadcrumb-fade pointer-events-none absolute inset-y-0 left-0 w-8 bg-background/80"
        />
      </div>
    </nav>
  );
}
