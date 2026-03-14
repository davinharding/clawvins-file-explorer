export type FileNode = {
  type: 'file' | 'dir';
  name: string;
  path: string;
  children?: FileNode[];
  workspace?: string;
  note?: string;
  size?: number;
  mtime?: number;
  childCount?: number;
};

type ApiTreeResponse = FileNode[] | { tree?: FileNode[]; entries?: FileNode[]; files?: FileNode[] };

type ApiContentResponse =
  | string
  | { content?: string; data?: string; text?: string; body?: string }
  | { error?: string };

// ── Auth token management ────────────────────────────────────────────────────
// Priority: 1) URL ?token= param  2) localStorage  3) empty (will 401)

const LS_KEY = 'fe_token';

function getToken(): string {
  // Try URL param first (sets/refreshes localStorage)
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  if (urlToken) {
    try { localStorage.setItem(LS_KEY, urlToken); } catch (_) {}
    return urlToken;
  }
  // Fall back to localStorage
  try { return localStorage.getItem(LS_KEY) ?? ''; } catch (_) { return ''; }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
// ── End auth ─────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

function normalizeTree(payload: ApiTreeResponse): FileNode[] {
  if (Array.isArray(payload)) return payload;
  if (payload.tree && Array.isArray(payload.tree)) return payload.tree;
  if (payload.entries && Array.isArray(payload.entries)) return payload.entries;
  if (payload.files && Array.isArray(payload.files)) return payload.files;
  return [];
}

function normalizeContent(payload: ApiContentResponse): string {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return '';
  if ('content' in payload && payload.content) return payload.content;
  if ('data' in payload && payload.data) return payload.data;
  if ('text' in payload && payload.text) return payload.text;
  if ('body' in payload && payload.body) return payload.body;
  return '';
}

export async function listDirectory(path = '', workspace = 'workspace'): Promise<FileNode[]> {
  const encoded = encodeURIComponent(path);
  const url = `/api/files?path=${encoded}&workspace=${encodeURIComponent(workspace)}`;
  const payload = await fetchJson<ApiTreeResponse>(url);
  return normalizeTree(payload);
}

export async function fetchFileTree(path = '', workspace = 'workspace'): Promise<FileNode[]> {
  return listDirectory(path, workspace);
}

export async function fetchFileContent(path: string, workspace = 'workspace'): Promise<string> {
  const encoded = encodeURIComponent(path);
  const url = `/api/files/content?path=${encoded}&workspace=${encodeURIComponent(workspace)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to load content (${res.status})`);
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const payload = (await res.json()) as ApiContentResponse;
    return normalizeContent(payload);
  }
  return await res.text();
}

export function buildWorkspaceFileUrl(filePath: string, workspace = 'workspace'): string {
  const token = getToken();
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  return `/ws/${encodeURIComponent(workspace)}/${filePath}${tokenParam}`;
}
