import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'CLERK_'],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    // Fallback so VITE_API_URL always resolves
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '/api'),
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            'framer-motion',
            'recharts',
            'lucide-react',
            'leaflet',
            'react-leaflet',
            'socket.io-client'
          ],
        }
      }
    }
  }
})
