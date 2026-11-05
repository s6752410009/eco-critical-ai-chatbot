import { mkdir, readFile, writeFile } from "node:fs/promises";
import { random, passwordHash } from "../cloudflare/school-auth.mjs";
const root = new URL("../.classroom-local/", import.meta.url);
await mkdir(root, { recursive: true, mode: 0o700 });
const secretsFile = new URL("cloudflare-secrets.json", root);
let secrets;
try {
  secrets = JSON.parse(await readFile(secretsFile, "utf8"));
} catch {
  secrets = { APP_SECRET: random(), BOOTSTRAP_CODE: random().slice(0, 24) };
  await writeFile(secretsFile, JSON.stringify(secrets, null, 2), {
    mode: 0o600,
  });
}
const salt = random(),
  hash = await passwordHash(
    process.env.ECO_BOOTSTRAP_PASSWORD || "admin1234",
    salt,
    secrets.APP_SECRET
  );
const sql = `INSERT OR IGNORE INTO school_users(id,username,display_name,email,password_hash,salt,role,status,must_change,bootstrap_locked,created_at) VALUES ('eco-owner','admin','ผู้ดูแลระบบ','', '${hash}','${salt}','admin','active',1,1,${Date.now()});\n`;
await writeFile(new URL("bootstrap.sql", root), sql, { mode: 0o600 });
await writeFile(
  new URL("../.dev.vars", root),
  Object.entries(secrets)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n") + "\n",
  { mode: 0o600 }
);
await writeFile(
  new URL("admin-setup.txt", root),
  `Eco-Critical owner setup\nURL: https://eco-critical.pages.dev/login\nUsername: admin\nInitial password: ${process.env.ECO_BOOTSTRAP_PASSWORD || "admin1234"}\nOne-time setup code: ${secrets.BOOTSTRAP_CODE}\nChange the initial password immediately when prompted. Keep this file private.\n`,
  { mode: 0o600 }
);
console.log(
  "Prepared private bootstrap files in .classroom-local; no existing admin password is reset. No secret values printed."
);
