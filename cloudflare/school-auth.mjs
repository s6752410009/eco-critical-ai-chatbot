export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export const reply = (value, status = 200, headers = {}) =>
  Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
const enc = new TextEncoder();
export const hex = (bytes) =>
  [...new Uint8Array(bytes)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
const unhex = (value) =>
  new Uint8Array(value.match(/../g).map((n) => parseInt(n, 16)));
export const random = () => hex(crypto.getRandomValues(new Uint8Array(32)));
export const sha = async (value) =>
  hex(await crypto.subtle.digest("SHA-256", enc.encode(value)));
export function equal(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
export async function passwordHash(password, salt, secret) {
  if (!secret || secret.length < 32)
    throw new ApiError("ระบบบัญชียังไม่ได้ตั้งค่าความปลอดภัย", 503);
  const pepper = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const keyed = await crypto.subtle.sign(
    "HMAC",
    pepper,
    enc.encode("eco-password-v1:" + password)
  );
  const key = await crypto.subtle.importKey("raw", keyed, "PBKDF2", false, [
    "deriveBits",
  ]);
  // Worker native PBKDF2 work factor; server-side pepper stays outside D1.
  return hex(
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: unhex(salt),
        iterations: 100000,
      },
      key,
      256
    )
  );
}
export function clean(value, label, min, max) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new ApiError(`${label}ต้องมี ${min}–${max} ตัวอักษร`);
  return value.trim();
}
export function strongPassword(value) {
  if (typeof value !== "string" || value.length < 12 || value.length > 128)
    throw new ApiError("รหัสผ่านต้องยาว 12–128 ตัวอักษร");
  return value;
}
export function sameOrigin(request) {
  if (request.headers.get("Origin") !== new URL(request.url).origin)
    throw new ApiError("ไม่อนุญาตคำขอข้ามเว็บไซต์", 403);
}
export async function bodyJson(request, max = 16384) {
  if (!request.headers.get("Content-Type")?.includes("application/json"))
    throw new ApiError("ต้องส่งข้อมูล JSON", 415);
  if (Number(request.headers.get("Content-Length")) > max)
    throw new ApiError("ข้อมูลใหญ่เกินกำหนด", 413);
  const text = await request.text();
  if (text.length > max) throw new ApiError("ข้อมูลใหญ่เกินกำหนด", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("อ่านข้อมูลไม่สำเร็จ");
  }
}
export const safeUser = (row) => ({
  id: row.id,
  username: row.username,
  displayName: row.display_name,
  email: row.email,
  role: row.role,
  status: row.status,
  mustChange: !!row.must_change,
  createdAt: row.created_at,
  lastLogin: row.last_login,
});
const cookie = (token, max = 28800) =>
  `eco_school_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${max}`;
export async function sessionUser(
  request,
  env,
  { allowPending = false, allowChange = false } = {}
) {
  const token = (request.headers.get("Cookie") || "").match(
    /(?:^|;\s*)eco_school_session=([a-f0-9]{64})(?:;|$)/
  )?.[1];
  if (!token) throw new ApiError("กรุณาเข้าสู่ระบบ", 401);
  const row = await env.BOARD_DB.prepare(
    "SELECT u.*,s.token_hash AS session_hash FROM school_users u JOIN school_sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?"
  )
    .bind(await sha(token), Date.now())
    .first();
  if (!row) throw new ApiError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง", 401);
  if (row.status === "suspended")
    throw new ApiError("บัญชีนี้ถูกระงับ กรุณาติดต่อผู้ดูแล", 403);
  if (row.must_change && !allowChange)
    throw new ApiError("กรุณาเปลี่ยนรหัสผ่านก่อนใช้งาน", 428);
  if (row.status !== "active" && !allowPending)
    throw new ApiError("รอคุณครูอนุมัติการเข้าห้องเรียน", 403);
  return row;
}
export function requireTeacher(user) {
  if (!["admin", "teacher"].includes(user.role))
    throw new ApiError("เฉพาะคุณครูหรือผู้ดูแล", 403);
}
export function requireAdmin(user) {
  if (user.role !== "admin") throw new ApiError("เฉพาะผู้ดูแลระบบ", 403);
}
export async function audit(env, user, action, target = "") {
  await env.BOARD_DB.prepare(
    "INSERT INTO school_audit(id,actor_id,target_id,action,created_at) VALUES (?,?,?,?,?)"
  )
    .bind(crypto.randomUUID(), user.id, target, action, Date.now())
    .run();
}
export async function budget(env, key, limit, period = 60000) {
  const slot = Math.floor(Date.now() / period);
  const bucket = `school:${key}:${slot}`;
  await env.BOARD_DB.prepare(
    "INSERT INTO discussion_limits(bucket,count,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1"
  )
    .bind(bucket, Date.now() + period * 2)
    .run();
  const item = await env.BOARD_DB.prepare(
    "SELECT count FROM discussion_limits WHERE bucket=?"
  )
    .bind(bucket)
    .first();
  if (item.count > limit)
    throw new ApiError("ทำรายการถี่เกินไป กรุณารอสักครู่แล้วลองใหม่", 429);
}
async function startSession(env, user) {
  const token = random();
  await env.BOARD_DB.batch([
    env.BOARD_DB.prepare("DELETE FROM school_sessions WHERE expires_at<?").bind(
      Date.now()
    ),
    env.BOARD_DB.prepare(
      "INSERT INTO school_sessions(token_hash,user_id,expires_at) VALUES (?,?,?)"
    ).bind(await sha(token), user.id, Date.now() + 8 * 3600000),
    env.BOARD_DB.prepare(
      "UPDATE school_users SET last_login=? WHERE id=?"
    ).bind(Date.now(), user.id),
  ]);
  return cookie(token);
}
export async function authRoute(request, env, path) {
  if (path === "/me" && request.method === "GET") {
    try {
      return reply({
        user: safeUser(
          await sessionUser(request, env, {
            allowPending: true,
            allowChange: true,
          })
        ),
      });
    } catch (e) {
      if (e.status === 401) return reply({ user: null });
      throw e;
    }
  }
  if (request.method !== "POST") throw new ApiError("ไม่พบเส้นทาง", 404);
  sameOrigin(request);
  const input = await bodyJson(request);
  const network = await sha(request.headers.get("CF-Connecting-IP") || "local");
  if (path === "/register") {
    await budget(env, `register:${network}`, 120, 3600000);
    const username = clean(input.username, "ชื่อผู้ใช้", 3, 32).toLowerCase();
    if (!/^[a-z0-9._-]+$/.test(username) || username === "admin")
      throw new ApiError(
        "ชื่อผู้ใช้ใช้ a–z ตัวเลข จุด ขีด หรือขีดล่าง และห้ามใช้ชื่อ admin"
      );
    const displayName = clean(input.displayName, "ชื่อที่แสดง", 1, 80),
      password = strongPassword(input.password),
      email = (input.email || "").trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new ApiError("รูปแบบอีเมลไม่ถูกต้อง");
    if (email.length > 254) throw new ApiError("อีเมลยาวเกินกำหนด");
    const id = crypto.randomUUID(),
      salt = random();
    const hash = await passwordHash(password, salt, env.APP_SECRET);
    const result = await env.BOARD_DB.prepare(
      "INSERT INTO school_users(id,username,display_name,email,password_hash,salt,role,status,created_at) SELECT ?,?,?,?,?,?,'student','pending',? WHERE NOT EXISTS(SELECT 1 FROM school_users WHERE username=?)"
    )
      .bind(id, username, displayName, email, hash, salt, Date.now(), username)
      .run();
    if (!result.meta.changes)
      throw new ApiError("ชื่อผู้ใช้นี้ถูกใช้แล้ว", 409);
    const user = await env.BOARD_DB.prepare(
      "SELECT * FROM school_users WHERE id=?"
    )
      .bind(id)
      .first();
    return reply({ user: safeUser(user) }, 201, {
      "Set-Cookie": await startSession(env, user),
    });
  }
  if (path === "/login") {
    const username = clean(input.username, "ชื่อผู้ใช้", 1, 32).toLowerCase();
    await budget(env, `login-ip:${network}`, 120, 600000);
    await budget(env, `login-user:${await sha(username)}`, 12, 600000);
    const user = await env.BOARD_DB.prepare(
      "SELECT * FROM school_users WHERE username=?"
    )
      .bind(username)
      .first();
    const password = typeof input.password === "string" ? input.password : "";
    const hash = await passwordHash(
      password,
      user?.salt || "0".repeat(64),
      env.APP_SECRET
    );
    if (
      !user ||
      !equal(hash, user.password_hash) ||
      user.status === "suspended"
    )
      throw new ApiError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", 401);
    if (
      user.bootstrap_locked &&
      (!env.BOOTSTRAP_CODE || !equal(input.setupCode || "", env.BOOTSTRAP_CODE))
    )
      throw new ApiError(
        "บัญชีตั้งต้นต้องใช้รหัสตั้งค่าผู้ดูแลที่ส่งให้เจ้าของระบบ",
        403
      );
    return reply({ user: safeUser(user) }, 200, {
      "Set-Cookie": await startSession(env, user),
    });
  }
  if (path === "/logout") {
    try {
      const user = await sessionUser(request, env, {
        allowPending: true,
        allowChange: true,
      });
      await env.BOARD_DB.prepare(
        "DELETE FROM school_sessions WHERE token_hash=?"
      )
        .bind(user.session_hash)
        .run();
    } catch {}
    return reply({ success: true }, 200, { "Set-Cookie": cookie("", 0) });
  }
  if (path === "/password") {
    const user = await sessionUser(request, env, {
      allowPending: true,
      allowChange: true,
    });
    await budget(env, `password:${user.id}`, 6, 600000);
    const hash = await passwordHash(
      String(input.currentPassword || ""),
      user.salt,
      env.APP_SECRET
    );
    if (!equal(hash, user.password_hash))
      throw new ApiError("รหัสผ่านเดิมไม่ถูกต้อง", 403);
    const password = strongPassword(input.newPassword);
    if (input.currentPassword === password)
      throw new ApiError("กรุณาตั้งรหัสใหม่ที่ต่างจากรหัสเดิม");
    const salt = random();
    await env.BOARD_DB.batch([
      env.BOARD_DB.prepare(
        "UPDATE school_users SET password_hash=?,salt=?,must_change=0,bootstrap_locked=0 WHERE id=?"
      ).bind(await passwordHash(password, salt, env.APP_SECRET), salt, user.id),
      env.BOARD_DB.prepare("DELETE FROM school_sessions WHERE user_id=?").bind(
        user.id
      ),
    ]);
    await audit(env, user, "password_changed", user.id);
    const fresh = { ...user, must_change: 0 };
    return reply({ user: safeUser(fresh) }, 200, {
      "Set-Cookie": await startSession(env, fresh),
    });
  }
  throw new ApiError("ไม่พบเส้นทาง", 404);
}
export async function manageUsers(request, env, user, path) {
  requireTeacher(user);
  if (request.method === "GET" && path === "/users") {
    const url = new URL(request.url),
      query = (url.searchParams.get("q") || "").slice(0, 80),
      offset = Math.max(
        0,
        Math.trunc(Number(url.searchParams.get("offset")) || 0)
      );
    const { results } = await env.BOARD_DB.prepare(
      "SELECT id,username,display_name,email,role,status,must_change,created_at,last_login FROM school_users WHERE (?='admin' OR role='student') AND (display_name LIKE ? OR username LIKE ? OR email LIKE ?) ORDER BY created_at DESC LIMIT 101 OFFSET ?"
    )
      .bind(user.role, ...Array(3).fill(`%${query}%`), offset)
      .all();
    const ids = results.slice(0, 100).map((row) => row.id);
    const progress = ids.length
      ? (
          await env.BOARD_DB.prepare(
            `SELECT * FROM school_progress WHERE user_id IN (${ids.map(() => "?").join(",")})`
          )
            .bind(...ids)
            .all()
        ).results
      : [];
    return reply({
      users: results
        .slice(0, 100)
        .map((row) => ({
          ...safeUser(row),
          progress: progress
            .filter((p) => p.user_id === row.id)
            .map(({ user_id, ...p }) => p),
        })),
      hasMore: results.length > 100,
    });
  }
  if (request.method !== "POST") throw new ApiError("ไม่พบเส้นทาง", 404);
  sameOrigin(request);
  const data = await bodyJson(request);
  const match = path.match(/^\/users\/([\w-]+)(\/reset)?$/);
  if (!match) throw new ApiError("ไม่พบเส้นทาง", 404);
  const target = await env.BOARD_DB.prepare(
    "SELECT * FROM school_users WHERE id=?"
  )
    .bind(match[1])
    .first();
  if (!target) throw new ApiError("ไม่พบบัญชี", 404);
  if (match[2]) {
    requireAdmin(user);
    if (target.id === user.id)
      throw new ApiError("เปลี่ยนรหัสของคุณผ่านหน้าบัญชีของฉัน");
    const temporary = "Eco-" + random().slice(0, 20),
      salt = random();
    await env.BOARD_DB.batch([
      env.BOARD_DB.prepare(
        "UPDATE school_users SET password_hash=?,salt=?,must_change=1,bootstrap_locked=0 WHERE id=?"
      ).bind(
        await passwordHash(temporary, salt, env.APP_SECRET),
        salt,
        target.id
      ),
      env.BOARD_DB.prepare("DELETE FROM school_sessions WHERE user_id=?").bind(
        target.id
      ),
    ]);
    await audit(env, user, "password_reset", target.id);
    return reply({ temporaryPassword: temporary });
  }
  const role = data.role || target.role,
    status = data.status || target.status;
  if (
    !["admin", "teacher", "student"].includes(role) ||
    !["active", "pending", "suspended"].includes(status)
  )
    throw new ApiError("สิทธิ์หรือสถานะไม่ถูกต้อง");
  if (
    user.role !== "admin" &&
    (target.role !== "student" ||
      role !== "student" ||
      !["active", "pending"].includes(status))
  )
    throw new ApiError("ครูอนุมัตินักเรียนได้ แต่เปลี่ยนยศบัญชีไม่ได้", 403);
  if (target.id === user.id && (role !== "admin" || status !== "active"))
    throw new ApiError("ไม่สามารถลดสิทธิ์หรือระงับบัญชีที่กำลังใช้งาน");
  const result = await env.BOARD_DB.prepare(
    "UPDATE school_users SET role=?,status=? WHERE id=? AND NOT(role='admin' AND status='active' AND (?<>'admin' OR ?<>'active') AND (SELECT count(*) FROM school_users WHERE role='admin' AND status='active')<=1)"
  )
    .bind(role, status, target.id, role, status)
    .run();
  if (!result.meta.changes)
    throw new ApiError("ต้องเหลือแอดมินที่ใช้งานได้อย่างน้อยหนึ่งคน", 409);
  if (role !== target.role || status === "suspended")
    await env.BOARD_DB.prepare("DELETE FROM school_sessions WHERE user_id=?")
      .bind(target.id)
      .run();
  await audit(env, user, `account_${role}_${status}`, target.id);
  return reply({ success: true });
}
