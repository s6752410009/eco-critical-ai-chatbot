import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const base = process.env.CLASSROOM_QA_URL || "http://127.0.0.1:3416",
  origin = new URL(base).origin;
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname))
  throw new Error(
    "Full QA only uses isolated local accounts; production gets a separate read-only smoke check"
  );
const qa = JSON.parse(
  await readFile(
    process.env.ECO_QA_FIXTURE ||
      new URL("../.classroom-local/qa-account.json", import.meta.url),
    "utf8"
  )
);
qa.studentUsername =
  qa.studentUsername + "_" + Math.random().toString(36).slice(2, 7);
const lessonTitle =
  "หลักฐานการเคลื่อนที่ของควัน (ทดสอบ " + qa.studentUsername.slice(-5) + ")";
const out = new URL("../artifacts/classroom/", import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CLASSROOM_QA_BROWSER === "chromium"
    ? {}
    : { channel: "chrome" }),
});
const adminContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const studentContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
const admin = await adminContext.newPage(),
  student = await studentContext.newPage();
const checks = [],
  errors = [];
let threadId;
const axe = await readFile(
  new URL("../frontend/node_modules/axe-core/axe.min.js", import.meta.url),
  "utf8"
);
for (const page of [admin, student])
  page.on("pageerror", (e) => errors.push(e.message));
async function snapshot(page, name) {
  await expect(page.locator(".mentingo-root").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    if (document.querySelector(".school-auth-story")) {
      await new Promise((resolve, reject) => {
        const photo = new Image();
        photo.onload = resolve;
        photo.onerror = () => reject(new Error("Meadow photo not loaded"));
        photo.src = "/classroom/meadow.jpg";
      });
    }
  });
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
  if (violations.some((v) => ["critical", "serious"].includes(v.impact)))
    throw new Error(
      "Accessibility findings in " + name + ": " + JSON.stringify(violations)
    );
}
async function nav(page, label) {
  if (
    (await page
      .getByRole("button", { name: "เปิดเมนู", exact: true })
      .isVisible()) &&
    !(await page.locator(".learning-sidebar").isVisible())
  )
    await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
  await page
    .locator(".learning-sidebar")
    .getByRole("button", { name: label, exact: true })
    .click();
}
async function login(page, username, password) {
  await page.goto(base + "/login");
  await page.getByLabel("ชื่อผู้ใช้", { exact: true }).fill(username);
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
}
async function check(name, fn) {
  await fn();
  checks.push({ name, passed: true });
  console.log("PASS " + name);
}
try {
  await admin.goto(base + "/login");
  await snapshot(admin, "school-login-desktop");
  await student.goto(base + "/register");
  await snapshot(student, "school-register-mobile");
  await check(
    "real registration, pending approval and no public demo role switch",
    async () => {
      await student
        .getByLabel("ชื่อที่ใช้แสดง", { exact: true })
        .fill("ผู้เรียนทดสอบระบบ");
      await student
        .getByLabel("ชื่อผู้ใช้", { exact: true })
        .fill(qa.studentUsername);
      await student
        .getByLabel("รหัสผ่าน", { exact: true })
        .fill(qa.studentPassword);
      await student
        .getByLabel("ยืนยันรหัสผ่าน", { exact: true })
        .fill(qa.studentPassword);
      await student
        .getByRole("button", { name: "สมัครเข้าเรียน", exact: true })
        .click();
      await expect(
        student.getByRole("heading", { name: "สมัครแล้ว รอคุณครูอนุมัติ" })
      ).toBeVisible();
      await expect(student.locator(".demo-badge,.role-switch")).toHaveCount(0);
      const denied = await studentContext.request.get(
        base + "/api/school/data"
      );
      if (denied.status() !== 403)
        throw new Error("Pending account accessed curriculum");
    }
  );
  await check(
    "admin sees registered student and approves real classroom access",
    async () => {
      await login(admin, qa.username, qa.password);
      await expect(
        admin.getByRole("heading", { name: "ภาพรวมการสอน", exact: true })
      ).toBeVisible();
      await nav(admin, "จัดการผู้ใช้");
      const row = admin
        .locator(".school-user-row")
        .filter({ hasText: qa.studentUsername });
      await expect(row).toContainText("รออนุมัติ");
      await row.getByRole("button", { name: "อนุมัติ", exact: true }).click();
      await expect(row).toContainText("ใช้งานได้");
      await student
        .getByRole("button", { name: "ตรวจสอบสถานะ", exact: true })
        .click();
      await expect(student.locator(".native-catalog-view h1")).toBeVisible();
      await expect(
        student.getByLabel("ห้องเรียนที่ใช้งาน").locator("option")
      ).toHaveCount(1);
      await snapshot(admin, "school-members-desktop");
      await snapshot(student, "school-student-mobile");
    }
  );
  await check(
    "existing interactive lessons and server-scored progress survive a new browser context",
    async () => {
      await student.goto(base + "/app?screen=lesson&class=eco-m5&lesson=air-1");
      await student.getByRole("slider").fill("85");
      await expect(student.locator(".pm-value strong")).toHaveText("85");
      const questions = student.locator(".quiz-question");
      await questions.nth(0).locator(".quiz-options button").nth(1).click();
      await questions.nth(1).locator(".quiz-options button").nth(2).click();
      await student
        .getByRole("button", { name: "บันทึกผลและจบบทเรียน" })
        .click();
      await expect(student.locator(".toast-notice")).toContainText(
        "บันทึกผลการเรียนตามบัญชี"
      );
      const other = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      try {
        const page = await other.newPage();
        await login(page, qa.studentUsername, qa.studentPassword);
        await nav(page, "ความก้าวหน้า");
        await expect(
          page
            .locator(".progress-lessons article")
            .filter({ hasText: "มลพิษทางอากาศกับชีวิตของเรา" })
        ).toContainText("100%");
      } finally {
        await other.close();
      }
      await student.goto(
        base + "/app?screen=lesson&class=eco-m5&lesson=plastic-1"
      );
      const activity = student.locator(".waste-activity");
      await activity
        .getByRole("button", { name: "รีไซเคิล", exact: true })
        .click();
      await expect(activity).toContainText("สำเร็จ 1/3");
    }
  );
  await check(
    "teacher authors real lesson and uploads material, visible to another student's account",
    async () => {
      await nav(admin, "เนื้อหาบทเรียน");
      await admin
        .getByRole("button", { name: "เพิ่มบทเรียน", exact: true })
        .click();
      const editor=admin.getByRole("dialog",{name:"แก้ไขเนื้อหาบทเรียน",exact:true});
      await admin.getByRole("button",{name:"เพิ่มคำถาม",exact:true}).click();
      await editor.evaluate(el=>{el.scrollTop=el.scrollHeight});
      await expect(editor.getByRole("button",{name:"บันทึก",exact:true})).toBeInViewport();
      await expect(editor.getByRole("button",{name:"ปิดฟอร์ม",exact:true})).toBeInViewport();
      await editor.evaluate(el=>{el.scrollTop=0});
      await snapshot(admin, "teacher-editor-desktop");
      await admin.setViewportSize({width:390,height:844});
      await snapshot(admin, "teacher-editor-mobile");
      await editor.evaluate(el=>{el.scrollTop=el.scrollHeight});
      await expect(editor.getByRole("button",{name:"บันทึก",exact:true})).toBeInViewport();
      if(await editor.evaluate(el=>el.scrollWidth>el.clientWidth+1))throw new Error("Editor horizontal overflow");
      await admin.getByRole("button",{name:"นำคำถามนี้ออก",exact:true}).click();
      await admin.setViewportSize({width:1440,height:900});
      await admin.getByLabel("ชื่อบทเรียน", { exact: true }).fill(lessonTitle);
      await admin
        .getByLabel("คำอธิบายสั้นๆ")
        .fill("บทเรียนที่ครูบันทึกจริงบนเซิร์ฟเวอร์");
      await admin
        .locator(".editor-form")
        .getByRole("textbox", { name: "เนื้อหาบทเรียน", exact: true })
        .fill(
          "ข้อมูลลมและเวลา\nการตรวจสอบสมมติฐานเรื่องควันต้องเปรียบเทียบตำแหน่งสถานี ทิศทางลม และช่วงเวลาเดียวกัน"
        );
      await admin.getByRole("button", { name: "บันทึก", exact: true }).click();
      await expect(admin.locator(".toast-notice")).toContainText(
        "บันทึกข้อมูลบนเซิร์ฟเวอร์แล้ว"
      );
      const previewRow=admin.locator(".teacher-lesson-list tr").filter({hasText:lessonTitle});
      await previewRow.getByRole("button",{name:"ดูแบบนักเรียน",exact:true}).click();
      await expect(admin.locator(".eco-native-reading")).toContainText("ช่วงเวลาเดียวกัน");
      await snapshot(admin,"teacher-lesson-preview");
      await nav(admin, "AI Knowledge Base");
      await admin
        .getByLabel("เชื่อมกับบทเรียน")
        .selectOption({ label: lessonTitle });
      await admin.getByLabel("อัปโหลดเอกสารการสอน").setInputFiles({
        name: "qa-evidence.txt",
        mimeType: "text/plain",
        buffer: Buffer.from(
          "ข้อมูลตัวอย่างทดสอบ: ก่อนระบุต้นทางควัน ควรเทียบตำแหน่งสถานี ทิศทางลม และช่วงเวลาเดียวกัน"
        ),
      });
      await expect(admin.locator(".toast-notice")).toContainText("บันทึกเอกสารบนเซิร์ฟเวอร์แล้ว");
      await expect(admin.locator(".knowledge-list")).toContainText(
        "qa-evidence.txt"
      );
      await student.goto(base + "/app?screen=lessons&class=eco-m5");
      const card = student
        .locator('[data-testid="modern-course-card-link"]')
        .filter({ hasText: lessonTitle });
      await card.click();
      await expect(student.locator(".eco-native-reading")).toContainText(
        "ช่วงเวลาเดียวกัน"
      );
      await student
        .getByRole("button", { name: "qa-evidence.txt", exact: true })
        .click();
      await expect(
        student.getByRole("region", {
          name: "เนื้อหาไฟล์ qa-evidence.txt",
          exact: true,
        })
      ).toContainText("ตำแหน่งสถานี");
      await snapshot(student, "school-materials-mobile");
      await student
        .getByRole("button", { name: "บันทึกว่าเรียนจบแล้ว", exact: true })
        .click();
      await expect(student.locator(".toast-notice")).toContainText(
        "บันทึกผลการเรียนตามบัญชี"
      );
      await admin.getByRole("button",{name:"ดู qa-evidence.txt",exact:true}).click();
      const documentPreview=admin.getByRole("dialog",{name:"ตัวอย่างเอกสาร",exact:true});
      await expect(documentPreview).toBeVisible();
      await expect(documentPreview).toContainText("ตำแหน่งสถานี");
      await snapshot(admin,"teacher-document-preview");
      await admin.keyboard.press("Escape");
      await expect(documentPreview).toHaveCount(0);
      await snapshot(admin, "school-knowledge-desktop");
    }
  );
  await check(
    "authenticated board shares replies across accounts and admin can moderate",
    async () => {
      await nav(student, "บอร์ดสนทนา");
      await student
        .getByRole("button", { name: "ตั้งกระทู้", exact: true })
        .click();
      await student
        .getByLabel("หัวข้อกระทู้", { exact: true })
        .fill("เราต้องเปรียบเทียบข้อมูลควันช่วงเวลาเดียวกันไหม? (ทดสอบระบบ)");
      await student
        .getByLabel("ข้อความ", { exact: true })
        .fill(
          "อยากชวนเปรียบเทียบข้อมูลลมกับตำแหน่งสถานี ก่อนสรุปเรื่องต้นทางควัน"
        );
      await student
        .getByRole("button", { name: "เผยแพร่กระทู้", exact: true })
        .click();
      await expect(student.locator(".board-original h2")).toBeVisible();
      threadId = new URL(student.url()).searchParams.get("thread");
      await admin.goto(`${base}/app?screen=discussions&thread=${threadId}`);
      await expect(admin.locator(".board-original h2")).toContainText(
        "เปรียบเทียบข้อมูลควัน"
      );
      await admin
        .getByLabel("คำตอบของคุณ", { exact: true })
        .fill("ควรเทียบช่วงเวลาเดียวกัน และระบุว่าข้อมูลมาจากสถานีใด");
      await admin
        .getByRole("button", { name: "ส่งคำตอบ", exact: true })
        .click();
      await expect(admin.locator(".board-reply")).toHaveCount(1);
      await student
        .getByRole("button", { name: "รีเฟรชบอร์ด", exact: true })
        .click();
      await expect(student.locator(".board-reply")).toContainText(
        "ข้อมูลมาจากสถานีใด"
      );
      await snapshot(student, "school-board-mobile");
      await snapshot(admin, "school-board-desktop");
      await admin
        .getByRole("button", { name: "ลบกระทู้ของฉัน", exact: true })
        .click();
      await admin
        .locator(".board-delete-confirm")
        .getByRole("button", { name: "ลบ", exact: true })
        .click();
      await expect(admin.locator(".board-list")).toBeVisible();
      threadId = null;
    }
  );
  await check(
    "student cannot use admin APIs and AI setup is explicit instead of fabricated answers",
    async () => {
      const forbidden = await studentContext.request.get(
        base + "/api/school/users"
      );
      if (forbidden.status() !== 403)
        throw new Error("Student read user management");
      await nav(admin, "ตั้งค่า AI");
      await expect(
        admin.getByRole("heading", { name: "ตั้งค่า AI", exact: true })
      ).toBeVisible();
      await snapshot(admin, "school-ai-settings-desktop");
      await nav(student, "ถาม AI");
      const chat = student.locator(".eco-chat").first();
      await chat
        .getByRole("textbox", { name: "คำถามถึง Eco AI" })
        .fill("PM2.5 หมายถึงอะไร?");
      const pending = student.waitForResponse((r) =>
        r.url().endsWith("/api/school/chat")
      );
      await chat.getByRole("button", { name: "ส่งคำถาม", exact: true }).click();
      const response = await pending;
      if (response.status() === 503)
        await expect(student.getByRole("alert")).toContainText("API key");
      else if (response.status() !== 200)
        throw new Error("Chat unexpected status " + response.status());
    }
  );
  await check(
    "responsive authenticated teacher/student screens at 13 viewport sizes",
    async () => {
      for (const [width, height] of [
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
      ]) {
        for (const [page, role, screen] of [
          [admin, "admin", "members"],
          [student, "student", "cases"],
        ]) {
          await page.setViewportSize({ width, height });
          await page.goto(`${base}/app?screen=${screen}`);
          await expect(page.locator(".learning-topbar")).toBeVisible();
          const overflow = await page.evaluate(() => ({
            page: document.documentElement.scrollWidth > innerWidth + 1,
            controls: [
              ...document.querySelectorAll(".learning-topbar button"),
            ].filter((e) => {
              const r = e.getBoundingClientRect();
              return r.width && (r.left < 0 || r.right > innerWidth + 1);
            }).length,
          }));
          if (overflow.page || overflow.controls)
            throw new Error(`Responsive overflow ${width} ${role}`);
        }
        checks.push({ width, height, passed: true });
      }
      await admin.setViewportSize({ width: 1440, height: 900 });
      await admin.goto(base + "/app?screen=members");
      await student.setViewportSize({ width: 390, height: 844 });
      await student.goto(base + "/app?screen=cases");
    }
  );
  await check("admin grants teacher and admin roles, revokes old sessions and restores student access", async () => {
    const row = admin.locator(".school-user-row").filter({hasText: qa.studentUsername});
    const role = row.getByRole("combobox");
    await role.selectOption("teacher");
    await expect(role).toHaveValue("teacher");
    await expect(role).toBeEnabled();
    const old = await studentContext.request.get(base + "/api/school/data");
    if(old.status() !== 401) throw new Error("Role change did not revoke prior session");
    await login(student,qa.studentUsername,qa.studentPassword);
    await expect(student.getByRole("heading",{name:"ภาพรวมการสอน",exact:true})).toBeVisible();
    await nav(student,"นักเรียน");
    await expect(student.getByRole("heading",{name:"นักเรียนในห้องเรียน",exact:true})).toBeVisible();
    if((await studentContext.request.get(base + "/api/school/settings")).status() !== 403) throw new Error("Teacher accessed admin settings");
    admin.once("dialog", dialog=>dialog.accept());
    await role.selectOption("admin");
    await expect(role).toHaveValue("admin");
    await expect(role).toBeEnabled();
    await login(student,qa.studentUsername,qa.studentPassword);
    await expect(student.getByRole("heading",{name:"ภาพรวมการสอน",exact:true})).toBeVisible();
    await nav(student,"ตั้งค่า AI");
    await expect(student.getByRole("heading",{name:"ตั้งค่า AI",exact:true})).toBeVisible();
    await role.selectOption("student");
    await expect(role).toHaveValue("student");
    await expect(role).toBeEnabled();
    await login(student,qa.studentUsername,qa.studentPassword);
    await expect(student.locator(".native-catalog-view h1")).toBeVisible();
  });
  await check("logout revokes the actual cookie session", async () => {
    await student
      .getByRole("button", { name: "บัญชีของฉัน", exact: true })
      .click();
    await student
      .getByRole("button", { name: "ออกจากระบบ", exact: true })
      .click();
    await expect(
      student.getByRole("heading", { name: "เข้าสู่ห้องเรียน", exact: true })
    ).toBeVisible();
    const response = await studentContext.request.get(
      base + "/api/school/data"
    );
    if (response.status() !== 401)
      throw new Error("Logged-out session still active");
  });
  if (errors.length) throw new Error("Browser errors: " + errors.join("; "));
} catch (error) {
  console.error("School QA failed:", String(error.message).slice(0, 800));
  process.exitCode = 1;
} finally {
  if (threadId)
    await adminContext.request
      .delete(`${base}/api/discussions/${threadId}`, {
        headers: { Origin: origin },
      })
      .catch(() => {});
  await writeFile(
    new URL("school-app-qa.json", out),
    JSON.stringify(
      { url: base, checks, browserErrors: errors, liveGeminiTested: false },
      null,
      2
    ) + "\n"
  );
  await browser.close();
}
