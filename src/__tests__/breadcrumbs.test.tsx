import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import Breadcrumbs from '@/components/Breadcrumbs';

const items = [
  { label: 'docs', path: 'docs' },
  { label: 'guides', path: 'docs/guides' },
  { label: 'intro.txt', path: 'docs/guides/intro.txt' },
];

describe('Breadcrumbs', () => {
  it('navigates when clicking breadcrumb', () => {
    const onNavigate = vi.fn();
    const { getByRole } = render(<Breadcrumbs items={items} onNavigate={onNavigate} />);

    fireEvent.click(getByRole('button', { name: 'guides' }));
    expect(onNavigate).toHaveBeenCalledWith('docs/guides');
  });

  it('scrolls to the end when items change', async () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    const { container, rerender } = render(<Breadcrumbs items={items} />);
    const scroller = container.querySelector('.scrollbar-hide') as HTMLDivElement | null;
    if (!scroller) throw new Error('Missing breadcrumb scroll container');

    Object.defineProperty(scroller, 'scrollWidth', { value: 500, configurable: true });
    Object.defineProperty(scroller, 'scrollLeft', { value: 0, writable: true, configurable: true });

    rerender(
      <Breadcrumbs
        items={[...items, { label: 'extra', path: 'docs/guides/intro.txt/extra' }]}
      />
    );

    await waitFor(() => {
      expect(scroller.scrollLeft).toBe(500);
    });

    raf.mockRestore();
  });
});
