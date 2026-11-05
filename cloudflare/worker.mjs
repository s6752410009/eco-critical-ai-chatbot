import {
  authRoute,
  manageUsers,
  sessionUser,
  ApiError,
  reply as schoolReply,
} from "./school-auth.mjs";
import { storeRoute } from "./school-store.mjs";
const BASE = "/api/discussions";
const CASE_IDS = new Set([
  "",
  "donora-1948",
  "london-1952",
  "beijing-2013",
  "canada-2023",
  "los-angeles-2025",
  "thailand-2026",
]);
class BoardError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
async function digest(value) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
    ),
  ]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
export function field(value, label, min, max) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new BoardError(`${label}ต้องมี ${min}–${max} ตัวอักษร`);
  return value.trim();
}
async function input(request) {
  if (!request.headers.get("Content-Type")?.includes("application/json"))
    throw new BoardError("ต้องส่งข้อมูล JSON", 415);
  if (Number(request.headers.get("Content-Length")) > 16384)
    throw new BoardError("ข้อความยาวเกินกำหนด", 413);
  const raw = await request.text();
  if (raw.length > 10000) throw new BoardError("ข้อความยาวเกินกำหนด", 413);
  try {
    return JSON.parse(raw);
  } catch {
    throw new BoardError("อ่านข้อมูลไม่สำเร็จ");
  }
}
export async function handleBoard(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.slice(BASE.length).replace(/\/$/, "");
  if (!env.BOARD_DB)
    return json({ error: "บอร์ดสนทนายังไม่ได้เชื่อมฐานข้อมูล" }, 503);
  try {
    const token = request.headers.get("X-Board-Token") || "";
    const author = env.BOARD_USER
      ? `user:${env.BOARD_USER.id}`
      : /^[a-zA-Z0-9-]{36,100}$/.test(token)
        ? await digest(token)
        : "";
    const threadMatch = path.match(/^\/([\w-]{1,80})$/);
    const replyMatch = path.match(
      /^\/([\w-]{1,80})\/replies(?:\/([\w-]{1,80}))?$/
    );
    if (request.method === "GET") {
      if (!path) {
        const offset = Math.trunc(
          Math.max(
            0,
            Math.min(10000, Number(url.searchParams.get("offset")) || 0)
          )
        );
        const { results } = await env.BOARD_DB.prepare(
          "SELECT d.id,d.title,d.body,d.alias,d.case_id,d.created_at,d.author_hash,(SELECT count(*) FROM discussion_replies r WHERE r.thread_id=d.id) AS reply_count FROM discussions d ORDER BY d.created_at DESC,d.id DESC LIMIT 41 OFFSET ?"
        )
          .bind(offset)
          .all();
        return json({
          threads: results.slice(0, 40).map(({ author_hash, ...row }) => ({
            ...row,
            mine: author_hash === author,
          })),
          hasMore: results.length > 40,
        });
      }
      if (threadMatch) {
        const row = await env.BOARD_DB.prepare(
          "SELECT * FROM discussions WHERE id=?"
        )
          .bind(threadMatch[1])
          .first();
        if (!row) throw new BoardError("ไม่พบกระทู้นี้ อาจถูกลบแล้ว", 404);
        const { author_hash, ...thread } = row;
        const { results } = await env.BOARD_DB.prepare(
          "SELECT id,body,alias,created_at,author_hash FROM discussion_replies WHERE thread_id=? ORDER BY created_at,id LIMIT 101"
        )
          .bind(row.id)
          .all();
        return json({
          thread: { ...thread, mine: author_hash === author },
          replies: results.slice(0, 100).map(({ author_hash, ...reply }) => ({
            ...reply,
            mine: author_hash === author,
          })),
          replyLimitReached: results.length >= 100,
        });
      }
      throw new BoardError("ไม่พบเส้นทาง", 404);
    }
    if (!["POST", "DELETE"].includes(request.method))
      return json({ error: "ไม่รองรับคำขอนี้" }, 405);
    if (request.headers.get("Origin") !== url.origin)
      throw new BoardError("ไม่อนุญาตคำขอข้ามเว็บไซต์", 403);
    if (!author)
      throw new BoardError("กรุณารีเฟรชหน้าเพื่อสร้างรหัสผู้เขียน", 401);
    if (request.method === "DELETE") {
      let result;
      if (threadMatch)
        result = await env.BOARD_DB.prepare(
          "DELETE FROM discussions WHERE id=? AND (author_hash=? OR ?=1)"
        )
          .bind(
            threadMatch[1],
            author,
            ["admin", "teacher"].includes(env.BOARD_USER?.role) ? 1 : 0
          )
          .run();
      else if (replyMatch?.[2])
        result = await env.BOARD_DB.prepare(
          "DELETE FROM discussion_replies WHERE id=? AND thread_id=? AND (author_hash=? OR ?=1)"
        )
          .bind(
            replyMatch[2],
            replyMatch[1],
            author,
            ["admin", "teacher"].includes(env.BOARD_USER?.role) ? 1 : 0
          )
          .run();
      else throw new BoardError("ไม่พบเส้นทาง", 404);
      if (!result.meta.changes)
        throw new BoardError("ลบได้เฉพาะข้อความที่สร้างจากเบราว์เซอร์นี้", 403);
      return json({ success: true });
    }
    if (path && (!replyMatch || replyMatch[2]))
      throw new BoardError("ไม่พบเส้นทาง", 404);
    const value = await input(request);
    const alias = field(
        env.BOARD_USER?.display_name?.slice(0, 40) || value.alias,
        "ชื่อที่แสดง",
        1,
        40
      ),
      body = field(value.body, "ข้อความ", 1, 3000);
    const title = path ? "" : field(value.title, "หัวข้อ", 3, 160);
    const caseId = value.caseId || "";
    if (!CASE_IDS.has(caseId)) throw new BoardError("ไม่พบกรณีศึกษาที่เลือก");
    if (path) {
      const thread = await env.BOARD_DB.prepare(
        "SELECT id,(SELECT count(*) FROM discussion_replies WHERE thread_id=discussions.id) AS replies FROM discussions WHERE id=?"
      )
        .bind(replyMatch[1])
        .first();
      if (!thread) throw new BoardError("ไม่พบกระทู้นี้ อาจถูกลบแล้ว", 404);
      if (thread.replies >= 100)
        throw new BoardError(
          "กระทู้นี้มีคำตอบครบ 100 ข้อความแล้ว กรุณาเปิดกระทู้ต่อเนื่อง",
          409
        );
    }
    const now = Date.now(),
      slot = Math.floor(now / 60000);
    const ip = await digest(
      `${request.headers.get("CF-Connecting-IP") || "local"}:${Math.floor(now / 86400000)}`
    );
    const buckets = [`author:${author}:${slot}`, `network:${ip}:${slot}`];
    const id = crypto.randomUUID();
    // The budget increment and conditional insert are one atomic D1 batch.
    const limits = buckets.map((bucket) =>
      env.BOARD_DB.prepare(
        "INSERT INTO discussion_limits(bucket,count,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1"
      ).bind(bucket, now + 120000)
    );
    const budget =
      "(SELECT count FROM discussion_limits WHERE bucket=?)<=6 AND (SELECT count FROM discussion_limits WHERE bucket=?)<=60";
    const insert = path
      ? env.BOARD_DB.prepare(
          `INSERT INTO discussion_replies(id,thread_id,body,alias,author_hash,created_at) SELECT ?,?,?,?,?,? WHERE ${budget}`
        ).bind(id, replyMatch[1], body, alias, author, now, ...buckets)
      : env.BOARD_DB.prepare(
          `INSERT INTO discussions(id,title,body,alias,case_id,author_hash,created_at) SELECT ?,?,?,?,?,?,? WHERE ${budget}`
        ).bind(id, title, body, alias, caseId, author, now, ...buckets);
    const results = await env.BOARD_DB.batch([
      ...limits,
      insert,
      env.BOARD_DB.prepare(
        "DELETE FROM discussion_limits WHERE expires_at < ?"
      ).bind(now),
    ]);
    if (!results[2].meta.changes)
      return json({ error: "ส่งข้อความถี่เกินไป กรุณารอประมาณหนึ่งนาที" }, 429);
    return json({ id }, 201);
  } catch (error) {
    if (error instanceof BoardError)
      return json({ error: error.message }, error.status);
    console.error("Discussion API failed", error?.name);
    return json({ error: "บันทึกบอร์ดไม่สำเร็จ กรุณาลองอีกครั้ง" }, 500);
  }
}
export async function applicationFetch(request, env) {
  const path = new URL(request.url).pathname;
  try {
    if (path.startsWith("/api/school/auth/"))
      return await authRoute(
        request,
        env,
        path.slice("/api/school/auth".length)
      );
    if (path.startsWith("/api/school/")) {
      const user = await sessionUser(request, env);
      const sub = path.slice("/api/school".length);
      if (sub.startsWith("/users"))
        return await manageUsers(request, env, user, sub);
      return await storeRoute(request, env, user, sub);
    }
    if (path === BASE || path.startsWith(BASE + "/")) {
      const user = await sessionUser(request, env);
      return await handleBoard(request, { ...env, BOARD_USER: user });
    }
    return env.ASSETS.fetch(request);
  } catch (error) {
    if (error instanceof ApiError)
      return schoolReply({ error: error.message }, error.status);
    console.error("School request failed", error?.name);
    return schoolReply({ error: "ระบบทำรายการไม่สำเร็จ กรุณาลองใหม่" }, 500);
  }
}
export default { fetch: applicationFetch };
