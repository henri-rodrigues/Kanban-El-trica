import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Kanban-El-trica/', // Repository base path for GitHub Pages
  server: {
    port: 3000,
    host: true
  }
});
