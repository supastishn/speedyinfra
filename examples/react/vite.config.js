import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
