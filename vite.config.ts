import { defineConfig, type ConfigEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }: ConfigEnv) => {
  const isProd = mode === 'production';

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      hmr: isProd ? false : true, // <--- Modified HMR setting
    },
    build: {
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd,
        },
      },
      // Einheitlich Platform-URL verwenden
      base: 'https://platform.dar-kuwait.com'
    }
  }
});