import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { UserConfig as ViteUserConfig } from 'vite'

interface VitestConfig extends ViteUserConfig {
  test?: Record<string, any>
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/uploads': {
        target: 'http://localhost:5162',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/components/__tests__/setup.ts',
  },
} as VitestConfig)