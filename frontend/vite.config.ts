import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true, // Force Vite à hurler dans le terminal et sur le navigateur à la moindre erreur TS
    }),
  ],
})
