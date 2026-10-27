import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/advanced-combobox/demo/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": import.meta.dirname + "/src",
    },
  },
});
