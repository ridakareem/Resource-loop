import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Port 3000 matches CORS_ORIGIN in the backend's .env.example.
// /api is proxied to the Express server (PORT=5000) so there are no CORS issues in dev.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: { "/api": { target: "http://localhost:5000", changeOrigin: true } },
  },
});
