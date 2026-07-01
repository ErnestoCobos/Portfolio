import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure logic + data-integrity tests — no DOM needed. Component/e2e
    // rendering would use a separate jsdom/Playwright project later.
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
