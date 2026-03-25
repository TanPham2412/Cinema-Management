import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    // Thêm đoạn này để cho phép tên miền của bạn truy cập vào
    allowedHosts: [
      'plvcinema.xyz'
    ],
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://api.plvcinema.xyz',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
