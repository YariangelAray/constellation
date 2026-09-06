import { defineConfig } from 'vite';

// base './' → funciona en https://usuario.github.io/nombre-del-repo/ sin tocar nada.
export default defineConfig({
  base: './',
  server: { host: true },
  build: { target: 'es2020', chunkSizeWarningLimit: 1500 },
});
