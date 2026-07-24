import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves project sites under /<repo>/ — CI sets VITE_BASE.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
})
