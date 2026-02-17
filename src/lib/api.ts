export type FileNode = {
  type: 'file' | 'dir';
  name: string;
  path: string;
  children?: FileNode[];
  workspace?: string;
  note?: string;
  size?: number;
};

type ApiTreeResponse = FileNode[] | { tree?: FileNode[]; entries?: FileNode[]; files?: FileNode[] };

type ApiContentResponse =
  | string
  | { content?: string; data?: string; text?: string; body?: string }
  | { error?: string };

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
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
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load content (${res.status})`);
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const payload = (await res.json()) as ApiContentResponse;
    return normalizeContent(payload);
  }
  return await res.text();
}

export function buildWorkspaceFileUrl(filePath: string, workspace = 'workspace'): string {
  return `/ws/${encodeURIComponent(workspace)}/${filePath}`;
}
