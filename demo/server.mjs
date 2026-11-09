#!/usr/bin/env node
/**
 * Demo file server for Clawvin File Explorer.
 *
 * In production the explorer is served by OpenClaw's own file server. This
 * stand-in implements the same small API over the sample workspaces in
 * `demo/workspaces/` so the app can be run anywhere:
 *
 *   GET /api/files?workspace=<id>&path=<dir>          -> directory listing (one level)
 *   GET /api/files/content?workspace=<id>&path=<file>  -> file contents as text
 *   GET /ws/<id>/<path>                                -> raw file (used for downloads)
 *
 * Zero dependencies. Every path is resolved inside its workspace root, so
 * requests cannot escape it.
 */
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.FILE_SERVER_PORT || 8080);
const ROOT = path.resolve(process.env.WORKSPACES_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), 'workspaces'));
const MAX_PREVIEW_BYTES = 1024 * 1024;

function resolveInside(workspace, relPath = '') {
  if (!/^[\w-]+$/.test(workspace)) return null;
  const base = path.join(ROOT, workspace);
  const target = path.resolve(base, relPath);
  if (target !== base && !target.startsWith(base + path.sep)) return null;
  return { base, target };
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function listDir({ base, target }) {
  const entries = await fs.readdir(target, { withFileTypes: true });
  const nodes = await Promise.all(
    entries
      .filter((e) => !e.name.startsWith('.'))
      .map(async (e) => {
        const full = path.join(target, e.name);
        const rel = path.relative(base, full).split(path.sep).join('/');
        if (e.isDirectory()) return { type: 'dir', name: e.name, path: rel };
        const { size } = await fs.stat(full);
        return { type: 'file', name: e.name, path: rel, size };
      })
  );
  return nodes.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === '/api/files' || url.pathname === '/api/files/content') {
      const resolved = resolveInside(url.searchParams.get('workspace') || 'workspace', url.searchParams.get('path') || '');
      if (!resolved) return send(res, 400, { error: 'Invalid path' });

      if (url.pathname === '/api/files') return send(res, 200, await listDir(resolved));

      const { size } = await fs.stat(resolved.target);
      if (size > MAX_PREVIEW_BYTES) return send(res, 413, { error: 'File too large to preview' });
      return send(res, 200, await fs.readFile(resolved.target, 'utf8'), 'text/plain; charset=utf-8');
    }

    const raw = url.pathname.match(/^\/ws\/([\w-]+)\/(.+)$/);
    if (raw) {
      const resolved = resolveInside(raw[1], decodeURIComponent(raw[2]));
      if (!resolved) return send(res, 400, { error: 'Invalid path' });
      return send(res, 200, await fs.readFile(resolved.target), 'application/octet-stream');
    }

    send(res, 404, { error: 'Not found' });
  } catch (err) {
    send(res, err.code === 'ENOENT' ? 404 : 500, { error: err.code === 'ENOENT' ? 'Not found' : 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Demo file server on http://localhost:${PORT} (serving ${ROOT})`);
});
