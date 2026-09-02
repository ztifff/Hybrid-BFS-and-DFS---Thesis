import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    command === 'build' ? viteSingleFile() : null, // only inline assets during production build
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true, // fixes slow HMR in Docker on Windows (WSL2 inotify issue)
      interval: 300,
    },
    proxy: {
      '/api': {
        target: 'http://backend:3200', // Points to the backend container name in docker-compose
        changeOrigin: true,
      }
    }
  }
}));