import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    // 1. 캐시 설정 삭제: 개발 서버에서는 브라우저 캐시가 필요 없습니다.
    // 2. 웹소켓(HMR) 연결 설정: 주소를 localhost로 고정해서 연결 오류를 방지합니다.
    host: "localhost",
    hmr: {
      host: "localhost",
    },
  },
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("lucide-react")) return "vendor-ui-icons";
            if (id.includes("framer-motion")) return "vendor-animation";
            if (id.includes("react-kakao-maps-sdk") || id.includes("kakao"))
              return "vendor-maps";
            if (id.includes("@supabase")) return "vendor-supabase";
            return "vendor";
          }
        },
      },
    },
  },
});
