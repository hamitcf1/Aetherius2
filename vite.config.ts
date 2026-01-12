import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync } from 'fs';
import { fileURLToPath } from 'url';


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const geminiApiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
  const geminiApiKey2 = env.VITE_GEMINI_API_KEY_2 || env.GEMINI_API_KEY_2 || '';
  const geminiApiKey3 = env.VITE_GEMINI_API_KEY_3 || env.GEMINI_API_KEY_3 || '';
  const gemmaApiKey = env.VITE_GEMMA_API_KEY || env.GEMMA_API_KEY || env.gemma_api_key || '';
  
  return {
    base: '/',
    plugins: [
      react(),
      {
        name: 'copy-redirects',
        closeBundle: () => {
          try {
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = resolve(__filename, '..');
            const source = resolve(__dirname, 'public/_redirects');
            const dest = resolve(__dirname, 'dist/_redirects');
            copyFileSync(source, dest);
          } catch (e) {
            console.error('Error copying _redirects file:', e);
          }
        },
      },
    ],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id) return undefined;
            if (id.includes('node_modules')) {
              if (id.includes('jspdf')) return 'vendor-jspdf';
              if (id.includes('html2canvas')) return 'vendor-html2canvas';
              if (id.includes('purify.es') || id.includes('purify')) return 'vendor-purify';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('/react/') || id.includes('/react-dom/')) return 'vendor-react';
              if (id.includes('@google') || id.includes('gpt')) return 'vendor-ai';
              // fallback vendor chunk
              return 'vendor';
            }
          }
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(geminiApiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'process.env.GEMINI_API_KEY_2': JSON.stringify(geminiApiKey2),
      'process.env.GEMINI_API_KEY_3': JSON.stringify(geminiApiKey3),
      'process.env.GEMMA_API_KEY': JSON.stringify(gemmaApiKey),
      'process.env.gemma_api_key': JSON.stringify(gemmaApiKey)
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, '.'),
      },
    },
  };
});