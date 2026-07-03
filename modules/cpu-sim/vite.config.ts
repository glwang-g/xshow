import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

// Tauri v2 recommended dev-server config. Host locked to 127.0.0.1 so the
// embedded WebView can reach it without touching macOS local-network prompts.
export default defineConfig({
  plugins: [vue()],
  clearScreen: false,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
    watch: {
      // Rust sources live next door; ignoring them keeps Vite from restarting
      // when Cargo touches build artefacts.
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "esnext",
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
