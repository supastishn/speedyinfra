/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const config = {
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

  if (command === 'build') {
    config.base = '/speedyinfra/';
  }

  return config;
})
