import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const wrangler = path.join(
  root,
  "frontend/node_modules/wrangler/bin/wrangler.js"
);
const storage = path.join(root, ".classroom-local/worker-state");
const env = { ...process.env, WRANGLER_SEND_METRICS: "false" };
const children = [];
async function run(script, args = []) {
  if (args.includes("--remote"))
    throw new Error("The local dev launcher never writes remote D1");
  const child = spawn(process.execPath, [script, ...args], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => resolve(code));
  });
  if (code !== 0)
    throw new Error(`Local setup failed: ${path.basename(script)}`);
}
function stop() {
  for (const child of children) child.kill("SIGTERM");
}
process.on("SIGINT", () => {
  stop();
  process.exit(130);
});
process.on("SIGTERM", () => {
  stop();
  process.exit(143);
});
try {
  await run("scripts/provision-school.mjs");
  await run(wrangler, [
    "d1",
    "migrations",
    "apply",
    "eco-critical-discussions",
    "--local",
    "--persist-to",
    storage,
    "--config",
    "wrangler.jsonc",
  ]);
  await run(wrangler, [
    "d1",
    "execute",
    "eco-critical-discussions",
    "--local",
    "--persist-to",
    storage,
    "--config",
    "wrangler.jsonc",
    "--file",
    ".classroom-local/bootstrap.sql",
  ]);
  await run("scripts/build-mentingo-styles.mjs");
  const worker = spawn(
    process.execPath,
    [
      wrangler,
      "dev",
      "--config",
      "wrangler.jsonc",
      "--ip",
      "127.0.0.1",
      "--port",
      "3416",
      "--inspector-port",
      "0",
      "--persist-to",
      storage,
    ],
    { cwd: root, env, stdio: "inherit" }
  );
  children.push(worker);
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (worker.exitCode !== null) throw new Error("Local API stopped");
    try {
      const response = await fetch("http://127.0.0.1:3416/api/school/auth/me");
      if (
        response.ok &&
        response.headers.get("Content-Type")?.includes("application/json")
      ) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("Local API did not start");
  const vite = spawn(
    process.execPath,
    [
      path.join(root, "frontend/node_modules/vite/bin/vite.js"),
      "--host",
      "127.0.0.1",
      "--port",
      "3410",
      "--strictPort",
    ],
    { cwd: path.join(root, "frontend"), env, stdio: "inherit" }
  );
  children.push(vite);
  console.log(
    "Local school: http://127.0.0.1:3410 — owner setup instructions: .classroom-local/admin-setup.txt (private)"
  );
  const code = await Promise.race(
    children.map(
      (child) =>
        new Promise((resolve) => child.on("exit", (code) => resolve(code ?? 1)))
    )
  );
  stop();
  process.exitCode = code;
} catch (error) {
  console.error(error.message);
  stop();
  process.exitCode = 1;
}
