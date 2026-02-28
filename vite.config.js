import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    host: true,          // Listen on all local IPs
    port: 5173,
  },

  build: {
    // Scalability: Increase chunk warning limit — our app has many pages
    chunkSizeWarningLimit: 1600,

    // Enable source maps for production debugging (comment out if you want smaller output)
    // sourcemap: true,

    // Scalability: Target modern browsers to get smaller bundle sizes
    target: 'es2020',

    // Scalability: Enable CSS code splitting — each page only loads its own CSS
    cssCodeSplit: true,

    rollupOptions: {
      output: {
        // Scalability: Manual chunk splitting to ensure vendor code is cached
        // separately from app code. Users only re-download changed chunks.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Icons — loaded by many pages, cache separately
            if (id.includes('lucide-react') || id.includes('@fortawesome')) {
              return 'vendor-icons';
            }
            // Core React ecosystem — cached long-term, changes rarely
            if (id.includes('react') && !id.includes('recharts') && !id.includes('framer')) {
              return 'vendor-react';
            }
            // Firebase is very large — keep separate so main bundle stays small
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            // Animation library
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            // Charts — only loaded when chart pages are visited
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            // Everything else (axios, etc.)
            return 'vendor';
          }
        },

        // Scalability: Content-hash filenames enable aggressive browser caching
        // Users will never get stale files, and unchanged files stay cached
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
