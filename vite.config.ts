import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  ...(mode === "lib"
    ? {
        build: {
          lib: {
            entry: resolve(__dirname, "src/components/MindMap/index.ts"),
            name: "OpenMindMap",
            fileName: "mindmap",
          },
          rollupOptions: {
            external: ["react", "react-dom", "react/jsx-runtime"],
            output: {
              globals: {
                react: "React",
                "react-dom": "ReactDOM",
                "react/jsx-runtime": "ReactJSXRuntime",
              },
            },
          },
        },
      }
    : {}),
}));
