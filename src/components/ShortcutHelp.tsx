import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

type ShortcutHelpProps = {
  onClose: () => void;
};

const kbdClassName =
  'inline-flex min-w-[2.1rem] items-center justify-center rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground';

export default function ShortcutHelp({ onClose }: ShortcutHelpProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <Card className="w-full max-w-2xl border-border bg-card shadow-lg">
        <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Keyboard shortcuts</CardTitle>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close keyboard shortcuts">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-5">
            <section className="space-y-3" aria-labelledby="shortcuts-navigation">
              <h3 id="shortcuts-navigation" className="text-sm font-medium text-foreground">Navigation</h3>
              <div className="space-y-2">
                <ShortcutRow keys={<kbd className={kbdClassName}>↑ / ↓</kbd>} description="Move focus between items" />
                <ShortcutRow keys={<kbd className={kbdClassName}>→</kbd>} description="Expand folder" />
                <ShortcutRow keys={<kbd className={kbdClassName}>←</kbd>} description="Collapse folder" />
                <ShortcutRow keys={<kbd className={kbdClassName}>Enter</kbd>} description="Open selected file or folder" />
                <ShortcutRow keys={<kbd className={kbdClassName}>Esc</kbd>} description="Go back to parent or close preview" />
              </div>
            </section>

            <section className="space-y-3" aria-labelledby="shortcuts-search">
              <h3 id="shortcuts-search" className="text-sm font-medium text-foreground">Search</h3>
              <div className="space-y-2">
                <ShortcutRow
                  keys={
                    <div className="flex items-center gap-2">
                      <kbd className={kbdClassName}>Ctrl + K</kbd>
                      <span className="text-xs text-muted-foreground">/</span>
                      <kbd className={kbdClassName}>Cmd + K</kbd>
                    </div>
                  }
                  description="Focus search input"
                />
              </div>
            </section>

            <section className="space-y-3" aria-labelledby="shortcuts-view-sort">
              <h3 id="shortcuts-view-sort" className="text-sm font-medium text-foreground">View & Sort</h3>
              <div className="space-y-2">
                <ShortcutRow keys={<kbd className={kbdClassName}>V</kbd>} description="Toggle view mode (grid/list)" />
                <ShortcutRow keys={<kbd className={kbdClassName}>Shift + S</kbd>} description="Cycle sort (name/date/size)" />
                <ShortcutRow keys={<kbd className={kbdClassName}>Shift + O</kbd>} description="Toggle sort order (asc/desc)" />
                <ShortcutRow keys={<kbd className={kbdClassName}>Backspace</kbd>} description="Go up one level (or close preview if file open)" />
              </div>
            </section>

            <section className="space-y-3" aria-labelledby="shortcuts-general">
              <h3 id="shortcuts-general" className="text-sm font-medium text-foreground">General</h3>
              <div className="space-y-2">
                <ShortcutRow keys={<kbd className={kbdClassName}>?</kbd>} description="Open this help" />
              </div>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type ShortcutRowProps = {
  keys: ReactNode;
  description: string;
};

function ShortcutRow({ keys, description }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border/80 bg-muted/20 px-3 py-2">
      <div className="shrink-0">{keys}</div>
      <div className="text-right text-sm text-muted-foreground">{description}</div>
    </div>
  );
}
