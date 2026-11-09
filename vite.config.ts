import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // In dev, forward API and raw-file requests to the file server
    // (OpenClaw's, or `npm run demo:server` for the bundled sample workspaces).
    proxy: {
      '/api': 'http://localhost:8080',
      '/ws': 'http://localhost:8080',
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../.fileserver/fe-dist'),
    emptyOutDir: true,
  },
});
