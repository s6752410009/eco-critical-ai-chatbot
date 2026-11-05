import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const url = process.env.CLASSROOM_QA_URL || "http://127.0.0.1:3410";
const out = new URL("../artifacts/classroom/", import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CLASSROOM_QA_BROWSER === "chromium"
    ? {}
    : { channel: "chrome" }),
});
const checks = [];
const axe = await readFile(
  new URL("../frontend/node_modules/axe-core/axe.min.js", import.meta.url),
  "utf8"
);
try {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      locale: "th-TH",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const [screen, path] of [
      ["dashboard", "/demo"],
      ["lesson", "/demo?screen=lesson&class=eco-m5&lesson=plastic-1"],
    ]) {
      await page.goto(url + path);
      await expect(page.locator(".mentingo-root h1").first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page
        .locator(".mentingo-root img")
        .evaluateAll((images) =>
          Promise.all(
            images
              .filter((i) => i.getBoundingClientRect().width > 0)
              .map((i) => i.decode().catch(() => {}))
          )
        );
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        canvas: getComputedStyle(document.querySelector(".learning-app"))
          .backgroundColor,
        font: getComputedStyle(document.querySelector(".mentingo-root h1"))
          .fontFamily,
      }));
      if (layout.overflow || errors.length)
        throw new Error(JSON.stringify({ screen, width, layout, errors }));
      if (screen === "dashboard")
        await expect(
          page.locator('[data-testid="modern-course-card-link"]')
        ).toHaveCount(10);
      await expect(
        page.getByRole("button", { name: "ถาม Eco AI", exact: true })
      ).toBeInViewport();
      await page.screenshot({
        path: new URL(`${screen}-${width}x${height}.png`, out).pathname,
      });
      await page.screenshot({
        path: new URL(`${screen}-${width}x${height}-full.png`, out).pathname,
        fullPage: true,
      });
      await page.addScriptTag({ content: axe });
      const audit = await page.evaluate(async () => {
        const r = await axe.run(document.querySelector(".mentingo-root"), {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        });
        return {
          violations: r.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes
              .map((n) => ({ target: n.target, summary: n.failureSummary }))
              .slice(0, 12),
          })),
          incomplete: r.incomplete.map((v) => v.id),
          passes: r.passes.length,
        };
      });
      checks.push({
        screen,
        width,
        height,
        passed: true,
        ...layout,
        audit,
        browserErrors: [...errors],
      });
      console.log(
        `PASS original Mentingo ${screen} ${width}x${height}; axe violations: ${audit.violations.length}`
      );
    }
    await page.getByLabel("บทบาทสาธิต").selectOption("teacher");
    for (const screen of ["teacher-dashboard", "teacher-knowledge"]) {
      if (screen === "teacher-knowledge") {
        if (width <= 760)
          await page
            .getByRole("button", { name: "เปิดเมนู", exact: true })
            .click();
        await page
          .locator(".learning-sidebar")
          .getByRole("button", { name: "AI Knowledge Base", exact: true })
          .click();
      }
      await expect(page.locator(".native-teacher-workspace")).toBeVisible();
      await expect.poll(() => page.locator(".native-teacher-workspace img").evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth
        )
      )
        throw new Error(`Teacher overflow ${width} ${screen}`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: new URL(`${screen}-${width}x${height}.png`, out).pathname,
      });
      await page.addScriptTag({ content: axe });
      const audit = await page.evaluate(async () => {
        const r = await axe.run(document.querySelector(".mentingo-root"), {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        });
        return {
          violations: r.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes
              .map((n) => ({ target: n.target, summary: n.failureSummary }))
              .slice(0, 12),
          })),
          passes: r.passes.length,
        };
      });
      checks.push({
        screen,
        width,
        height,
        passed: true,
        audit,
        browserErrors: [...errors],
      });
      console.log(
        `PASS original teacher UI ${screen} ${width}x${height}; axe violations: ${audit.violations.length}`
      );
    }
    await page.getByLabel("บทบาทสาธิต").selectOption("student");
    await page.goto(`${url}/demo?screen=lesson&class=eco-m5&lesson=plastic-1`);
    await expect(page.locator(".waste-activity")).toBeVisible();
    if (width === 1440) {
      const activity = page.locator(".waste-activity");
      await activity
        .getByRole("button", { name: "รีไซเคิล", exact: true })
        .click();
      await expect(activity).toContainText("สำเร็จ 1/3");
      await activity.screenshot({
        path: new URL("native-waste-feedback.png", out).pathname,
      });
      const chat = page.locator(".eco-chat").first();
      await chat
        .getByRole("textbox", { name: "คำถามถึง Eco AI" })
        .fill("ไมโครพลาสติกเข้าสู่ห่วงโซ่อาหารได้อย่างไร?");
      await chat.getByRole("button", { name: "ส่งคำถาม", exact: true }).click();
      await expect(chat.locator(".chat-message.assistant")).toContainText(
        "พลาสติก"
      );
      await chat.locator(".message-sources button").first().click();
      const detail = chat.getByRole("region", {
        name: "รายละเอียดแหล่งอ้างอิง",
      });
      await expect(detail).toContainText("ส่วนที่");
      await detail.evaluate((e) => {
        const p = e.closest(".chat-messages");
        p.scrollTop = p.scrollHeight;
      });
      await chat.screenshot({
        path: new URL("dashboard-citation.png", out).pathname,
      });
    }
    await context.close();
  }
} finally {
  await writeFile(
    new URL("dashboard-visual-qa.json", out),
    JSON.stringify(
      { url, nativeMentingoSource: true, checks, liveGeminiTested: false },
      null,
      2
    ) + "\n"
  );
  await browser.close();
}

if (checks.some((c) => c.browserErrors?.length || c.audit?.violations?.some((v) => ["critical", "serious"].includes(v.impact)))) {
  throw new Error("Visual QA found browser errors or serious accessibility violations");
}
