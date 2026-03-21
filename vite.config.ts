import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  ...(mode === "lib"
    ? {
        publicDir: false,
        build: {
          lib: {
            entry: resolve(__dirname, "src/components/MindMap/index.ts"),
            name: "OpenMindMap",
            cssFileName: "style",
          },
          cssCodeSplit: false,
          emptyOutDir: false,
          rollupOptions: {
            external: ["react", "react-dom", "react/jsx-runtime", "katex"],
            output: [
              // ESM with preserved modules for tree-shaking
              {
                format: "es" as const,
                preserveModules: true,
                preserveModulesRoot: "src/components/MindMap",
                dir: "dist/esm",
                entryFileNames: "[name].js",
              },
              // UMD single bundle
              {
                format: "umd" as const,
                name: "OpenMindMap",
                dir: "dist",
                entryFileNames: "mindmap.umd.cjs",
                globals: {
                  react: "React",
                  "react-dom": "ReactDOM",
                  "react/jsx-runtime": "ReactJSXRuntime",
                  katex: "katex",
                },
              },
            ],
          },
        },
      }
    : {}),
}));
