import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
    return {
      base: './',  // Use relative paths for Electron
      server: {
        port: 3004,
        host: '0.0.0.0',
      },
      esbuild: {
        target: 'esnext',
      },
      optimizeDeps: {
        esbuildOptions: {
          target: 'esnext',
        },
      },
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        target: 'esnext',
        outDir: 'dist',
        rollupOptions: {
          output: {
            format: 'es' as const
          }
        }
      }
    };
});
