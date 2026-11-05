import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
const require = createRequire(import.meta.url);
const policy = require("../../server/utils/classroomPolicy.js");

function loadCommonJS(path, mocks) {
  const module = { exports: {} };
  vm.runInNewContext(readFileSync(new URL(path, import.meta.url), "utf8"), {
    module, exports: module.exports,
    require: (name) => { if (!(name in mocks)) throw new Error(`Unmocked dependency ${name}`); return mocks[name]; },
    console, process,
  });
  return module.exports;
}
function workspaceModel() {
  const writes = [];
  const { Workspace } = loadCommonJS("../../server/models/workspace.js", {
    "../utils/classroomPolicy": policy,
    "../utils/prisma": { workspaces: { findFirst: async () => null, create: async ({ data }) => { writes.push(data); return { id: 1, ...data }; } } },
    slugify: Object.assign((name) => name.toLowerCase().replace(/\s+/g, "-"), { extend() {} }),
    "./documents": { Document: {} }, "./workspaceUsers": { WorkspaceUser: { create: async () => {} } },
    "../utils/middleware/multiUserProtected": { ROLES: { admin: "admin", manager: "manager" } },
    uuid: { v4: () => "course-uuid" }, "./user": { User: {} }, "./promptHistory": { PromptHistory: {} },
    "./systemSettings": { SystemSettings: { saneDefaultSystemPrompt: "generic", get: async () => null } },
  });
  return { Workspace, writes };
}
test("new classrooms persist query mode, source-grounded Thai prompt and refusal on server", async () => {
  const { Workspace, writes } = workspaceModel();
  const { workspace } = await Workspace.new("  Pollution M5  ", 1);
  assert.equal(workspace.name, "Pollution M5");
  assert.equal(writes[0].chatMode, "query");
  assert.equal(writes[0].queryRefusalResponse, policy.CLASSROOM_REFUSAL);
  assert.match(writes[0].openAiPrompt, /มัธยมศึกษาตอนปลาย/);
  assert.match(writes[0].openAiPrompt, /ห้ามแต่ง/);
});
test("invalid class names never reach database", async () => {
  const { Workspace, writes } = workspaceModel();
  for (const name of [null, "", "   ", 7, "a".repeat(256)]) assert.equal((await Workspace.new(name)).workspace, null);
  assert.equal(writes.length, 0);
});
test("explicit API mode changes remain possible for authorized administrators", async () => {
  const { Workspace } = workspaceModel();
  assert.equal((await Workspace.new("Course", null, { chatMode: "chat" })).workspace.chatMode, "chat");
});
test("student cannot invoke teacher mutation middleware even with forged request fields", async () => {
  const { flexUserRoleValid } = loadCommonJS("../../server/utils/middleware/multiUserProtected.js", {
    "../../models/systemSettings": { SystemSettings: { isMultiUserMode: async () => true } },
    "../http": { userFromSession: async () => ({ role: "default" }) },
  });
  let status; let allowed = false;
  const response = { locals: { multiUserMode: true, user: { role: "default" } }, sendStatus: (code) => { status = code; return { end() {} }; } };
  await flexUserRoleValid(["admin", "manager"])({ body: { role: "admin" } }, response, () => { allowed = true; });
  assert.equal(status, 401); assert.equal(allowed, false);
  response.locals.user.role = "manager";
  await flexUserRoleValid(["admin", "manager"])({}, response, () => { allowed = true; });
  assert.equal(allowed, true);
});
test("lesson allowlist rejects executables and deceptive suffixes", () => {
  for (const name of ["lesson.PDF", "มลพิษ.docx", "air.txt", "notes.md"]) assert.equal(policy.lessonFileAllowed(name), true);
  for (const name of ["lesson.pdf.exe", "page.html", "file.svg", "file", null]) assert.equal(policy.lessonFileAllowed(name), false);
});
test("upload response only exposes processed document locations needed for embedding", () => {
  assert.deepEqual(policy.uploadedLessonLocations([{ location: "custom-documents/water.json", title: "Water", apiKey: "must-not-leak" }, { title: "no location" }]), [{ location: "custom-documents/water.json", title: "Water" }]);
});
