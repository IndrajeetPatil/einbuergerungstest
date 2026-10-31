import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins, type Plugin } from "vite-plus";

/** Mounts the local progress API (SQLite via node:sqlite) on the dev and preview servers. */
function progressApi(): Plugin {
  return {
    name: "progress-api",
    async configureServer(server) {
      const { createApi } = await import("./server/api.ts");
      server.middlewares.use(createApi());
    },
    async configurePreviewServer(server) {
      const { createApi } = await import("./server/api.ts");
      server.middlewares.use(createApi());
    },
  };
}

export default defineConfig({
  server: { port: 5178, strictPort: true, host: "127.0.0.1" },
  preview: { port: 5179, strictPort: true, host: "127.0.0.1" },
  build: {
    target: "es2024",
    rolldownOptions: {
      output: {
        // Keep the 460-question catalogue apart from app code so each caches on its own.
        codeSplitting: {
          groups: [
            { name: "catalogue", test: /catalogue\.json/ },
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
  fmt: {
    ignorePatterns: ["src/data/catalogue.json", "data/**", ".cache/**"],
  },
  lint: {
    ignorePatterns: ["dist/**", "data/**", ".cache/**"],
    plugins: ["react", "typescript", "oxc", "unicorn", "import"],
    rules: {
      "react/rules-of-hooks": "error",
      "react/exhaustive-deps": "warn",
      "react/only-export-components": ["warn", { allowConstantExport: true }],
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  test: {
    include: ["src/**/*.test.ts", "server/**/*.test.ts"],
  },
  plugins: lazyPlugins(() => [react(), tailwindcss(), progressApi()]),
});
