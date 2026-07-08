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
      build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('firebase')) {
                  return 'vendor-firebase';
                }
                if (id.includes('lucide-react')) {
                  return 'vendor-lucide';
                }
                if (id.includes('motion')) {
                  return 'vendor-motion';
                }
                return 'vendor';
              }
            }
          }
        }
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
            id: "filant225-app",
            name: "FILANT°225",
            short_name: "FILANT225",
            description: "Réseau de services, mise en relation, de sécurité et de paiements sécurisés en Côte d'Ivoire. FILANT°225 vous connecte avec des professionnels certifiés en toute simplicité.",
            start_url: "/",
            display: "standalone",
            orientation: "portrait-primary",
            background_color: "#ffffff",
            theme_color: "#000000",
            icons: [
              {
                "src": "icons/icon-72x72.png",
                "sizes": "72x72",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-72x72-maskable.png",
                "sizes": "72x72",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-96x96.png",
                "sizes": "96x96",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-96x96-maskable.png",
                "sizes": "96x96",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-128x128.png",
                "sizes": "128x128",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-128x128-maskable.png",
                "sizes": "128x128",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-144x144.png",
                "sizes": "144x144",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-144x144-maskable.png",
                "sizes": "144x144",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-192x192.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-192x192-maskable.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-256x256.png",
                "sizes": "256x256",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-256x256-maskable.png",
                "sizes": "256x256",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-384x384.png",
                "sizes": "384x384",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-384x384-maskable.png",
                "sizes": "384x384",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-512x512.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any maskable"
              },
              {
                "src": "icons/icon-512x512-maskable.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any maskable"
              }
            ],
            screenshots: [
              {
                "src": "screenshots/screenshot-mobile.png",
                "sizes": "540x720",
                "type": "image/png",
                "form_factor": "narrow"
              },
              {
                "src": "screenshots/screenshot-desktop.png",
                "sizes": "1920x1080",
                "type": "image/png",
                "form_factor": "wide"
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
