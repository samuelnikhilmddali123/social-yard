import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    target: ['es2015', 'chrome60', 'safari11', 'edge16'],
    cssTarget: 'chrome60',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
})

