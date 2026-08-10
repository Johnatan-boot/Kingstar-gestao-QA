import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      federation({
        name: 'host',
        remotes: {
          qa_mfe: '/mfe/assets/remoteEntry.js'
        },
        shared: ['react', 'react-dom', 'lucide-react', 'react-hot-toast']
      })
    ],
    build: {
      target: 'esnext'
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
