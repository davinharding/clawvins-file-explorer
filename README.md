# 📁 File Explorer

A modern, React-based file browser for OpenClaw agent workspaces — explore files, preview code/markdown, and navigate multiple agent directories from one UI.

![Stack](https://img.shields.io/badge/React_18-TypeScript-blue) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8) ![Vite](https://img.shields.io/badge/Vite-5-646cff)

---

## ✨ Features

- **Multi-workspace support** — Switch between Clawvin, Patch, Scout, Vitals, Ledger, Atlas
- **Lazy-loaded file tree** — Expand folders on demand with loading indicators
- **Search with auto-expand** — Filter by name and auto-open matching folders
- **Rich previews** — Syntax-highlighted code, rendered Markdown (GFM), inline images
- **Breadcrumb navigation** — Jump to any parent path
- **Quick actions** — Copy file path + one-click download
- **Resilient UX** — Loading + error states for tree and file content
- **Responsive layout** — Clean, modern UI with Radix primitives + Tailwind

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| UI Framework | React 18 + TypeScript |
| Bundler | Vite 5 |
| Styling | Tailwind CSS 3 + class-variance-authority |
| Components | Radix UI primitives (shadcn-style) |
| Icons | Lucide React |
| Markdown | `react-markdown` + `remark-gfm` |
| Syntax Highlighting | Prism via `react-syntax-highlighter` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- OpenClaw Gateway (provides the file API)

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Runs on `http://localhost:5173` (or next available port).

### Production Build

```bash
npm run build
npm run preview
```

Builds to `dist/` and serves on port `4173`.

---

## 🔐 Authentication (Optional)

This UI supports token-based auth if your Gateway requires it.

- Supply a token via URL: `?token=YOUR_TOKEN`
- The token is persisted to `localStorage` under `fe_token`
- API requests use `Authorization: Bearer <token>`
- Downloads use a `?token=` query param

---

## 🔧 Configuration

No environment variables are required by default. The app calls the Gateway using relative paths, so it expects to be served behind the same origin as the API (or via a reverse proxy).

Optional URL params:
- `?workspace=workspace-coder` to preselect a workspace
- `?token=...` for authenticated access (see above)

---

## 🔌 API Integration

The app expects the following Gateway routes:

```
GET /api/files?path=<path>&workspace=<workspaceId>     # List directory
GET /api/files/content?path=<path>&workspace=<workspaceId>  # Get file content
GET /ws/<workspaceId>/<path>[?token=...]               # File download / image preview
```

Workspace IDs:
- `workspace` → Clawvin
- `workspace-coder` → Patch
- `workspace-scout` → Scout
- `workspace-health` → Vitals
- `workspace-finance` → Ledger
- `workspace-atlas` → Atlas

---

## 🧱 Architecture Overview

- **UI shell** (`src/App.tsx`) handles workspace selection, tree state, and preview state.
- **API client** (`src/lib/api.ts`) fetches directory trees + file content and handles auth.
- **File tree** (`src/components/FileTree.tsx`) renders a collapsible, lazy-loaded tree.
- **File preview** (`src/components/FilePreview.tsx`) renders code, markdown, or images.
- **Design system** (`src/components/ui/`) wraps Radix primitives with Tailwind styles.

---

## 📁 Project Structure

```
src/
├── App.tsx                  # Main shell, workspace tabs, file tree + preview layout
├── components/
│   ├── FileTree.tsx         # Collapsible folder tree with lazy loading
│   ├── FilePreview.tsx      # File content viewer (code/markdown/image)
│   ├── Breadcrumbs.tsx      # Path navigation
│   ├── SearchBar.tsx        # File filter search
│   └── ui/                  # Radix/shadcn primitives
├── lib/
│   ├── api.ts               # Gateway API client + auth helpers
│   └── utils.ts             # Tailwind utility helpers
└── main.tsx
```

---

## 🎨 Supported File Types

| Type | Preview |
|------|---------|
| Code | Syntax-highlighted (ts, tsx, js, json, py, sh, etc.) |
| Markdown | Rendered with GitHub Flavored Markdown |
| Images | Inline display (jpg, png, gif, webp, svg) |
| Other | Raw text display |

---

## 🌿 Git Workflow

| Branch | Purpose |
|--------|---------|
| `master` | Production |
| `dev` | Integration branch — all features merge here first |
| `feature/*` | Feature branches → PR → `dev` |

**Never push directly to `master`.**

---

*Part of the [Harding Labs](https://github.com/Harding-Labs) toolchain.*
