import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import { writeFile } from "node:fs/promises";
const url = process.env.CLASSROOM_QA_URL || "http://127.0.0.1:3410";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CLASSROOM_QA_BROWSER === "chromium"
    ? {}
    : { channel: "chrome" }),
});
const checks = [];
const errors = [];
const sizes = [
  [320, 640],
  [360, 740],
  [375, 812],
  [390, 844],
  [414, 896],
  [430, 932],
  [640, 360],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
];
try {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    locale: "th-TH",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  async function nav(name, width) {
    if (width <= 760 && !(await page.locator(".learning-sidebar").isVisible()))
      await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
    await page
      .locator(".learning-sidebar")
      .getByRole("button", { name, exact: true })
      .click();
  }
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.goto(url + "/demo");
    await expect(page.locator(".native-catalog-view h1")).toBeVisible();
    for (const role of ["student", "teacher"]) {
      await page.getByLabel("บทบาทสาธิต").selectOption(role);
      const screens =
        role === "student"
          ? ["ภาพรวม", "ห้องเรียนของฉัน", "บทเรียน", "ถาม AI", "ความก้าวหน้า", "กรณีศึกษา", "บอร์ดสนทนา"]
          : [
              "ภาพรวม",
              "จัดการห้องเรียน",
              "เนื้อหาบทเรียน",
              "AI Knowledge Base",
              "คำถามนักเรียน",
              "กรณีศึกษา",
              "บอร์ดสนทนา",
            ];
      for (const screen of screens) {
        await nav(screen, width);
        const layout = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          controls: [
            ...document.querySelectorAll(
              ".learning-topbar button,.learning-topbar select"
            ),
          ]
            .map((e) => ({
              name: e.getAttribute("aria-label") || e.textContent.trim(),
              r: e.getBoundingClientRect(),
            }))
            .filter((e) => e.r.width > 0)
            .filter((e) => e.r.left < 0 || e.r.right > innerWidth + 1)
            .map((e) => e.name),
        }));
        if (layout.overflow || layout.controls.length)
          throw new Error(
            JSON.stringify({ width, height, role, screen, layout })
          );
        checks.push({ width, height, role, screen, passed: true });
      }
    }
    await page.goto(url + "/demo?screen=lesson&class=eco-m5&lesson=plastic-1");
    await expect(page.locator(".waste-activity")).toBeVisible();
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1
      )
    )
      throw new Error(`Lesson overflow ${width}`);
    checks.push({
      width,
      height,
      role: "student",
      screen: "plastic lesson",
      passed: true,
    });
    console.log(`PASS responsive ${width}x${height} — both roles and lesson`);
  }
  if (errors.length) throw new Error(errors.join("; "));
  const normal = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "no-preference",
  });
  const p = await normal.newPage();
  await p.goto(url + "/demo?screen=lesson&class=eco-m5&lesson=plastic-1");
  await expect(p.locator(".waste-activity")).toBeVisible();
  const motion = await p
    .locator(".eco-native-photo")
    .evaluate((e) => getComputedStyle(e).animationName);
  if (motion !== "eco-native-arrive")
    throw new Error("Lesson entrance motion missing");
  await p.emulateMedia({ reducedMotion: "reduce" });
  const reduced = await p
    .locator(".eco-native-photo")
    .evaluate((e) => getComputedStyle(e).animationName);
  if (reduced !== "none") throw new Error("Reduced motion not respected");
  checks.push({ motion, reduced, passed: true });
  await normal.close();
  await context.close();
} finally {
  await writeFile(
    new URL("../artifacts/classroom/responsive-qa.json", import.meta.url),
    JSON.stringify({ checks, browserErrors: errors }, null, 2) + "\n"
  );
  await browser.close();
}
