import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Framework-only modules → test stubs so server modules import in Node.
      "server-only": fileURLToPath(new URL("./src/test/stubs.ts", import.meta.url)),
      "next/headers": fileURLToPath(new URL("./src/test/stubs.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
