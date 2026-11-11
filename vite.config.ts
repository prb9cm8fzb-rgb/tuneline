import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/tuneline/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'TuneLine',
        short_name: 'TuneLine',
        description: 'Hear it. Name it. Place it.',
        start_url: '/tuneline/',
        scope: '/tuneline/',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#11100f',
        theme_color: '#c4f45a',
        icons: [
          { src: '/tuneline/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/tuneline/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
