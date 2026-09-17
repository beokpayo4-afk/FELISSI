import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const frontendRoot = import.meta.dirname;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, frontendRoot, "VITE_");
  if (!env.VITE_API_BASE_URL) {
    throw new Error(
      "Missing required environment variable: VITE_API_BASE_URL. " +
        `Set it in .env.${mode}, .env, or the host environment (Vercel).`,
    );
  }

  return {
    envDir: frontendRoot,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(frontendRoot, "src"),
      },
    },
    server: {
      host: "127.0.0.1",
      port: 5173,
      proxy: {
        "/api": {
          // 8000 is often taken by another local uvicorn; FELISSI runs on 8011 when that happens.
          target: process.env.VITE_PROXY_TARGET || "http://127.0.0.1:8011",
          changeOrigin: true,
        },
        "/uploads": {
          target: process.env.VITE_PROXY_TARGET || "http://127.0.0.1:8011",
          changeOrigin: true,
        },
      },
    },
  };
});
