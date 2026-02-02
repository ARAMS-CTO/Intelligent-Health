import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        'Cross-Origin-Opener-Policy': 'unsafe-none',
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        }
      }
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },
    build: {
      // Performance optimizations
      target: 'esnext',
      minify: 'esbuild',
      cssMinify: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1000,

      rollupOptions: {
        output: {
          // Improved chunk splitting for better caching
          manualChunks: (id) => {
            // Core vendor libraries
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
              if (id.includes('i18next')) {
                return 'vendor-i18n';
              }
              if (id.includes('chart.js') || id.includes('chartjs')) {
                return 'vendor-charts';
              }
              if (id.includes('@stripe') || id.includes('@paypal')) {
                return 'vendor-payments';
              }
              if (id.includes('@concordium')) {
                return 'vendor-concordium';
              }
              if (id.includes('axios') || id.includes('google')) {
                return 'vendor-http';
              }
              // All other node_modules go to a common vendor chunk
              return 'vendor-common';
            }

            // Split by feature/page for better code splitting
            if (id.includes('/pages/admin/')) {
              return 'pages-admin';
            }
            if (id.includes('/pages/patient/')) {
              return 'pages-patient';
            }
            if (id.includes('/components/case/')) {
              return 'components-case';
            }
            if (id.includes('/components/pharmacy/')) {
              return 'components-pharmacy';
            }
            if (id.includes('/services/')) {
              return 'services';
            }
          },
          // Asset file naming for cache optimization
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        }
      }
    },
    // Optimize dependencies pre-bundling
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'i18next',
        'react-i18next',
        'chart.js',
        'react-chartjs-2',
      ],
      exclude: [
        '@concordium/browser-wallet-api-helpers'
      ]
    }
  };
});
