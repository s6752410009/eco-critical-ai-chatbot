import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "../../frontend/node_modules/esbuild/lib/main.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const result = await build({ entryPoints: [path.join(root, "frontend/src/pages/Classroom/api.js")], bundle: true, write: false, format: "esm", platform: "node", alias: { "@": path.join(root, "frontend/src") }, define: { "import.meta.env": '{"VITE_API_BASE":"/api"}' } });
const api = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
globalThis.window = { localStorage: { getItem: () => null } };
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const file = new File(["teacher content"], "water.txt", { type: "text/plain" });
test("failed classroom fetch is not represented as an empty successful list", async () => {
  globalThis.fetch = async () => response({}, 503);
  await assert.rejects(api.classroomRequest("/workspaces"), /เชื่อมต่อระบบ/);
});
test("auth failures prompt login instead of exposing a blank page", async () => {
  globalThis.fetch = async () => response({}, 401);
  await assert.rejects(api.classroomRequest("/workspaces"), /เข้าสู่ระบบ/);
});
test("processing failure never starts embeddings", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return response({ success: false, error: "Collector offline" }, 500); };
  await assert.rejects(api.uploadLesson("course", file, () => {}), /Collector offline/); assert.equal(calls, 1);
});
test("embedding failure is surfaced, never reported ready", async () => {
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1 ? response({ success: true, documents: [{ location: "lesson.json" }] }) : response({ workspace: { documents: [] }, message: "Embedding quota exceeded" });
  await assert.rejects(api.uploadLesson("course", file, () => {}), /quota/);
});
test("pending embedding is not mislabeled ready", async () => {
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1 ? response({ success: true, documents: [{ location: "lesson.json" }] }) : response({ workspace: { documents: [] }, message: null });
  assert.equal((await api.uploadLesson("course", file, () => {})).ready, false);
});
test("upload chains actual returned locations into embedding request", async () => {
  const requests = []; const stages = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return requests.length === 1 ? response({ success: true, documents: [{ location: "custom-documents/water.json" }] }) : response({ workspace: { documents: [{ docpath: "custom-documents/water.json" }] }, message: null });
  };
  assert.equal((await api.uploadLesson("course", file, (stage) => stages.push(stage))).ready, true);
  assert.deepEqual(JSON.parse(requests[1].options.body), { adds: ["custom-documents/water.json"] });
  assert.equal(stages.length, 2);
  assert.equal(requests[0].options.headers["Content-Type"], undefined);
});
