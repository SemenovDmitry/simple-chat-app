import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  base: '/simple-chat-app/',
  server: {
    proxy: {
      // Когда вы вызываете fetch('/api/auth/me'), Vite перенаправит это на локальный бэк
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Удаляет /api из пути при отправке на бэк
      },
    },
  },
})
