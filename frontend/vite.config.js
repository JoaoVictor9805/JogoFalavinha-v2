import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:3001'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/[\\/]node_modules[\\/]three[\\/]/.test(id)) {
            return 'vendor-three'
          }
          return undefined
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts: [
      '.trycloudflare.com',
      '.ngrok-free.app',
      '.ngrok.io',
      '.devtunnels.ms',
      '.loca.lt',
    ],
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
    },
  },
})
