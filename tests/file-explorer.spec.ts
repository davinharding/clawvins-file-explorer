import { test, expect } from '@playwright/test';

const treeByPath: Record<string, { type: 'file' | 'dir'; name: string; path: string }[]> = {
  '': [
    { type: 'dir', name: 'docs', path: 'docs' },
    { type: 'dir', name: 'media', path: 'media' },
    { type: 'file', name: 'notes.txt', path: 'notes.txt' },
  ],
  docs: [
    { type: 'dir', name: 'guides', path: 'docs/guides' },
    { type: 'file', name: 'readme.md', path: 'docs/readme.md' },
  ],
  'docs/guides': [
    { type: 'file', name: 'intro.txt', path: 'docs/guides/intro.txt' },
  ],
  media: [{ type: 'file', name: 'logo.png', path: 'media/logo.png' }],
};

const contentByPath: Record<string, string> = {
  'notes.txt': 'Sample notes content',
  'docs/readme.md': '# Readme',
  'docs/guides/intro.txt': 'Intro content',
};

const pngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
  'base64'
);

test.beforeEach(async ({ page }) => {
  await page.route('**/api/files/content**', async (route) => {
    const url = new URL(route.request().url());
    const path = decodeURIComponent(url.searchParams.get('path') ?? '');
    const content = contentByPath[path] ?? '';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content }),
    });
  });

  await page.route('**/api/files**', async (route) => {
    const url = new URL(route.request().url());
    const path = decodeURIComponent(url.searchParams.get('path') ?? '');
    const body = treeByPath[path] ?? [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  await page.route('**/ws/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: pngBuffer,
    });
  });

  await page.goto('/');
});

test('browse nested folders', async ({ page }) => {
  await page.getByRole('treeitem', { name: 'docs' }).click();
  await page.getByRole('treeitem', { name: 'guides' }).click();
  await expect(page.getByRole('treeitem', { name: 'intro.txt' })).toBeVisible();
});

test('search by name', async ({ page }) => {
  await page.keyboard.press('Control+K');
  await page.getByPlaceholder('Search files').fill('notes');
  await expect(page.getByRole('treeitem', { name: 'notes.txt' })).toBeVisible();
});

test('preview text file', async ({ page }) => {
  await page.getByRole('treeitem', { name: 'notes.txt' }).click();
  await expect(page.getByText('Sample notes content')).toBeVisible();
});

test('preview image file', async ({ page }) => {
  await page.getByRole('treeitem', { name: 'media' }).click();
  await page.getByRole('treeitem', { name: 'logo.png' }).click();
  await expect(page.locator('img[alt="logo.png"]')).toBeVisible();
});

test('copy to clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('treeitem', { name: 'notes.txt' }).click();
  await page.getByRole('button', { name: 'Copy path' }).click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe('notes.txt');
});

test('mobile drawer navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('/');

  await page.getByLabel('Open file tree').click();
  await expect(page.getByText('File Tree')).toBeVisible();

  await page.getByRole('treeitem', { name: 'notes.txt' }).click();
  await expect(page.locator('#mobile-file-drawer')).not.toHaveClass(/is-open/);
});
