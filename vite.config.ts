import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { BRAND } from './src/app/brand.ts'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'app-brand',
      transformIndexHtml: (html) => html
        .replaceAll('%APP_NAME%', BRAND.name)
        .replaceAll('%APP_DESCRIPTION%', BRAND.description)
        .replaceAll('%APP_THEME%', BRAND.themeColor),
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/world.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: BRAND.name,
        short_name: BRAND.shortName,
        description: BRAND.description,
        theme_color: BRAND.themeColor,
        background_color: BRAND.themeColor,
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/world-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/world-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/world-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{html,js,css,svg,png,webp}'],
      },
    }),
  ],
})
