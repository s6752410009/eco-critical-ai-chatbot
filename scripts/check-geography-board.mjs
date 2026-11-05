import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const base = process.env.CLASSROOM_QA_URL || "http://127.0.0.1:3416";
const origin = new URL(base).origin;
const out = new URL("../artifacts/classroom/", import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CLASSROOM_QA_BROWSER === "chromium"
    ? {}
    : { channel: "chrome" }),
});
const a = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const b = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
const one = await a.newPage(),
  two = await b.newPage();
const errors = [],
  checks = [];
let threadId, token;
for (const page of [one, two])
  page.on("pageerror", (e) => errors.push(e.message));
const axe = await readFile(
  new URL("../frontend/node_modules/axe-core/axe.min.js", import.meta.url),
  "utf8"
);
async function capture(page, name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: new URL(name + ".png", out).pathname,
    fullPage: false,
  });
  await page.addScriptTag({ content: axe });
  const violations = await page.evaluate(async () =>
    (
      await axe.run(document.querySelector(".mentingo-root"), {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      })
    ).violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    }))
  );
  checks.push({ name, violations });
  if (violations.some((v) => ["serious", "critical"].includes(v.impact)))
    throw new Error(name + ": " + JSON.stringify(violations));
}
try {
  await one.goto(base + "/demo?screen=cases&class=eco-m5");
  await expect(one.locator(".case-timeline-row")).toHaveCount(6);
  await expect(
    one.getByLabel("ห้องเรียนที่ใช้งาน").locator("option")
  ).toHaveCount(1);
  await capture(one, "geography-cases-desktop");
  await two.goto(base + "/demo?screen=cases");
  await expect(two.locator(".case-timeline-row")).toHaveCount(6);
  await capture(two, "geography-cases-mobile");
  await one.getByLabel("ประเทศของกรณีศึกษา").selectOption("จีน");
  await expect(one.locator(".case-timeline-row")).toHaveCount(1);
  await one.getByLabel("ประเทศของกรณีศึกษา").selectOption("");
  await one.getByLabel("ค้นหากรณีศึกษา").fill("2026");
  await expect(one.locator(".case-timeline-row")).toHaveCount(1);
  await expect(one.locator(".case-timeline-row")).toContainText("เชียงใหม่");
  await one
    .locator(".case-timeline-row")
    .getByRole("button", { name: "เรียนกรณีนี้" })
    .click();
  await expect(
    one.getByRole("heading", {
      name: "เชียงใหม่: ฝุ่นกับการเข้าถึงการดูแล",
      exact: true,
      level: 1,
    })
  ).toBeVisible();
  await expect(one.locator(".eco-native-reference")).toHaveAttribute(
    "href",
    /thailand.prd.go.th/
  );
  await one.locator(".case-discussion-invite a").click();
  await expect(one.getByLabel("เชื่อมกับกรณีศึกษา")).toHaveValue(
    "thailand-2026"
  );
  await one.getByLabel("ชื่อที่ใช้แสดง").fill("ผู้เรียน A (ทดสอบ)");
  await one
    .getByLabel("หัวข้อกระทู้")
    .fill("เราควรใช้ข้อมูลอะไรเลือกพื้นที่ช่วยเหลือเรื่องฝุ่น?");
  await one
    .getByLabel("ข้อความ", { exact: true })
    .fill(
      "ลองเปรียบเทียบข้อมูลฝุ่น ระยะทางถึงบริการ และกลุ่มเปราะบางก่อนสรุป\nแหล่งข้อมูล: กรมประชาสัมพันธ์ (เมษายน 2026)"
    );
  await one.getByRole("button", { name: "เผยแพร่กระทู้" }).click();
  await expect(one.locator(".board-original h2")).toBeVisible();
  threadId = new URL(one.url()).searchParams.get("thread");
  token = await one.evaluate(() => localStorage.getItem("eco-board-token"));
  await expect(
    one.getByRole("button", { name: "ลบกระทู้ของฉัน", exact: true })
  ).toBeVisible();
  await two.goto(`${base}/demo?screen=discussions&thread=${threadId}`);
  await expect(two.locator(".board-original h2")).toHaveText(
    "เราควรใช้ข้อมูลอะไรเลือกพื้นที่ช่วยเหลือเรื่องฝุ่น?"
  );
  await expect(
    two.getByRole("button", { name: "ลบกระทู้ของฉัน", exact: true })
  ).toHaveCount(0);
  await two.getByLabel("ชื่อที่ใช้แสดง").fill("ผู้เรียน B (ทดสอบ)");
  await two
    .getByLabel("คำตอบของคุณ")
    .fill(
      "ควรเทียบข้อมูลในช่วงเวลาเดียวกัน และระบุข้อจำกัดของสถานีตรวจวัดด้วย"
    );
  await two.getByRole("button", { name: "ส่งคำตอบ", exact: true }).click();
  await expect(two.locator(".board-reply")).toHaveCount(1);
  await one.getByRole("button", { name: "รีเฟรชบอร์ด", exact: true }).click();
  await expect(one.locator(".board-reply")).toContainText(
    "ข้อจำกัดของสถานีตรวจวัด"
  );
  if (await one.evaluate(() => window.__boardInjected))
    throw new Error("Markup executed");
  await one.evaluate(() => window.scrollTo(0, 0));
  await capture(one, "geography-board-desktop");
  await two.evaluate(() => window.scrollTo(0, 0));
  await capture(two, "geography-board-mobile");
  await two.setViewportSize({ width: 320, height: 640 });
  if (
    await two.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1
    )
  )
    throw new Error("Board overflow at 320px");
  await two.getByRole("button", { name: "ลบคำตอบของฉัน", exact: true }).click();
  await two
    .locator(".board-delete-confirm")
    .getByRole("button", { name: "ลบ", exact: true })
    .click();
  await expect(two.locator(".board-reply")).toHaveCount(0);
  await one
    .getByRole("button", { name: "ลบกระทู้ของฉัน", exact: true })
    .click();
  await one
    .locator(".board-delete-confirm")
    .getByRole("button", { name: "ลบ", exact: true })
    .click();
  await expect(one.locator(".board-list")).toBeVisible();
  threadId = null;
  if (errors.length) throw new Error(JSON.stringify(errors));
  checks.push({
    name: "cross-browser shared persistence, own-message deletion, plain-text rendering, case context and mobile flow",
    passed: true,
  });
  console.log(
    "PASS geography case filters and shared discussion across independent browser contexts; screenshots/axe inspected by script"
  );
} finally {
  if (threadId && token)
    await a.request
      .delete(`${base}/api/discussions/${threadId}`, {
        headers: { Origin: origin, "X-Board-Token": token },
      })
      .catch(() => {});
  await writeFile(
    new URL("geography-board-qa.json", out),
    JSON.stringify({ url: base, checks, browserErrors: errors }, null, 2) + "\n"
  );
  await browser.close();
}
