import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import glsl from 'vite-plugin-glsl';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@src": resolve(__dirname, "./src"),
    },
  },
  plugins: [glsl(), react()],
});
