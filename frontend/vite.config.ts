/// <reference types="vitest" />
import path from "path"
import { readFileSync } from "node:fs"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Read app version at config time. The root package.json is the source of truth
// (synced into frontend/package.json + tauri.conf.json + Cargo.toml via
// scripts/sync-version.mjs); we read frontend's copy because it lives next to
// vite.config and is always in sync after `npm run sync:version`.
const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'),
) as { version: string }

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Inject app version into the bundle so any module can reference
      // `__APP_VERSION__` directly (typed in src/types/global.d.ts).
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    esbuild: {
      // Strip noisy logs from production bundles. Errors/warnings stay because
      // they go through utils/logger which we keep verbose.
      drop: isProd ? ['debugger'] : [],
      pure: isProd ? ['console.log', 'console.debug', 'console.info'] : [],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5005,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
        }
      }
    },
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData',
          '**/dist',
        ],
      },
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e'],
    },
    build: {
      // Hidden sourcemaps in production: not referenced from the bundle, but
      // available for upload to a crash-reporting service later.
      sourcemap: isProd ? 'hidden' : false,
      target: 'es2022',
      cssCodeSplit: true,
      reportCompressedSize: false, // ускоряет build, gzip-метрика мало кому нужна
      chunkSizeWarningLimit: 1024,
      rollupOptions: {
        output: {
          // Стабильные имена с хэшем — длинный cache-control и cache-bust на изменении.
          chunkFileNames: 'assets/chunks/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          manualChunks: {
            // Vendor chunks
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['framer-motion', 'lucide-react', 'sonner'],
            'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities', '@dnd-kit/modifiers'],
            'vendor-utils': ['axios', 'zustand', 'date-fns', 'clsx', 'tailwind-merge', 'zod'],
            'vendor-radix': [
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-avatar',
              '@radix-ui/react-context-menu',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-label',
              '@radix-ui/react-popover',
              '@radix-ui/react-progress',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slider',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
            ],
          },
        },
      },
    },
  }
})
