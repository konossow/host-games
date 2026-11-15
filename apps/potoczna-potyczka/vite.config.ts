import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // względne ścieżki w index.html -> build działa pod dowolnym URL (np. hosting playroom)
  base: './',
  // wspólne zmienne środowiskowe (.env) leżą w katalogu głównym monorepo
  envDir: '../..',
  server: {port: 3004},
});
