import type { Ref } from 'react';
import { useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  matchCount?: number;
}

export default function SearchBar({ value, onChange, placeholder, className, inputRef, matchCount }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const localRef = useRef<HTMLInputElement>(null);
  const isMac = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Mac|iPhone|iPad|iPod/i.test(navigator.platform ?? navigator.userAgent);
  }, []);

  const setRefs = (node: HTMLInputElement | null) => {
    localRef.current = node;
    if (typeof inputRef === 'function') {
      inputRef(node);
    } else if (inputRef) {
      (inputRef as { current: HTMLInputElement | null }).current = node;
    }
  };

  const handleClear = () => {
    onChange('');
    requestAnimationFrame(() => localRef.current?.focus());
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={setRefs}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder ?? 'Search files'}
        className="pl-9 pr-16"
      />
      {!isFocused && !value && (
        <kbd className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {isMac ? 'Cmd+K' : 'Ctrl+K'}
        </kbd>
      )}
      {value && typeof matchCount === 'number' && matchCount > 0 && (
        <span className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 rounded border border-border bg-muted/70 px-2 py-0.5 text-[11px] text-muted-foreground">
          {matchCount} {matchCount === 1 ? 'match' : 'matches'}
        </span>
      )}
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
