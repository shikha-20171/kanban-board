// playwright.config.js
import { defineConfig } from "@playwright/test";

const webServer =
  globalThis.process?.env.PLAYWRIGHT_SKIP_WEBSERVER === "1"
    ? undefined
    : {
        command:
          "sh -c 'cd ../backend && PORT=5050 node server.js & cd ../frontend && VITE_SOCKET_URL=http://localhost:5050 npm run build && npm run preview -- --host 0.0.0.0'",
        port: 3000,
        reuseExistingServer: true,
        timeout: 60 * 1000,
      };

export default defineConfig({
  testDir: "./src/tests/e2e",
  timeout: 20 * 1000, // Test timeout in milliseconds
  use: {
    headless: true,
    baseURL: "http://localhost:3000",
    viewport: { width: 1300, height: 720 }, // Default viewport
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
    {
      name: "webkit",
      use: { browserName: "webkit" },
    },
  ],
  webServer,
});
