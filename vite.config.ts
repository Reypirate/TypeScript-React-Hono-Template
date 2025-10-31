import path from "path";
import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      tanstackRouter({
        target: "react",
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "#client": path.resolve(__dirname, "./src"),
        "#server": path.resolve(__dirname, "./server"),
        "#shared": path.resolve(__dirname, "./shared"),
      },
    },
    server: {
      port: 4000,
      open: false,
      proxy: {
        "/api": {
          target: "http://localhost:4001",
          changeOrigin: true,
        },
      },
    },
    define: {
      process: {
        env: env,
      },
    },
    build: {
      outDir: "dist/static",
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
          404: path.resolve(__dirname, "404.html"),
        },
      },
    },
  };
});
