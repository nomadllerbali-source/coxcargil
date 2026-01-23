import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        copyFileSync('_redirects', 'dist/_redirects');
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
