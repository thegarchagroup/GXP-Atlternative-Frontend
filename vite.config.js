import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // The app is served at https://ai.thegarchagroup.com/gxp/
    base: '/gxp/',
    plugins: [react()],
    server: {
      port: 5173,
      host: 'localhost',
      strictPort: true,
      // Lets you use VITE_API_BASE_URL=/api/v1 in development (same-origin, no CORS)
      proxy: {
        '/api': { target: env.VITE_DEV_PROXY_TARGET || 'http://localhost:1802', changeOrigin: true },
      },
    },
    build: { outDir: 'dist', sourcemap: false },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.js',
      css: false,
    },
  };
});
