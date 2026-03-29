import { useMemo, useState } from 'react';

const STORAGE_KEY_WORKSPACE = 'fe.workspace';

export const WORKSPACES = [
  { value: 'backend', label: 'backend' },
  { value: 'frontend', label: 'frontend' },
] as const;

function resolveInitialWorkspace(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('workspace');
    if (fromUrl && WORKSPACES.some((item) => item.value === fromUrl)) {
      return fromUrl;
    }
  } catch {
    // noop
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY_WORKSPACE);
    if (stored && WORKSPACES.some((item) => item.value === stored)) {
      return stored;
    }
  } catch {
    // noop
  }

  return WORKSPACES[0].value;
}

export function useWorkspace() {
  const [workspace, setWorkspaceState] = useState<string>(resolveInitialWorkspace);

  const setWorkspace = (next: string) => {
    setWorkspaceState(next);
    try {
      localStorage.setItem(STORAGE_KEY_WORKSPACE, next);
    } catch {
      // noop
    }
  };

  const workspaces = WORKSPACES;
  const currentLabel = useMemo(
    () => workspaces.find((item) => item.value === workspace)?.label ?? workspace,
    [workspace]
  );

  return { workspace, setWorkspace, workspaces, currentLabel };
}
