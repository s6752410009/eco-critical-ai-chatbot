// End-to-end tests exercise the running public demo without API interception.
// Live Gemini/RAG is separately configured; no test here claims live AI.
import { chromium, expect } from "../frontend/node_modules/@playwright/test/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
const url=process.env.CLASSROOM_QA_URL || "http://127.0.0.1:3410";
const out=new URL("../artifacts/classroom/",import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CLASSROOM_QA_BROWSER==="chromium"?{}:{channel:"chrome"})});
const context=await browser.newContext({viewport:{width:1440,height:900},locale:"th-TH",reducedMotion:"reduce"});
const page=await context.newPage();const errors=[];const checks=[];
page.on("pageerror",error=>errors.push(error.message));
async function check(name,fn){await fn();checks.push({name,passed:true});console.log(`PASS ${name}`);}
async function nav(label){await page.locator(".learning-sidebar").getByRole("button",{name:label,exact:true}).click();}
async function ask(question){const chat=page.locator(".eco-chat").first();await chat.getByRole("textbox",{name:"คำถามถึง Eco AI"}).fill(question);await chat.getByRole("button",{name:"ส่งคำถาม",exact:true}).click();await expect(chat.locator(".chat-loading")).toHaveCount(0);return chat;}
try{
  await page.goto(url+"/demo");
  await expect(page.getByRole("heading",{name:/สวัสดี, นักเรียน/})).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  await check("student dashboard has four visual modules, clear demo role and working classroom selection",async()=>{
    await expect(page.locator(".topic-card")).toHaveCount(4);await expect(page.getByLabel("ห้องเรียนที่ใช้งาน").locator("option")).toHaveCount(2);
    await page.screenshot({path:new URL("desktop.png",out).pathname,fullPage:true});
  });
  await check("suggested question prepares chat, local retrieval and clickable source details work",async()=>{
    await page.locator(".dashboard-tutor .suggested-questions").getByRole("button",{name:/PM2.5/}).click();
    await expect(page.getByRole("textbox",{name:"คำถามถึง Eco AI"})).toHaveValue("PM2.5 ส่งผลต่อร่างกายอย่างไร?");
    const chat=await ask("PM2.5 ส่งผลต่อร่างกายอย่างไร?");
    await expect(chat.locator(".chat-message.assistant")).toContainText("PM2.5");
    await chat.locator(".message-sources button").first().click();
    await expect(chat.getByRole("region",{name:"รายละเอียดแหล่งอ้างอิง"})).toContainText("ส่วนที่");
    await expect(chat).toContainText("ไม่ได้เรียก Gemini");
    await page.screenshot({path:new URL("chat-sources.png",out).pathname,fullPage:true});
    await ask("สมการควอนตัม");await expect(chat.locator(".chat-message.assistant").last()).toContainText("ยังไม่พบข้อมูลที่เพียงพอ");
  });
  await check("visual air lesson, interactive PM2.5 slider, quiz explanations and progress persistence",async()=>{
    await nav("บทเรียน");await page.locator(".topic-card.green").getByRole("button",{name:"เริ่มเรียน"}).click();
    await expect(page.getByRole("heading",{name:"มลพิษทางอากาศกับชีวิตของเรา",exact:true})).toBeVisible();
    await page.getByRole("slider").fill("85");await expect(page.locator(".pm-value strong")).toHaveText("85");
    await expect(page.locator(".pm-explorer")).toContainText("ไม่ใช่ข้อมูลเซนเซอร์สด");
    await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:new URL("air-lesson.png",out).pathname,fullPage:true});
    const questions=page.locator(".quiz-question");await questions.nth(0).locator(".quiz-options button").nth(1).click();await questions.nth(1).locator(".quiz-options button").nth(2).click();
    await expect(page.locator(".quiz-explanation")).toHaveCount(2);await page.getByRole("button",{name:"บันทึกผลและจบบทเรียน"}).click();
    await page.reload();await expect(page.locator(".visual-lesson h1")).toHaveText("มลพิษทางอากาศกับชีวิตของเรา");
    await nav("ความก้าวหน้า");await expect(page.locator(".progress-lessons article").first()).toContainText("100%");
  });
  await check("water lesson expands causal explanations and has a complete knowledge check",async()=>{
    await nav("บทเรียน");await page.locator(".topic-card.blue").getByRole("button",{name:"เริ่มเรียน"}).click();
    await page.locator(".water-chain details").first().locator("summary").click();await expect(page.locator(".water-chain details").first().locator("p")).toBeVisible();
    const questions=page.locator(".quiz-question");await questions.nth(0).locator(".quiz-options button").nth(1).click();await questions.nth(1).locator(".quiz-options button").nth(0).click();await page.getByRole("button",{name:"บันทึกผลและจบบทเรียน"}).click();
  });
  await check("waste sorting gives immediate correct and incorrect feedback",async()=>{
    await nav("บทเรียน");await page.locator(".topic-card.teal").getByRole("button",{name:"เริ่มเรียน"}).click();
    const activity=page.locator(".waste-activity");await activity.getByRole("button",{name:"อันตราย",exact:true}).click();await expect(activity).toContainText("ลองอีกครั้ง");
    await activity.getByRole("button",{name:"รีไซเคิล",exact:true}).click();await activity.locator(".item-selector button").nth(1).click();await activity.getByRole("button",{name:"อินทรีย์",exact:true}).click();await activity.locator(".item-selector button").nth(2).click();await activity.getByRole("button",{name:"อันตราย",exact:true}).click();await expect(activity).toContainText("สำเร็จ 3/3");
  });
  let newClass;
  await check("teacher creates and edits classroom, adds lesson, uploads and previews a real text document",async()=>{
    await page.getByLabel("บทบาทสาธิต").selectOption("teacher");await page.getByRole("button",{name:"สร้างห้องเรียน",exact:true}).click();
    await page.getByLabel("ชื่อห้องเรียน",{exact:true}).fill("ห้องทดสอบ Eco QA");await page.getByLabel("คำอธิบายสั้นๆ").fill("ทดสอบ flow ครูและนักเรียน");await page.getByRole("button",{name:"บันทึก",exact:true}).click();
    newClass=await page.getByLabel("ห้องเรียนที่ใช้งาน").inputValue();
    await nav("จัดการห้องเรียน");
    await page.getByRole("button",{name:"แก้ไข ห้องทดสอบ Eco QA",exact:true}).click();
    await page.getByLabel("ชื่อห้องเรียน",{exact:true}).fill("ห้องทดสอบ Eco QA ปรับปรุง");
    await page.getByRole("button",{name:"บันทึก",exact:true}).click();
    await expect(page.getByLabel("ห้องเรียนที่ใช้งาน").locator("option:checked")).toHaveText("ห้องทดสอบ Eco QA ปรับปรุง");
    await page.getByRole("button",{name:"เพิ่มบทเรียน",exact:true}).click();await page.getByLabel("ชื่อบทเรียน",{exact:true}).fill("บทเรียนเอกสารของคุณครู");await page.getByLabel("คำอธิบายสั้นๆ").fill("เนื้อหาจากไฟล์ที่ครูนำเข้า");await page.getByRole("button",{name:"บันทึก",exact:true}).click();
    await expect(page.locator(".teacher-lesson-list")).toContainText("บทเรียนเอกสารของคุณครู");
    await nav("AI Knowledge Base");await page.getByLabel("เชื่อมกับบทเรียน").selectOption({label:"บทเรียนเอกสารของคุณครู"});
    await page.getByLabel("อัปโหลดเอกสารการสอน").setInputFiles({name:"teacher-qa.txt",mimeType:"text/plain",buffer:Buffer.from("สารทดลองเบต้าในบทเรียนนี้ใช้สอนการตรวจสอบหลักฐานและการตั้งคำถามอย่างมีเหตุผล ไม่มีข้อมูลจากแหล่งภายนอก")});
    await expect(page.locator(".knowledge-list")).toContainText("teacher-qa.txt");await expect(page.locator(".knowledge-list")).toContainText("พร้อมค้นหา");
    await page.getByRole("button",{name:"ดู teacher-qa.txt",exact:true}).click();await expect(page.locator(".document-preview")).toContainText("สารทดลองเบต้า");
    await page.getByRole("button",{name:"สร้างดัชนีใหม่ teacher-qa.txt",exact:true}).click();await expect(page.getByRole("status")).toContainText("สร้างดัชนีข้อความ");
    await page.getByLabel("อัปโหลดเอกสารการสอน").setInputFiles({name:"unsupported.pdf",mimeType:"application/pdf",buffer:Buffer.from("not a parsed PDF")});await expect(page.getByRole("alert")).toContainText("โหมดสาธิตอ่าน TXT");
    await page.screenshot({path:new URL("teacher-knowledge-error.png",out).pathname,fullPage:true});
  });
  await check("teacher preview leads to student contextual retrieval of newly uploaded material",async()=>{
    await nav("เนื้อหาบทเรียน");await page.getByRole("button",{name:"ดูแบบนักเรียน",exact:true}).click();await page.getByRole("button",{name:"ดูแบบนักเรียน",exact:true}).click();
    await expect(page.getByLabel("บทบาทสาธิต")).toHaveValue("student");
    const chat=await ask("สารทดลองเบต้าใช้สอนอะไร");await expect(chat.locator(".chat-message.assistant")).toContainText("การตรวจสอบหลักฐาน");await expect(chat.locator(".message-sources")).toContainText("teacher-qa.txt");
    await page.reload();await expect(page.getByLabel("ห้องเรียนที่ใช้งาน")).toHaveValue(newClass);
    await expect(page.locator(".eco-chat").first().locator(".chat-message.assistant")).toContainText("การตรวจสอบหลักฐาน");
  });
  await check("other classrooms cannot retrieve the newly uploaded private demo content",async()=>{
    await page.getByLabel("ห้องเรียนที่ใช้งาน").selectOption("eco-m6");await nav("ถาม AI");const chat=await ask("สารทดลองเบต้า");await expect(chat.locator(".chat-message.assistant").last()).toContainText("ยังไม่พบข้อมูลที่เพียงพอ");
  });
  await check("teacher can remove a document and it stops being retrievable",async()=>{
    await page.getByLabel("บทบาทสาธิต").selectOption("teacher");await page.getByLabel("ห้องเรียนที่ใช้งาน").selectOption(newClass);await nav("AI Knowledge Base");await page.getByRole("button",{name:"นำออก teacher-qa.txt",exact:true}).click();await expect(page.locator(".knowledge-list article")).toHaveCount(0);
    await page.getByLabel("บทบาทสาธิต").selectOption("student");await nav("ถาม AI");const chat=await ask("สารทดลองเบต้า");await expect(chat.locator(".chat-message.assistant").last()).toContainText("ยังไม่พบข้อมูลที่เพียงพอ");
  });
  await check("primary student and teacher views are responsive at 390, 1024 and 1440px",async()=>{
    await page.getByLabel("ห้องเรียนที่ใช้งาน").selectOption("eco-m5");
    for(const width of [390,1024,1440]){
      await page.setViewportSize({width,height:950});
      for(const role of ["student","teacher"]){
        await page.getByLabel("บทบาทสาธิต").selectOption(role);
        for(const screen of role==="student"?["dashboard","classrooms","lessons","chat","progress"]:["dashboard","classrooms","lessons","knowledge","questions"]){
          await page.goto(`${url}/demo?screen=${screen}&class=eco-m5`);
          if(role==="teacher")await page.getByLabel("บทบาทสาธิต").selectOption("teacher");
          // Role selection navigates to its dashboard; direct navigation below preserves the mounted role.
          if(role==="teacher"&&screen!=="dashboard"){
            if(width<=760)await page.getByRole("button",{name:"เปิดเมนู",exact:true}).click();
            const labels={classrooms:"จัดการห้องเรียน",lessons:"เนื้อหาบทเรียน",knowledge:"AI Knowledge Base",questions:"คำถามนักเรียน"};await nav(labels[screen]);
          }
          const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow)throw new Error(`Overflow ${width}px ${role} ${screen}`);
        }
      }
    }
    await page.setViewportSize({width:390,height:844});await page.goto(url+"/demo");await expect(page.locator(".student-bottom-nav")).toBeVisible();await page.screenshot({path:new URL("mobile.png",out).pathname,fullPage:false});
  });
  if(errors.length)throw new Error(`Browser errors: ${[...new Set(errors)].join("; ")}`);
}finally{await writeFile(new URL("browser-qa.json",out),JSON.stringify({demoEndToEnd:true,apiIntercepted:false,liveGeminiTested:false,checks,browserErrors:errors},null,2));await browser.close();}
