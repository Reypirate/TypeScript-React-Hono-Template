import { fileURLToPath } from "node:url";

// Resolve static paths consistently when starting from a workspace package.
process.chdir(fileURLToPath(new URL("../", import.meta.url)));
process.env.NODE_ENV = "production";

export default (await import("../apps/api/dist/index.js")).default;
