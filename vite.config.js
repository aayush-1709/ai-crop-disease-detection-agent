import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'static/js/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'frontend/index.jsx',
      output: {
        entryFileNames: 'field-mode.js',
        assetFileNames: '[name].[ext]',
        format: 'iife',
        name: 'FieldModeApp'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend')
    }
  }
});
