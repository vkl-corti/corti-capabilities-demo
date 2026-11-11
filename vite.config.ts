import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cortiAgentServer } from "./server/cortiAgentServer";

// GitHub Pages serves the site under /<repo>/ and has no backend:
// VITE_BASE sets the path prefix, VITE_STATIC=1 skips the /api calls (mock mode).
export default defineConfig(() => ({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), cortiAgentServer()],
}));
