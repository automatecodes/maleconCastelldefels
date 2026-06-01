import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En desarrollo, /api y /media se redirigen al backend.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/media': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
