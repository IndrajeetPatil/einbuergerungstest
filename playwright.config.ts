import os from "node:os";
import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the production build and the real server, on
// a throwaway database so personal progress is never touched.
const PORT = 5199;
const isCI = Boolean(process.env["CI"]);
const database = path.join(os.tmpdir(), `lid-e2e-${process.pid}.sqlite`);

export default defineConfig({
  testDir: "tests/e2e",
  // One shared database: tests run in order and reset what they need.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `node server/serve.ts --port ${PORT}`,
    env: { LID_DB: database },
    url: `http://127.0.0.1:${PORT}/api/summary`,
    reuseExistingServer: false,
  },
});
