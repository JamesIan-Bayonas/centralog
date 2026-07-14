import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { UserConfig as ViteUserConfig } from 'vite'

// Vitest directly extends Vite's UserConfig interface definition internally 
interface VitestConfig extends ViteUserConfig {
  test?: Record<string, any>
}

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/components/__tests__/setup.ts',
  },
} as VitestConfig)