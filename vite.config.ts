import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cortiAgentServer } from "./server/cortiAgentServer";

export default defineConfig(() => ({
  plugins: [react(), cortiAgentServer()],
}));
