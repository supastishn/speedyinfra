/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const config = {
    base: '/speedyinfra/',
    plugins: [react()],
    server: {
      proxy: {
        '/rest': 'https://speedyinfra.supastishn.hackclub.app',
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
