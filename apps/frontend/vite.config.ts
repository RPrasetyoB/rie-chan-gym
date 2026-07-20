import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/')
          ) {
            return 'react-vendor'
          }

          if (id.includes('/@radix-ui/') || id.includes('/lucide-react/')) {
            return 'ui-vendor'
          }

          if (
            id.includes('/@tanstack/') ||
            id.includes('/axios/') ||
            id.includes('/date-fns/') ||
            id.includes('/react-hook-form/') ||
            id.includes('/@hookform/') ||
            id.includes('/zod/') ||
            id.includes('/clsx/') ||
            id.includes('/tailwind-merge/') ||
            id.includes('/class-variance-authority/')
          ) {
            return 'app-core'
          }

          if (id.includes('/react-markdown/') || id.includes('/remark-gfm/')) {
            return 'markdown'
          }

          if (id.includes('/recharts/')) {
            return 'charts'
          }

          if (id.includes('/framer-motion/')) {
            return 'motion'
          }

          if (id.includes('/@tensorflow/tfjs-core/')) {
            return 'tf-core'
          }

          if (id.includes('/@tensorflow/tfjs-backend-webgl/')) {
            return 'tf-backend-webgl'
          }

          if (id.includes('/@tensorflow/tfjs-converter/')) {
            return 'tf-converter'
          }

          if (id.includes('/@tensorflow-models/pose-detection/')) {
            return 'pose-detection'
          }

          if (id.includes('/@mediapipe/')) {
            return 'mediapipe'
          }

          if (id.includes('/@ultralytics/')) {
            return 'ultralytics'
          }
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@mediapipe/pose', '@mediapipe/tasks-vision'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'Rie-chan Cute PT',
        short_name: 'Rie-chan PT',
        description: 'Your cute personal fitness coach',
        theme_color: '#3CA8AB',
        background_color: '#0a0a0a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
