import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // lets you open the dev server from a phone on the same Wi-Fi
    port: 5173,
    // In development, /api calls are forwarded to the Express server.
    proxy: { "/api": "http://localhost:5000" },
  },
});
