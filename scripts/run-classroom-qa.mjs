import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
const preview = spawn(
  process.execPath,
  [
    fileURLToPath(new URL("frontend/node_modules/vite/bin/vite.js", root)),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "3415",
    "--strictPort",
    "--outDir",
    "dist-demo",
  ],
  {
    cwd: fileURLToPath(new URL("frontend/", root)),
    stdio: ["ignore", "pipe", "pipe"],
  }
);
let exitCode = 1;
try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch("http://127.0.0.1:3415/demo");
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("Production demo preview did not start");
  const qa = spawn(
    process.execPath,
    [fileURLToPath(new URL("scripts/classroom-browser-qa.mjs", root))],
    {
      cwd: fileURLToPath(root),
      env: { ...process.env, CLASSROOM_QA_URL: "http://127.0.0.1:3415" },
      stdio: "inherit",
    }
  );
  exitCode = await new Promise((resolve) =>
    qa.on("exit", (code) => resolve(code ?? 1))
  );
  if (exitCode === 0) {
    const capture = spawn(
      process.execPath,
      [fileURLToPath(new URL("scripts/capture-classroom-dashboard.mjs", root))],
      {
        cwd: fileURLToPath(root),
        env: { ...process.env, CLASSROOM_QA_URL: "http://127.0.0.1:3415" },
        stdio: "inherit",
      }
    );
    exitCode = await new Promise((resolve) =>
      capture.on("exit", (code) => resolve(code ?? 1))
    );
  }
} finally {
  preview.kill("SIGTERM");
}
process.exitCode = exitCode;
