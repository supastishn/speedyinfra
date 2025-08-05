/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const config = {
    base: '/speedyinfra/',
    plugins: [react()],
    server: {
      proxy: {
        '/rest': 'http://localhost:3000',
      },
      hmr: {
        clientPort: 5173,
        protocol: 'ws'
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
    }
  };


  return config;
})
