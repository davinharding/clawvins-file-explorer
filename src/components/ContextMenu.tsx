import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

type ContextMenuItem = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type ContextMenuProps = {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
  className?: string;
};

export default function ContextMenu({ items, position, onClose, className }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState(position);
  const [isMeasured, setIsMeasured] = useState(false);

  useLayoutEffect(() => {
    if (!menuRef.current) return;

    const margin = 8;
    const { width: menuWidth, height: menuHeight } = menuRef.current.getBoundingClientRect();

    let left = position.x;
    let top = position.y;

    if (left + menuWidth > window.innerWidth - margin) {
      left = position.x - menuWidth;
    }

    if (top + menuHeight > window.innerHeight - margin) {
      top = position.y - menuHeight;
    }

    left = Math.min(Math.max(left, margin), window.innerWidth - menuWidth - margin);
    top = Math.min(Math.max(top, margin), window.innerHeight - menuHeight - margin);

    setMenuPosition({ x: left, y: top });
    setIsMeasured(true);
  }, [position.x, position.y, items]);

  useEffect(() => {
    setMenuPosition(position);
    setIsMeasured(false);
  }, [position.x, position.y]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current) return;
      if (event.target instanceof Node && menuRef.current.contains(event.target)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const handleScroll = () => {
      onClose();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      role="menu"
      className={cn(
        'fixed z-50 min-w-[180px] rounded-lg border border-border bg-card p-1 shadow-lg transition-opacity',
        isMeasured ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{ left: menuPosition.x, top: menuPosition.y }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            if (item.disabled) return;
            item.onClick();
            onClose();
          }}
          className={cn(
            'flex w-full items-center rounded-md px-3 py-2 text-sm text-foreground transition-colors',
            item.disabled
              ? 'cursor-not-allowed text-muted-foreground/60'
              : 'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
