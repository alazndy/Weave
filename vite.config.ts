import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
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
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'esnext',
        outDir: 'dist',
        rollupOptions: {
          output: {
            format: 'es'
          }
        }
      }
    };
});
