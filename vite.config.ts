import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./src/setupTests.ts",
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/setupTests.ts",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "src/main.tsx",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
  tasks: {
    check: {
      command: "vp check --all",
      cache: false,
    },
    test: {
      dependsOn: ["test:unit", "test:e2e"],
      cache: false,
    },
    "test:unit": {
      command: "vp test --coverage --run",
      cache: false,
    },
    "test:e2e": {
      command: "playwright test",
      dependsOn: ["build"],
      cache: false,
    },
    precommit: {
      dependsOn: ["check", "test"],
      cache: false,
    },
    qa: {
      dependsOn: ["check", "test", "audit"],
      cache: false,
    },
    audit: {
      dependsOn: ["audit:pnpm", "audit:uv"],
      cache: false,
    },
    "audit:pnpm": {
      command: "pnpm audit --audit-level=high",
      cache: false,
    },
    "audit:uv": {
      command: "uv lock --check",
      cache: false,
    },
    e2e: {
      command: "playwright test",
      dependsOn: ["build"],
      cache: false,
    },
    // Build quietly for the Pages base path, then audit with the same base
    // path in the preview server.
    lighthouse: {
      command:
        "BASE_PATH=/einbuergerungstest/ vp build --logLevel warn && vp dlx --silent @lhci/cli@0.16.1 collect && vp dlx --silent @lhci/cli@0.16.1 assert",
      cache: false,
    },
    build: { command: "vp build", cache: false },
    dev: { command: "vp dev", cache: false },
    preview: { command: "vp preview", cache: false },
  },
});
