# File Explorer Modernization

## Goal
Modernize the file explorer UI to match Mission Control's theme and tech stack.

## Current State
- Single HTML file at `/home/node/.openclaw/workspace/file_explorer.html`
- Vanilla JS + inline styles
- Dark theme with custom CSS variables
- Features: tree view, file preview, markdown rendering

## Target Stack (Match Mission Control)
- **Vite** - Build tool
- **React** - UI library
- **TypeScript** - Type safety
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Features to Preserve
1. **File Tree** - Left sidebar with collapsible folders
2. **File Preview** - Right panel showing file content
3. **Markdown Rendering** - Support for .md files
4. **Multi-Workspace** - Support /ws/<workspace>/<path> routes
5. **Dark Theme** - Match Mission Control's aesthetic

## Features to Add
1. **Search/Filter** - Quick file search
2. **Breadcrumbs** - Current path navigation
3. **File Actions** - Download, copy path, etc.
4. **Syntax Highlighting** - For code files
5. **Responsive** - Mobile-friendly layout

## Visual Design (Match Mission Control)
- **Colors**: Same palette as Mission Control
  - Background: Dark slate
  - Panels: Slightly lighter slate
  - Accents: Blue (#3b82f6)
  - Text: Light gray
- **Components**: Use shadcn/ui where possible
  - Button
  - Card
  - ScrollArea
  - Badge
  - Input (for search)
  - Separator
  - Collapsible (for tree)
- **Layout**:
  - Sidebar: 280px wide (like Mission Control)
  - Main content: Flexible width
  - Header: Breadcrumbs + actions

## Implementation Plan

### Phase 1: Scaffold Vite + React + TypeScript Project
1. Create new project in `/home/node/code/file-explorer-modern`
2. Install dependencies:
   - React, React DOM
   - TypeScript
   - Vite
   - Tailwind CSS
   - shadcn/ui
   - Lucide React
   - react-markdown (for MD rendering)
3. Copy Mission Control's Tailwind config and theme
4. Set up base path: `/file_explorer`

### Phase 2: Build Core Components
1. **FileTree.tsx** - Recursive tree view component
   - Collapsible folders
   - File/folder icons
   - Click to select
2. **FilePreview.tsx** - Content viewer
   - Text files
   - Markdown rendering
   - Image preview
   - Code syntax highlighting (react-syntax-highlighter)
3. **Breadcrumbs.tsx** - Path navigation
4. **SearchBar.tsx** - File search/filter

### Phase 3: API Integration
1. Create API client (`src/lib/api.ts`)
   - `GET /api/files` - List files in directory
   - `GET /api/files/:path` - Get file content
2. Integrate with file server backend
3. Handle workspace-specific routes

### Phase 4: Polish & Deploy
1. Match Mission Control's visual style exactly
2. Add loading states
3. Error handling
4. Build and deploy to `/home/node/.openclaw/workspace/.fileserver/file_explorer/`
5. Update server.js to serve from new location

## File Structure
```
/home/node/code/file-explorer-modern/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── index.html
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── FileTree.tsx
│   │   ├── FilePreview.tsx
│   │   ├── Breadcrumbs.tsx
│   │   ├── SearchBar.tsx
│   │   └── ui/          # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   └── index.css
└── dist/                # Build output
```

## Server Integration

### Update server.js
```javascript
// Add route for file explorer
if (urlPath.startsWith('/file_explorer')) {
  const fileExplorerRoot = '/home/node/code/file-explorer-modern/dist';
  let subPath = urlPath.slice('/file_explorer'.length);
  if (subPath === '' || subPath === '/') subPath = '/index.html';
  
  filePath = path.join(fileExplorerRoot, subPath);
  workspaceRoot = fileExplorerRoot;
}
```

### Add API endpoints (if needed)
- `GET /api/files?path=<path>` - List directory contents
- `GET /api/files/content?path=<path>` - Get file content

## Testing Checklist
- [ ] File tree displays correctly
- [ ] Folders expand/collapse
- [ ] File selection shows preview
- [ ] Markdown files render properly
- [ ] Search filters files
- [ ] Breadcrumbs navigate correctly
- [ ] Mobile responsive
- [ ] Matches Mission Control theme
- [ ] Works with multi-workspace URLs

## Reference Files
- Mission Control: `/home/node/code/mission-control/`
- Current file explorer: `/home/node/.openclaw/workspace/file_explorer.html`
- File server: `/home/node/.openclaw/workspace/.fileserver/server.js`

## Time Estimate
90-120 minutes

## Working Directory
`/home/node/code/file-explorer-modern` (create new project)
