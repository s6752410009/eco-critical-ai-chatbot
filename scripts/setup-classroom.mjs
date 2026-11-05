import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
const local = new URL(".classroom-local/", root);
await mkdir(local, { recursive: true, mode: 0o700 });
const key = process.env.GEMINI_API_KEY || "";
if (/[\r\n]/.test(key)) throw new Error("API key must be a single line");
const model = process.env.GEMINI_LLM_MODEL_PREF || "gemini-3.8-flash";
if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error("Invalid model identifier");
const token = () => randomBytes(32).toString("hex");
const runtime = [
  "SERVER_PORT=3001", "STORAGE_DIR=/app/server/storage", "DISABLE_TELEMETRY=true",
  `JWT_SECRET=${token()}`, `SIG_KEY=${token()}`, `SIG_SALT=${token()}`,
  "LLM_PROVIDER=gemini", `GEMINI_LLM_MODEL_PREF=${model}`, `GEMINI_API_KEY=${key}`,
  "EMBEDDING_ENGINE=gemini", "EMBEDDING_MODEL_PREF=gemini-embedding-001", `GEMINI_EMBEDDING_API_KEY=${key}`,
  "VECTOR_DB=lancedb", "COLLECTOR_PORT=8888",
].join("\n") + "\n";
async function create(relative, content) {
  const target = new URL(relative, root);
  try { await writeFile(target, content, { flag: "wx", mode: 0o600 }); console.log(`Created ${relative}`); }
  catch (error) { if (error.code !== "EEXIST") throw error; console.log(`Kept existing ${relative}`); }
}
await create(".classroom-local/runtime.env", runtime);
await create("server/.env.development", runtime.replace("STORAGE_DIR=/app/server/storage", `STORAGE_DIR=${fileURLToPath(new URL("server/storage", root))}`));
await create("collector/.env", "COLLECTOR_PORT=8888\n");
await create("frontend/.env", "VITE_API_BASE=/api\n");
console.log("Setup files are private and ignored by Git. Configure the Gemini key in server settings or the runtime env file. Never put it in a VITE_ variable.");
