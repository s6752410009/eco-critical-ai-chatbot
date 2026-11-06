// Real-account browser checks on an isolated local Worker/D1. Never writes a remote DB.
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
const liveOcr=process.env.ECO_LIVE_OCR_QA === "1";
const root = fileURLToPath(new URL("../", import.meta.url));
const wrangler = fileURLToPath(
  new URL("../frontend/node_modules/wrangler/bin/wrangler.js", import.meta.url)
);
const state = await mkdtemp(path.join(tmpdir(), "eco-school-qa-"));
const storage = path.join(state, "storage"),
  configPath = path.join(state, "wrangler.jsonc");
const config = JSON.parse(
  await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8")
);
config.name = "eco-school-local-qa";
config.main = path.join(root, "frontend/dist-demo/_worker.js");
config.assets.directory = path.join(root, "frontend/dist-demo");
config.d1_databases = [
  {
    binding: "BOARD_DB",
    database_name: "eco-school-local-qa",
    database_id: randomUUID(),
    migrations_dir: path.join(root, "cloudflare/migrations"),
  },
];
await writeFile(configPath, JSON.stringify(config, null, 2));
const secrets = {
  APP_SECRET: randomBytes(32).toString("hex"),
  BOOTSTRAP_CODE: randomBytes(16).toString("hex"),
};
if(liveOcr)secrets.OPENAI_API_KEY=await (await import("./load-openai-qa-key.mjs")).loadOpenaiQaKey();
await writeFile(
  path.join(state, "cloudflare-secrets.json"),
  JSON.stringify(secrets),
  { mode: 0o600 }
);
await writeFile(
  path.join(state, ".dev.vars"),
  Object.entries(secrets)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n") + "\n",
  { mode: 0o600 }
);
const env = {
  ...process.env,
  WRANGLER_SEND_METRICS: "false",
  ECO_QA_DIRECTORY: state,
  ECO_QA_FIXTURE: path.join(state, "qa-account.json"),
};
const artifacts = new URL("../artifacts/classroom/", import.meta.url);
await mkdir(artifacts, { recursive: true });
let preview,
  logs = "";
async function run(script, args = []) {
  if (args.includes("--remote"))
    throw new Error("Remote D1 is forbidden in the QA runner");
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
    throw new Error(`QA setup/check exited ${code}: ${path.basename(script)}`);
}
try {
  await run("scripts/prepare-school-qa.mjs");
  await run(wrangler, [
    "d1",
    "migrations",
    "apply",
    "eco-school-local-qa",
    "--local",
    "--persist-to",
    storage,
    "--config",
    configPath,
  ]);
  await run(wrangler, [
    "d1",
    "execute",
    "eco-school-local-qa",
    "--local",
    "--persist-to",
    storage,
    "--config",
    configPath,
    "--file",
    path.join(state, "qa-account.sql"),
  ]);
  preview = liveOcr ? spawn(process.execPath,[path.join(root,"scripts/serve-qa-build.mjs")],{cwd:state,env,stdio:["ignore","pipe","pipe"]}) : spawn(
    process.execPath,
    [
      wrangler,
      "dev",
      "--config",
      configPath,
      "--ip",
      "127.0.0.1",
      "--port",
      "3415",
      "--inspector-port",
      "0",
      "--persist-to",
      storage,
    ],
    { cwd: state, env, stdio: ["ignore", "pipe", "pipe"] }
  );
  for (const stream of [preview.stdout, preview.stderr])
    stream.on("data", (chunk) => {
      logs = (logs + String(chunk)).slice(-80000);
    });
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (preview.exitCode !== null)
      throw new Error("QA Worker stopped before startup");
    try {
      const response = await fetch("http://127.0.0.1:3415/api/school/auth/me");
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
  if (!ready) throw new Error("QA Worker did not start");
  const qa = spawn(process.execPath, [liveOcr ? "scripts/check-ocr-live.mjs" : "scripts/check-school-app.mjs"], {
    cwd: root,
    env: { ...env, CLASSROOM_QA_URL: "http://127.0.0.1:3415" },
    stdio: "inherit",
  });
  const code = await new Promise((resolve, reject) => {
    qa.on("error", reject);
    qa.on("exit", (code) => resolve(code));
  });
  if (code !== 0) throw new Error("Authenticated classroom browser QA failed");
  console.log(
    liveOcr ? "PASS isolated live GPT OCR/chat QA; no production content or accounts changed" : "PASS isolated production build: accounts, roles, persisted state, screenshots and 13 viewports; no remote D1 or live model request"
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  preview?.kill("SIGTERM");
  await writeFile(new URL("local-worker-qa.log", artifacts), logs);
  if(liveOcr){await rm(path.join(state,".dev.vars"),{force:true});await rm(path.join(state,"cloudflare-secrets.json"),{force:true});}
}
