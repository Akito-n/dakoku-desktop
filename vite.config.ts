import { defineConfig } from "vite";
import path from "node:path";
import electron from "vite-plugin-electron/simple";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: "electron/main.ts",
        vite: {
          build: {
            commonjsOptions: {
              include: [/playwright/, /node_modules/],
            },
            rollupOptions: {
              external: [
                "electron",
                "playwright",
                "playwright-core",
                "@playwright/test",
              ],
            },
          },
          define: {
            __dirname: "__dirname",
          },
          resolve: {
            alias: {
              "@": path.resolve(__dirname, "./src"),
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, "electron/preload.ts"),
      },
      renderer: process.env.NODE_ENV === "test" ? undefined : {},
    }),
  ],
  optimizeDeps: {
    exclude: ["playwright"],
  },
});
