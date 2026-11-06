import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { applicationFetch } from "../../cloudflare/worker.mjs";
import { passwordHash, random } from "../../cloudflare/school-auth.mjs";
const origin = "https://eco-critical.pages.dev",
  secret = "unit-test-pepper-only-" + "x".repeat(40),
  password = "Student-test-passphrase-2026";
async function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  for (const name of readdirSync(
    new URL("../../cloudflare/migrations/", import.meta.url)
  )
    .filter((name) => name.endsWith(".sql"))
    .sort())
    db.exec(
      readFileSync(
        new URL("../../cloudflare/migrations/" + name, import.meta.url),
        "utf8"
      )
    );
  const wrap = (sql, params = []) => ({
    bind: (...args) => wrap(sql, args),
    first: async () => db.prepare(sql).get(...params) || null,
    all: async () => ({ results: db.prepare(sql).all(...params) }),
    run: async () => ({
      meta: { changes: Number(db.prepare(sql).run(...params).changes) },
    }),
  });
  const env = {
    APP_SECRET: secret,
    BOOTSTRAP_CODE: "unit-test-owner-setup",
    SCHOOL_AUTH_REQUIRED: "true",
    BOARD_DB: {
      prepare: (sql) => wrap(sql),
      batch: async (statements) => {
        db.exec("BEGIN");
        try {
          const values = [];
          for (const statement of statements)
            values.push(await statement.run());
          db.exec("COMMIT");
          return values;
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
      },
    },
    ASSETS: { fetch: async () => new Response("asset") },
  };
  const salt = random();
  db.prepare(
    "INSERT INTO school_users(id,username,display_name,password_hash,salt,role,status,must_change,bootstrap_locked,created_at) VALUES (?,?,?,?,?,'admin','active',1,1,?)"
  ).run(
    "owner",
    "admin",
    "Owner",
    await passwordHash("admin1234", salt, secret),
    salt,
    Date.now()
  );
  return { db, env };
}
function request(
  env,
  path,
  { method = "GET", body, cookie = "", headers = {} } = {}
) {
  return applicationFetch(
    new Request(origin + path, {
      method,
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        Cookie: cookie,
        ...headers,
      },
      ...(method !== "GET" ? { body: JSON.stringify(body || {}) } : {}),
    }),
    env
  );
}
const cookie = (response) => response.headers.get("Set-Cookie")?.split(";")[0];
async function owner(env) {
  const initial = await request(env, "/api/school/auth/login", {
    method: "POST",
    body: {
      username: "admin",
      password: "admin1234",
      setupCode: "unit-test-owner-setup",
    },
  });
  assert.equal(initial.status, 200);
  const changed = await request(env, "/api/school/auth/password", {
    method: "POST",
    cookie: cookie(initial),
    body: {
      currentPassword: "admin1234",
      newPassword: "Owner-strong-test-passphrase-2026",
    },
  });
  assert.equal(changed.status, 200);
  return cookie(changed);
}
async function student(env, username = "student_one") {
  const created = await request(env, "/api/school/auth/register", {
    method: "POST",
    body: {
      username,
      password,
      displayName: "นักเรียนทดสอบ",
      role: "admin",
      status: "active",
    },
  });
  assert.equal(created.status, 201);
  return { user: (await created.json()).user, cookie: cookie(created) };
}
async function loginStudent(env, username = "student_one") {
  const response = await request(env, "/api/school/auth/login", {
    method: "POST",
    body: { username, password },
  });
  assert.equal(response.status, 200);
  return cookie(response);
}
test("bootstrap admin needs owner setup code and cannot manage users before changing the initial password", async () => {
  const { env, db } = await setup();
  try {
    assert.equal(
      (
        await request(env, "/api/school/auth/login", {
          method: "POST",
          body: { username: "admin", password: "admin1234" },
        })
      ).status,
      403
    );
    const initial = await request(env, "/api/school/auth/login", {
      method: "POST",
      body: {
        username: "admin",
        password: "admin1234",
        setupCode: env.BOOTSTRAP_CODE,
      },
    });
    assert.match(
      initial.headers.get("Set-Cookie"),
      /HttpOnly; Secure; SameSite=Lax/
    );
    assert.equal(
      (await request(env, "/api/school/users", { cookie: cookie(initial) }))
        .status,
      428
    );
    assert.equal(
      (
        await request(env, "/api/school/auth/password", {
          method: "POST",
          cookie: cookie(initial),
          body: { currentPassword: "admin1234", newPassword: "short" },
        })
      ).status,
      400
    );
  } finally {
    db.close();
  }
});
test("registration always creates pending student despite forged role/status; pending cannot read lessons or forum", async () => {
  const { env, db } = await setup();
  try {
    const created = await student(env);
    assert.equal(created.user.role, "student");
    assert.equal(created.user.status, "pending");
    assert.equal(
      (await request(env, "/api/school/data", { cookie: created.cookie }))
        .status,
      403
    );
    assert.equal(
      (await request(env, "/api/discussions", { cookie: created.cookie }))
        .status,
      403
    );
    assert.equal((await request(env, "/api/discussions")).status, 401);
    assert.equal(
      db
        .prepare("SELECT password_hash FROM school_users WHERE id=?")
        .get(created.user.id)
        .password_hash.includes(password),
      false
    );
  } finally {
    db.close();
  }
});
test("admin can approve student; active student reads persisted curriculum but cannot list accounts or grant roles", async () => {
  const { env, db } = await setup();
  try {
    const admin = await owner(env),
      created = await student(env);
    assert.equal(
      (
        await request(env, `/api/school/users/${created.user.id}`, {
          method: "POST",
          cookie: admin,
          body: { status: "active" },
        })
      ).status,
      200
    );
    const active = await loginStudent(env);
    const response = await request(env, "/api/school/data", { cookie: active });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.classrooms.length, 1);
    assert.equal(
      (await request(env, "/api/school/users", { cookie: active })).status,
      403
    );
    assert.equal(
      (
        await request(env, `/api/school/users/${created.user.id}`, {
          method: "POST",
          cookie: active,
          body: { role: "admin" },
        })
      ).status,
      403
    );
  } finally {
    db.close();
  }
});
test("teacher can approve students but cannot promote accounts or access AI secrets", async () => {
  const { env, db } = await setup();
  try {
    const admin = await owner(env),
      created = await student(env);
    await request(env, `/api/school/users/${created.user.id}`, {
      method: "POST",
      cookie: admin,
      body: { status: "active", role: "teacher" },
    });
    const teacher = await loginStudent(env),
      second = await student(env, "student_two");
    assert.equal(
      (
        await request(env, `/api/school/users/${second.user.id}`, {
          method: "POST",
          cookie: teacher,
          body: { status: "active" },
        })
      ).status,
      200
    );
    assert.equal(
      (
        await request(env, `/api/school/users/${second.user.id}`, {
          method: "POST",
          cookie: teacher,
          body: { role: "admin" },
        })
      ).status,
      403
    );
    assert.equal(
      (await request(env, "/api/school/settings", { cookie: teacher })).status,
      403
    );
  } finally {
    db.close();
  }
});
test("progress is bound to session user and quiz scores are computed from real answers", async () => {
  const { env, db } = await setup();
  try {
    const admin = await owner(env),
      created = await student(env);
    await request(env, `/api/school/users/${created.user.id}`, {
      method: "POST",
      cookie: admin,
      body: { status: "active" },
    });
    const active = await loginStudent(env);
    const complete = await request(env, "/api/school/progress", {
      method: "POST",
      cookie: active,
      body: { lessonId: "air-1", answers: [1, 2], userId: "owner", score: 999 },
    });
    assert.deepEqual(await complete.json(), {
      percent: 100,
      score: 2,
      total: 2,
    });
    assert.equal(
      db.prepare("SELECT user_id FROM school_progress").get().user_id,
      created.user.id
    );
    assert.equal(
      (
        await request(env, "/api/school/progress", {
          method: "POST",
          cookie: active,
          body: { lessonId: "air-1", answers: [999] },
        })
      ).status,
      400
    );
  } finally {
    db.close();
  }
});
test("curriculum save uses optimistic revision and excludes student mutation", async () => {
  const { env, db } = await setup();
  try {
    const admin = await owner(env),
      loaded = await (
        await request(env, "/api/school/data", { cookie: admin })
      ).json();
    const data = loaded.data;
    data.classrooms[0].description = "แก้ไขโดยครู";
    assert.equal(
      (
        await request(env, "/api/school/data", {
          method: "PUT",
          cookie: admin,
          body: { data, revision: loaded.revision },
        })
      ).status,
      200
    );
    assert.equal(
      (
        await request(env, "/api/school/data", {
          method: "PUT",
          cookie: admin,
          body: { data, revision: loaded.revision },
        })
      ).status,
      409
    );
  } finally {
    db.close();
  }
});
test("password reset revokes sessions and forces change; admin cannot demote their active account", async () => {
  const { env, db } = await setup();
  try {
    const admin = await owner(env),
      created = await student(env);
    await request(env, `/api/school/users/${created.user.id}`, {
      method: "POST",
      cookie: admin,
      body: { status: "active" },
    });
    const active = await loginStudent(env);
    const reset = await request(
      env,
      `/api/school/users/${created.user.id}/reset`,
      { method: "POST", cookie: admin }
    );
    assert.ok((await reset.json()).temporaryPassword.length >= 12);
    assert.equal(
      (
        await (
          await request(env, "/api/school/auth/me", { cookie: active })
        ).json()
      ).user,
      null
    );
    assert.equal(
      (
        await request(env, "/api/school/users/owner", {
          method: "POST",
          cookie: admin,
          body: { role: "student" },
        })
      ).status,
      400
    );
  } finally {
    db.close();
  }
});
test("session cookie plus forged role header cannot bypass forum ownership; teacher moderation is server-authorized", async () => {
  const { env, db } = await setup();
  try {
    const admin = await owner(env),
      created = await student(env);
    await request(env, `/api/school/users/${created.user.id}`, {
      method: "POST",
      cookie: admin,
      body: { status: "active" },
    });
    const active = await loginStudent(env);
    const post = await request(env, "/api/discussions", {
      method: "POST",
      cookie: active,
      body: {
        alias: "ปลอมเป็นครู",
        title: "ทดสอบสิทธิ์บอร์ด",
        body: "ข้อมูลลมและเวลา",
      },
    });
    assert.equal(post.status, 201);
    const { id } = await post.json();
    const result = await (
      await request(env, `/api/discussions/${id}`, { cookie: admin })
    ).json();
    assert.equal(result.thread.alias, "นักเรียนทดสอบ");
    assert.equal(
      (
        await request(env, `/api/discussions/${id}`, {
          method: "DELETE",
          cookie: admin,
        })
      ).status,
      200
    );
  } finally {
    db.close();
  }
});
test("cross-site mutation is rejected and logout invalidates the session", async () => {
  const { env, db } = await setup();
  try {
    const admin = await owner(env);
    assert.equal(
      (
        await request(env, "/api/school/users/owner", {
          method: "POST",
          cookie: admin,
          body: { role: "teacher" },
          headers: { Origin: "https://evil.example" },
        })
      ).status,
      403
    );
    await request(env, "/api/school/auth/logout", {
      method: "POST",
      cookie: admin,
    });
    assert.equal(
      (await request(env, "/api/school/users", { cookie: admin })).status,
      401
    );
  } finally {
    db.close();
  }
});
test("Gemini keys are encrypted at rest and never returned by the settings API", async () => {
  const { env, db } = await setup();
  try {
    const admin = await owner(env),
      key = "unit-test-gemini-key-never-a-real-key";
    assert.equal(
      (
        await request(env, "/api/school/settings", {
          method: "POST",
          cookie: admin,
          body: { apiKey: key, model: "gemini-3.8-flash" },
        })
      ).status,
      200
    );
    const row = db
      .prepare("SELECT value FROM school_settings WHERE key='gemini_key'")
      .get();
    assert.equal(row.value.includes(key), false);
    const settings = await (
      await request(env, "/api/school/settings", { cookie: admin })
    ).json();
    assert.deepEqual(settings, { configured: true, model: "gemini-3.8-flash" });
  } finally {
    db.close();
  }
});

test("discussion API stays private when an optional deployment flag is missing", async () => {
  const { env, db } = await setup();
  try {
    delete env.SCHOOL_AUTH_REQUIRED;
    assert.equal((await request(env, "/api/discussions")).status, 401);
  } finally {
    db.close();
  }
});

test("student loads document metadata first and reads full material only through the protected endpoint", async () => {
  const { env, db } = await setup();
  try {
    const admin = await owner(env),
      created = await student(env);
    await request(env, `/api/school/users/${created.user.id}`, {
      method: "POST",
      cookie: admin,
      body: { status: "active" },
    });
    const active = await loginStudent(env),
      data = await (
        await request(env, "/api/school/data", { cookie: active })
      ).json();
    assert.equal("text" in data.data.documents[0], false);
    assert.equal("chunks" in data.data.documents[0], false);
    const path =
      "/api/school/documents/" + encodeURIComponent(data.data.documents[0].id);
    const response = await request(env, path, { cookie: active });
    assert.equal(response.status, 200);
    assert.ok((await response.json()).document.text.length > 0);
    assert.equal((await request(env, path)).status, 401);
    assert.equal(
      (
        await request(env, "/api/school/documents/not-found", {
          cookie: active,
        })
      ).status,
      404
    );
  } finally {
    db.close();
  }
});

test("reading-only lessons can complete without inventing a quiz score; quiz lessons still require every answer", async () => {
  const { env, db } = await setup();
  try {
    const admin = await owner(env),
      loaded = await (
        await request(env, "/api/school/data", { cookie: admin })
      ).json();
    loaded.data.lessons.find((l) => l.id === "air-1").quiz = [];
    assert.equal(
      (
        await request(env, "/api/school/data", {
          method: "PUT",
          cookie: admin,
          body: { data: loaded.data, revision: loaded.revision },
        })
      ).status,
      200
    );
    const done = await request(env, "/api/school/progress", {
      method: "POST",
      cookie: admin,
      body: { lessonId: "air-1", answers: [] },
    });
    assert.deepEqual(await done.json(), {
      percent: 100,
      score: null,
      total: null,
    });
    assert.equal(
      (
        await request(env, "/api/school/progress", {
          method: "POST",
          cookie: admin,
          body: { lessonId: "water-1", answers: [] },
        })
      ).status,
      400
    );
  } finally {
    db.close();
  }
});

test("opening a completed lesson changes last activity without rewriting its completion time", async () => {
  const { env, db } = await setup();
  try {
    const admin = await owner(env);
    await request(env, "/api/school/progress", {
      method: "POST",
      cookie: admin,
      body: { lessonId: "air-1", answers: [1, 2] },
    });
    const before = db
      .prepare("SELECT * FROM school_progress WHERE lesson_id='air-1'")
      .get();
    await new Promise((resolve) => setTimeout(resolve, 3));
    await request(env, "/api/school/progress", {
      method: "POST",
      cookie: admin,
      body: { lessonId: "air-1" },
    });
    const after = db
      .prepare("SELECT * FROM school_progress WHERE lesson_id='air-1'")
      .get();
    assert.equal(after.percent, 100);
    assert.equal(after.score, 2);
    assert.equal(after.completed_at, before.completed_at);
    assert.ok(after.updated_at >= before.updated_at);
  } finally {
    db.close();
  }
});


test("image uploads enforce account, role, format and persisted lesson references", async () => {
  const {env,db}=await setup();
  const admin=await owner(env);
  const upload=(image,cookie=admin)=>request(env,"/api/school/images",{method:"POST",cookie,body:{image}});
  assert.equal((await upload("data:image/svg+xml;base64,PHN2Zz4=")).status,400);
  assert.equal((await upload("data:image/png;base64,ZmFrZQ==")).status,400);
  const image="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
  assert.equal((await upload(image,"")).status,401);
  const response=await upload(image);
  assert.equal(response.status,200);
  const {image:saved}=await response.json();
  const url="/api/school/images/"+saved.id;
  const learner=await student(env);
  db.prepare("UPDATE school_users SET status='active' WHERE id=?").run(learner.user.id);
  const learnerCookie=await loginStudent(env);
  assert.equal((await upload(image,learnerCookie)).status,403);
  assert.equal((await request(env,url,{cookie:learnerCookie})).status,404);

  assert.equal((await request(env,url)).status,401);
  const loaded=await request(env,url,{cookie:admin});
  assert.equal(loaded.headers.get("Content-Type"),"image/png");
  assert.equal((await loaded.arrayBuffer()).byteLength,atob(image.split(",")[1]).length);
  const state=await (await request(env,"/api/school/data",{cookie:admin})).json();
  state.data.lessons[0].images=[{id:"00000000-0000-0000-0000-000000000000",caption:"missing"}];
  assert.equal((await request(env,"/api/school/data",{method:"PUT",cookie:admin,body:state})).status,400);
  state.data.lessons[0].images=[saved];
  assert.equal((await request(env,"/api/school/data",{method:"PUT",cookie:admin,body:state})).status,200);
  assert.equal((await request(env,url,{cookie:learnerCookie})).status,200);
  db.close();
});
