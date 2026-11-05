import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleBoard } from "../../cloudflare/worker.mjs";
function environment() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  db.exec(
    readFileSync(
      new URL(
        "../../cloudflare/migrations/0001_discussions.sql",
        import.meta.url
      ),
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
    BOARD_DB: {
      prepare: (sql) => wrap(sql),
      batch: async (statements) => {
        db.exec("BEGIN");
        try {
          const results = [];
          for (const statement of statements)
            results.push(await statement.run());
          db.exec("COMMIT");
          return results;
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      },
    },
  };
  return { env, db };
}
const tokenA = "a".repeat(72),
  tokenB = "b".repeat(72),
  origin = "https://eco-critical.pages.dev";
function call(
  env,
  path = "",
  method = "GET",
  body,
  token = tokenA,
  extra = {}
) {
  return handleBoard(
    new Request(origin + "/api/discussions" + path, {
      method,
      headers: {
        Origin: origin,
        "X-Board-Token": token,
        "Content-Type": "application/json",
        ...extra,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
    env
  );
}
const post = {
  alias: "นักเรียน A",
  title: "ควันลอนดอนสะสมได้อย่างไร",
  body: "เราควรตรวจสอบข้อมูลลมและอุณหภูมิ",
  caseId: "london-1952",
};
test("discussion threads and replies persist across independent browser identities without exposing author hashes", async () => {
  const { env, db } = environment();
  try {
    const created = await call(env, "", "POST", post);
    assert.equal(created.status, 201);
    const { id } = await created.json();
    const read = await (
      await call(env, `/${id}`, "GET", undefined, tokenB)
    ).json();
    assert.equal(read.thread.title, post.title);
    assert.equal(read.thread.mine, false);
    assert.equal("author_hash" in read.thread, false);
    assert.equal(
      (
        await call(
          env,
          `/${id}/replies`,
          "POST",
          { alias: "นักเรียน B", body: "ควรเทียบช่วงเวลาเดียวกัน" },
          tokenB
        )
      ).status,
      201
    );
    const result = await (await call(env, `/${id}`)).json();
    assert.equal(result.replies.length, 1);
    assert.equal(result.thread.mine, true);
    assert.equal(result.replies[0].mine, false);
  } finally {
    db.close();
  }
});
test("forged teacher role cannot delete another author's thread; own thread deletion cascades replies", async () => {
  const { env, db } = environment();
  try {
    const { id } = await (await call(env, "", "POST", post)).json();
    await call(
      env,
      `/${id}/replies`,
      "POST",
      { alias: "B", body: "คำตอบ" },
      tokenB
    );
    assert.equal(
      (
        await call(env, `/${id}`, "DELETE", undefined, tokenB, {
          "X-Role": "teacher",
        })
      ).status,
      403
    );
    assert.equal((await call(env, `/${id}`, "DELETE")).status, 200);
    assert.equal((await call(env, `/${id}`)).status, 404);
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM discussion_replies").get().n,
      0
    );
  } finally {
    db.close();
  }
});
test("posting validates origin, browser token, bounds and case references", async () => {
  const { env, db } = environment();
  try {
    assert.equal(
      (
        await call(env, "", "POST", post, tokenA, {
          Origin: "https://evil.example",
        })
      ).status,
      403
    );
    assert.equal((await call(env, "", "POST", post, "forged")).status, 401);
    assert.equal(
      (await call(env, "", "POST", { ...post, caseId: "nonexistent" })).status,
      400
    );
    assert.equal(
      (await call(env, "", "POST", { ...post, body: "x".repeat(3001) })).status,
      400
    );
    assert.equal(
      (await call(env, "", "POST", { ...post, alias: "" })).status,
      400
    );
  } finally {
    db.close();
  }
});
test("atomic write budget rejects a seventh post from one identity", async () => {
  const { env, db } = environment();
  try {
    for (let i = 0; i < 6; i++)
      assert.equal((await call(env, "", "POST", post)).status, 201);
    assert.equal((await call(env, "", "POST", post)).status, 429);
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM discussions").get().n,
      6
    );
  } finally {
    db.close();
  }
});
test("SQL-like and markup input remain plain stored text; no route can run arbitrary SQL", async () => {
  const { env, db } = environment();
  try {
    const text = "<script>alert(1)</script>'; DROP TABLE discussions; --";
    const { id } = await (
      await call(env, "", "POST", { ...post, body: text })
    ).json();
    const result = await (await call(env, `/${id}`)).json();
    assert.equal(result.thread.body, text);
    assert.equal((await call(env, "/invalid/route", "POST", post)).status, 404);
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM discussions").get().n,
      1
    );
  } finally {
    db.close();
  }
});
test("missing database is an explicit service error, not a successful empty board", async () => {
  assert.equal((await call({}, "")).status, 503);
});
