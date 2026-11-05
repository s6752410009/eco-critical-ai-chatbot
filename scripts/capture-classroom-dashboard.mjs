import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
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
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${url}/demo`);
    await expect(
      page.getByRole("heading", { name: "สวัสดี, นักเรียน", exact: true })
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page
      .locator(".course-card-media img")
      .evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode()))
      );
    await expect(page.locator(".mentingo-course-card")).toHaveCount(4);
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      composerBottom: document
        .querySelector(".dashboard-chat .chat-composer")
        .getBoundingClientRect().bottom,
      continueTop: document
        .querySelector(".feature-start")
        .getBoundingClientRect().top,
      chatScroll: document.querySelector(".dashboard-chat .chat-messages")
        .scrollTop,
      canvas: getComputedStyle(document.querySelector(".learning-app"))
        .backgroundColor,
      font: getComputedStyle(document.querySelector(".dashboard-greeting h1"))
        .fontFamily,
    }));
    if (
      layout.overflow ||
      layout.continueTop > height - 80 ||
      layout.chatScroll !== 0 ||
      errors.length
    )
      throw new Error(
        `Dashboard layout failed: ${JSON.stringify({ width, layout, errors })}`
      );
    if (width === 1440 && layout.composerBottom > height)
      throw new Error("Desktop composer is below the first viewport");
    if (width === 390)
      await expect(
        page.getByRole("button", { name: "ถาม Eco AI", exact: true })
      ).toBeInViewport();
    await page.screenshot({
      path: new URL(`dashboard-${width}x${height}.png`, out).pathname,
    });
    await page.screenshot({
      path: new URL(`dashboard-${width}x${height}-full.png`, out).pathname,
      fullPage: true,
    });
    if (width === 1440) {
      const chat = page.locator(".dashboard-chat");
      await chat
        .getByRole("textbox", { name: "คำถามถึง Eco AI" })
        .fill("PM2.5 ส่งผลต่อร่างกายอย่างไร?");
      await chat.getByRole("button", { name: "ส่งคำถาม", exact: true }).click();
      await expect(chat.locator(".chat-message.assistant")).toContainText(
        "PM2.5"
      );
      await chat.locator(".message-sources button").first().click();
      const detail = chat.getByRole("region", {
        name: "รายละเอียดแหล่งอ้างอิง",
      });
      await expect(detail).toContainText("ส่วนที่");
      await detail.evaluate((element) => {
        const parent = element.closest(".chat-messages");
        parent.scrollTop = parent.scrollHeight;
      });
      await page.screenshot({
        path: new URL("dashboard-citation.png", out).pathname,
      });
    }
    checks.push({
      width,
      height,
      passed: true,
      ...layout,
      browserErrors: errors,
    });
    console.log(`PASS dashboard visual capture ${width}x${height}`);
    await context.close();
  }
} finally {
  await writeFile(
    new URL("dashboard-visual-qa.json", out),
    JSON.stringify({ url, checks, liveGeminiTested: false }, null, 2) + "\n"
  );
  await browser.close();
}
