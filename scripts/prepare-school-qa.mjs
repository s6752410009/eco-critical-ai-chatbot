import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { random, passwordHash } from "../cloudflare/school-auth.mjs";
const root = process.env.ECO_QA_DIRECTORY
  ? pathToFileURL(path.resolve(process.env.ECO_QA_DIRECTORY) + path.sep)
  : new URL("../.classroom-local/", import.meta.url);
const secrets = JSON.parse(
  await readFile(new URL("cloudflare-secrets.json", root), "utf8")
);
const account = {
  id: crypto.randomUUID(),
  username: "qa_admin_" + Date.now().toString(36),
  password: "QA-" + random().slice(0, 24),
  studentUsername: "qa_student_" + Date.now().toString(36),
  studentPassword: "QA-" + random().slice(0, 24),
};
const salt = random(),
  hash = await passwordHash(account.password, salt, secrets.APP_SECRET);
await writeFile(new URL("qa-account.json", root), JSON.stringify(account), {
  mode: 0o600,
});
await writeFile(
  new URL("qa-account.sql", root),
  `INSERT INTO school_users(id,username,display_name,password_hash,salt,role,status,created_at) VALUES ('${account.id}','${account.username}','บัญชีทดสอบระบบ','${hash}','${salt}','admin','active',${Date.now()});\n`,
  { mode: 0o600 }
);
console.log("Prepared isolated local QA account; credentials not printed.");
