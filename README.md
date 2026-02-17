# 🗂️ Clawvin File Explorer

A modern, dark-themed file explorer for browsing OpenClaw agent workspaces — built with React, TypeScript, and Tailwind CSS.

![Stack](https://img.shields.io/badge/React_18-TypeScript-blue) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8) ![Vite](https://img.shields.io/badge/Vite-6-646cff)

---

## ✨ Features

- **Workspace switcher** — instantly jump between all 6 OpenClaw workspaces (Clawvin, Patch, Scout, Vitals, Ledger, Atlas)
- **Lazy file tree** — directories expand on click; children load on demand (no full tree scan upfront)
- **File preview panel**
  - Syntax highlighting for 100+ languages via `react-syntax-highlighter`
  - Rendered Markdown (with GitHub Flavored Markdown support)
  - Plain text fallback
- **Breadcrumb navigation** — click any segment to jump up the tree
- **Search / filter** — live-filters the visible file tree by name
- **Copy path** — one-click clipboard copy of any file's full path
- **Download** — download any file directly from the browser
- **Dark grid theme** — consistent with Mission Control's design language

---

## 🛠 Stack

| Layer | Tech |
|-------|------|
| UI Framework | React 18 + TypeScript |
| Bundler | Vite 6 |
| Styling | Tailwind CSS 3 |
| Components | Radix UI primitives (ScrollArea, Collapsible, Separator) |
| Icons | Lucide React |
| Markdown | `react-markdown` + `remark-gfm` |
| Syntax highlighting | `react-syntax-highlighter` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- The OpenClaw file server (`server.js`) running

### Development

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

Output goes to `dist/`. The OpenClaw file server (`server.js`) serves the built app and proxies filesystem requests.

### Running via OpenClaw

The app is served by the existing `.fileserver/server.js` at **`http://localhost:8080`**.

The server was patched to:
1. Route `/assets/` requests to the built `fe-dist/` output
2. Exempt `fe-dist/` from the `.fileserver` security block

---

## 📁 Project Structure

```
src/
├── App.tsx              # Main app shell, workspace switcher, layout
├── components/
│   ├── FileTree.tsx     # Recursive lazy-loading tree
│   ├── FilePreview.tsx  # Preview panel (markdown / syntax / text)
│   ├── Breadcrumb.tsx   # Path breadcrumb nav
│   └── ui/              # Shared Radix-based primitives
├── lib/
│   └── utils.ts         # cn() helper
└── main.tsx             # Entry point
```

---

## 🗃 Workspaces

| Label | Path |
|-------|------|
| Clawvin | `~/.openclaw/workspace/` |
| Patch | `~/.openclaw/workspace-coder/` |
| Scout | `~/.openclaw/workspace-scout/` |
| Vitals | `~/.openclaw/workspace-health/` |
| Ledger | `~/.openclaw/workspace-finance/` |
| Atlas | `~/.openclaw/workspace-atlas/` |

---

## 🔒 Security

The file server enforces path traversal protection — requests cannot escape the workspace root. The `.fileserver` directory itself is blocked from direct access (with an exception for the `fe-dist/` build output).

---

*Part of the [Harding Labs](https://github.com/davinharding) toolchain.*
