import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: "react-app",
  publicDir: path.resolve(__dirname, "react-app/public"),
  plugins: [react()],
  server: { port: 4173 },
  base: "./"
});
