import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import FilePreview from '@/components/FilePreview';
import type { FileNode } from '@/lib/api';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    buildWorkspaceFileUrl: (path: string) => `/ws/${path}`,
  };
});

describe('FilePreview', () => {
  it('renders text file content', () => {
    const file: FileNode = { type: 'file', name: 'notes.txt', path: 'notes.txt' };
    const { container } = render(
      <FilePreview file={file} content={'Hello world'} loading={false} />
    );

    expect(container.textContent).toContain('Hello world');
  });

  it('renders markdown content', () => {
    const file: FileNode = { type: 'file', name: 'readme.md', path: 'readme.md' };
    const { container } = render(
      <FilePreview file={file} content={'# Title'} loading={false} />
    );

    expect(container.textContent).toContain('Title');
  });

  it('renders image preview', () => {
    const file: FileNode = { type: 'file', name: 'image.png', path: 'image.png' };
    const { container } = render(
      <FilePreview file={file} content={''} loading={false} />
    );

    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/ws/image.png');
  });
});
