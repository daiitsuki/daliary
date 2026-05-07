import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true, // 포트가 사용 중이면 다음으로 넘어가지 않고 즉시 에러 발생 (원인 파악 용이)
    host: true, // 'localhost' 대신 true를 사용하면 모든 로컬 주소(0.0.0.0)를 수신합니다.
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
