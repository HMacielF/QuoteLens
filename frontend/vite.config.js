import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The sample PDFs live in ../samples, outside this folder, so the dev server must be allowed to read them.
  server: { port: 5173, fs: { allow: ['..'] } },
  test: { environment: 'node' },
});
