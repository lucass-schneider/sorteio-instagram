import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Caminhos relativos: funciona tanto local quanto em lucass-schneider.github.io/sorteio-instagram/
  base: './',
  plugins: [react()],
})
