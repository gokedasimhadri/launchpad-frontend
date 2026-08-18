import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/adityaapi': {
        target: 'https://info.aec.edu.in',
        changeOrigin: true,
      }
    }
  },
  preview: {
    allowedHosts: ['oipr.adityauniversity.in'],
  }
})