import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
    dedupe: ["react", "react-dom", "@tanstack/react-start", "@tanstack/react-router"],
  },
});
