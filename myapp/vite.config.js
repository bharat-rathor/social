import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { socialServerPlugin } from './viteServerPlugin.js'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? '/social/' : '/'),
  plugins: [react(), socialServerPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
