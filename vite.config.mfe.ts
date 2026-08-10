import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'qa_mfe',
      filename: 'remoteEntry.js',
      exposes: {
        './QAView': './src/components/QAView.tsx',
      },
      remotes: {
        qa_mfe: '/mfe/assets/remoteEntry.js'
      },
      shared: ['react', 'react-dom', 'lucide-react', 'react-hot-toast']
    })
  ],
  build: {
    outDir: 'dist-mfe',
    target: 'esnext',
    emptyOutDir: true,
    minify: false,
    cssCodeSplit: false
  }
});
