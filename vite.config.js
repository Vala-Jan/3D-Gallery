import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    host: true,
    port: 5000,
  },
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
});
