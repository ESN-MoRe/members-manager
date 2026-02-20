import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    proxy: {
      '/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Esci da apps/frontend ed entra in apps/backend/public
    outDir: '../backend/public',
    // Svuota la cartella prima di buildare
    emptyOutDir: true,
  },
});
