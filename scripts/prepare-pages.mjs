import { writeFile } from "node:fs/promises";
import { build } from "../frontend/node_modules/esbuild/lib/main.js";
import { fileURLToPath } from "node:url";
// Advanced-mode Pages function; same audited handler and D1 schema as Workers.
const output = new URL("../frontend/dist-demo/", import.meta.url);
await build({
  entryPoints: [
    fileURLToPath(new URL("../cloudflare/worker.mjs", import.meta.url)),
  ],
  outfile: fileURLToPath(new URL("_worker.js", output)),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
});
await writeFile(
  new URL("_routes.json", output),
  JSON.stringify(
    {
      version: 1,
      include: ["/api/discussions", "/api/discussions/*", "/api/school/*"],
      exclude: [],
    },
    null,
    2
  ) + "\n"
);
console.log("Prepared Pages discussion API; static routes remain asset-only");

await writeFile(new URL(".assetsignore", output), "_worker.js\n_routes.json\n");
