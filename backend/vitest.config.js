import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "#utils": new URL("./src/utils", import.meta.url).pathname,
    },
  },
});
