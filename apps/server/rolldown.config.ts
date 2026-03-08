import { defineConfig } from "rolldown";

export default defineConfig({
  input: "./src/index.ts",
  platform: "node",
  tsconfig: "./tsconfig.json",
  external: (id) => {
    if (id.startsWith("node:")) {
      return true;
    }

    return false;
  },
  output: {
    dir: "./dist",
    format: "esm",
    entryFileNames: "index.mjs",
  },
});
