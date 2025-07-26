import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/rest': 'http://localhost:3000',
    },
    hmr: {
      clientPort: 5173,
      protocol: 'ws'
    }
  }
})
