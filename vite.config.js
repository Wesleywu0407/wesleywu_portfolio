import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages hosts this project below the repository path. Keep `/` for
  // local development and other hosts such as Vercel.
  base: process.env.GITHUB_PAGES === 'true' ? '/wesleywu_portfolio/' : '/',
  server: { port: 5173 },
})
