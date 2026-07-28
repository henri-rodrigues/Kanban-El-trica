import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative assets loading on GitHub Pages (https://user.github.io/repo/)
  server: {
    port: 3000,
    host: true
  }
});
