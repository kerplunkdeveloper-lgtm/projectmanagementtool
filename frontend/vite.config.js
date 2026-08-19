import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-ui': ['framer-motion', 'react-icons', 'react-hot-toast'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          'vendor-socket': ['socket.io-client', 'axios'],
        },
      },
    },
  },
})