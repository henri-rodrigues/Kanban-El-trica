import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Relative asset base path for maximum compatibility on GitHub Pages and local builds
  server: {
    port: 3000,
    host: true
  }
});
