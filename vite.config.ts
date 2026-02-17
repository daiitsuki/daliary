import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
  plugins: [
    react()
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-ui-icons';
            if (id.includes('framer-motion')) return 'vendor-animation';
            if (id.includes('react-kakao-maps-sdk') || id.includes('kakao')) return 'vendor-maps';
            if (id.includes('@supabase')) return 'vendor-supabase';
            return 'vendor'; // 기타 나머지 라이브러리
          }
        }
      }
    }
  }
})
