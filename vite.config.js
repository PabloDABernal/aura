import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/aura/',
  plugins: [react()],
  server: {
    host: true,   // expone en red local → accesible desde móvil
    port: 5173,
  },
})
