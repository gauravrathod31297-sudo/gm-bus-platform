import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'fluent': ['@fluentui/react-components', '@fluentui/react-icons'],
          'maps': ['leaflet', 'react-leaflet'],
          'socket': ['socket.io-client'],
        },
      },
    },
  }, plugins: [react()], server: { port: 5174, host: true } })
