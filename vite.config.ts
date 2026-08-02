import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Chrome extensions can't run a background page fetching remote chunks,
// so we bundle everything into a small number of predictable files.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        settings: resolve(__dirname, 'settings.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  worker: {
    format: 'es',
  },
});
