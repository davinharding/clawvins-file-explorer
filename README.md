# 📁 File Explorer

A modern, React-based file browser for OpenClaw agent workspaces — explore files, preview code/markdown, and navigate multiple agent directories from one UI.

![Stack](https://img.shields.io/badge/React_18-TypeScript-blue) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8) ![Vite](https://img.shields.io/badge/Vite-5-646cff)

---

## ✨ Features

- **Multi-workspace support** — Switch between Clawvin, Patch, Scout, Vitals, Ledger, Atlas workspaces
- **File tree navigation** — Collapsible folder tree with lazy-loading
- **Rich file preview** — Syntax-highlighted code, rendered Markdown, image display
- **Search** — Filter files by name in real-time
- **Breadcrumb navigation** — Quick path navigation
- **Download** — One-click file download
- **Copy path** — Copy file path to clipboard
- **Responsive UI** — Clean, modern Tailwind design with Radix UI components

---

## 🛠 Stack

| Layer | Tech |
|-------|------|
| UI Framework | React 18 + TypeScript |
| Bundler | Vite 5 |
| Styling | Tailwind CSS 3 |
| Components | Radix UI primitives |
| Icons | Lucide React |
| Markdown | `react-markdown` + `remark-gfm` |
| Syntax Highlighting | `react-syntax-highlighter` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- OpenClaw Gateway running (provides file API)

### Setup

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

## 📁 Project Structure

```
src/
├── App.tsx                  # Main shell, workspace tabs, file tree + preview layout
├── components/
│   ├── FileTree.tsx         # Collapsible folder tree
│   ├── FilePreview.tsx      # File content viewer (code/markdown/image)
│   ├── Breadcrumbs.tsx      # Path navigation
│   ├── SearchBar.tsx        # File filter search
│   └── ui/                  # Radix/shadcn primitives
├── lib/
│   ├── api.ts               # OpenClaw workspace API client
│   └── utils.ts             # Tailwind utility helpers
└── main.tsx
```

---

## 🔌 API Integration

Connects to OpenClaw Gateway's file API:

```
GET /api/workspace/:workspaceId/files         # List directory
GET /api/workspace/:workspaceId/files/:path   # Get file content
```

Workspace IDs:
- `workspace` → Clawvin
- `workspace-coder` → Patch
- `workspace-scout` → Scout
- `workspace-health` → Vitals
- `workspace-finance` → Ledger
- `workspace-atlas` → Atlas

---

## 🎨 Supported File Types

| Type | Preview |
|------|---------|
| Code | Syntax-highlighted (js, ts, tsx, py, sh, etc.) |
| Markdown | Rendered with GitHub Flavored Markdown |
| Images | Inline display (jpg, png, gif, webp) |
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
