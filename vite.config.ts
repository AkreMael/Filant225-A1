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
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          workbox: {
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB
          },
          manifest: {
            name: 'FILANT°225',
            short_name: 'FILANT225',
            description: 'Plateforme de services (offres, travailleurs, urgence, position, carte, etc.)',
            theme_color: '#0f172a',
            background_color: '#0f172a',
            display: 'standalone',
            orientation: 'any',
            icons: [
              {
                src: 'https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/343956e5-aaed-4531-85f6-a07422df385b.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/343956e5-aaed-4531-85f6-a07422df385b.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'https://i.supaimg.com/0543a7e5-673b-44b9-9668-8152c5aea01b/343956e5-aaed-4531-85f6-a07422df385b.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
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
