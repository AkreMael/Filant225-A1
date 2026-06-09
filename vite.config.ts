import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'icons/*', 'screenshots/*'],
          workbox: {
            maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 // 10MB
          },
          manifest: {
            name: "FILANT°225",
            short_name: "FILANT225",
            start_url: "/",
            display: "standalone",
            background_color: "#ffffff",
            theme_color: "#000000",
            icons: [
              {
                "src": "/icons/icon-72x72.png",
                "sizes": "72x72",
                "type": "image/png"
              },
              {
                "src": "/icons/icon-96x96.png",
                "sizes": "96x96",
                "type": "image/png"
              },
              {
                "src": "/icons/icon-128x128.png",
                "sizes": "128x128",
                "type": "image/png"
              },
              {
                "src": "/icons/icon-144x144.png",
                "sizes": "144x144",
                "type": "image/png"
              },
              {
                "src": "/icons/icon-192x192.png",
                "sizes": "192x192",
                "type": "image/png"
              },
              {
                "src": "/icons/icon-512x512.png",
                "sizes": "512x512",
                "type": "image/png"
              }
            ],
            screenshots: [
              {
                "src": "/screenshots/screenshot-mobile.png",
                "sizes": "540x720",
                "type": "image/png",
                "form_factor": "narrow"
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
