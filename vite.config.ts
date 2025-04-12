import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, '.');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      include: ['lucide-react']
    },
    server: {
      proxy: {
        '/maps-api': {
          target: 'https://maps.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/maps-api/, '')
        }
      }
    },
    define: {
      __GOOGLE_MAPS_API_KEY__: JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY),
    },
  };
});
