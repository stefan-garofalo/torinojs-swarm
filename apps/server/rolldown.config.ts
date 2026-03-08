import path from "node:path";
import { defineConfig } from "rolldown";

const workspacePackagePrefix = "@torinojs-swarm/";

export default defineConfig({
  input: "./src/index.ts",
  platform: "node",
  tsconfig: "./tsconfig.json",
  external: (id) => {
    if (id.startsWith("node:")) {
      return true;
    }

    if (id.startsWith(".") || path.isAbsolute(id)) {
      return false;
    }

    return !id.startsWith(workspacePackagePrefix);
  },
  output: {
    dir: "./dist",
    format: "esm",
    entryFileNames: "index.mjs",
  },
});
