/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Default: test di dominio puri, senza DOM. I test che rendono
    // componenti dichiarano `// @vitest-environment jsdom` in testa.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
