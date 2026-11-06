import { chromium, expect } from "../frontend/node_modules/@playwright/test/index.mjs";
import {readFile,writeFile,mkdir} from "node:fs/promises";
const base=process.env.CLASSROOM_QA_URL,origin=new URL(base).origin;
if(!["127.0.0.1","localhost"].includes(new URL(base).hostname))throw Error("Live OCR QA content must stay in isolated local D1");
const qa=JSON.parse(await readFile(process.env.ECO_QA_FIXTURE,"utf8"));
const out=new URL("../artifacts/classroom/ocr/",import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:"chrome",headless:true});
const teacher=await browser.newPage({viewport:{width:1440,height:900}}), student=await browser.newPage({viewport:{width:390,height:844}}), fixture=await browser.newPage({viewport:{width:1000,height:700}});
const checks=[],errors=[];
for(const page of [teacher,student])page.on("pageerror",error=>errors.push(error.message));
async function api(page,path,body){
 const response=await page.request.fetch(base+"/api/school"+path,{method:body ? "POST":"GET",headers:{Origin:origin},timeout:120000,...(body ? {data:body}:{})});
 const result=await response.json();if(!response.ok())throw Error(path+": "+result.error);return result;
}
async function login(page,username,password){
 await page.goto(base+"/login");await page.getByLabel("ชื่อผู้ใช้",{exact:true}).fill(username);await page.getByLabel("รหัสผ่าน",{exact:true}).fill(password);
 await page.getByRole("button",{name:"เข้าสู่ระบบ",exact:true}).click();await expect(page.locator(".learning-topbar")).toBeVisible();
}
async function screenshot(page,name){await page.screenshot({path:new URL(name+".png",out).pathname});}
async function textImage(text){
 await fixture.setContent(`<html lang="th"><meta charset="utf-8"><body style="margin:0;background:white;font:30px -apple-system,sans-serif;color:#152735"><main style="padding:55px;line-height:1.8"><h1 style="font-size:40px">ข้อมูลสำหรับทดสอบระบบ</h1><p>${text}</p><p>ข้อมูลสมมติสำหรับทดสอบ ไม่ใช่ค่าคุณภาพอากาศจริง</p></main></body></html>`);
 await fixture.evaluate(()=>document.fonts.ready);return fixture.screenshot();
}
async function upload(file){
 await teacher.goto(base+"/app?screen=knowledge&class=eco-m5");
 await teacher.getByLabel("เชื่อมกับบทเรียน").selectOption("air-1");
 await teacher.getByLabel("อัปโหลดเอกสารการสอน").setInputFiles(file);
 const row=teacher.locator(".knowledge-list tr").filter({hasText:file.name});
 await expect(row).toBeVisible({timeout:120000});
 const data=(await api(teacher,"/data")).data;
 const doc=data.documents.find(d=>d.name===file.name);
 if(!doc?.extractionId || doc.ocrStatus!=="ready")throw Error("OCR was not persisted: "+(doc?.ocrError || "missing record"));
 console.log("PASS OCR",file.name,doc.pages.length,"pages");
 return doc;
}
async function ask(question,doc,expected,pageNumber){
 await student.goto(base+"/app?screen=chat&class=eco-m5");
 const chat=student.locator(".eco-chat").first();
 const pending=student.waitForResponse(r=>r.url().endsWith("/api/school/chat")&&r.request().method()==="POST",{timeout:120000});
 await chat.locator("textarea").fill(question);await chat.getByRole("button",{name:"ส่งคำถาม",exact:true}).click();
 const response=await pending,result=await response.json();
 if(!response.ok())throw Error(result.error);
 if(!result.answer.includes(expected))throw Error("GPT answer omitted expected measurement");
 const index=result.sources.findIndex(source=>source.documentId===doc.id && source.page===pageNumber);
 if(index<0)throw Error("GPT cited the wrong document/page");
 const source=result.sources[index];
 if(!doc.pages.find(p=>p.page===pageNumber)?.text.includes(source.quote))throw Error("Quote differs from persisted OCR");
 await screenshot(student,"messenger-mobile");
 await student.setViewportSize({width:1440,height:900});
 await screenshot(student,"messenger-desktop");
 await student.setViewportSize({width:390,height:844});
 await chat.locator(".message-sources").last().getByRole("button").nth(index).click();
 await expect(chat.getByLabel("รายละเอียดแหล่งอ้างอิง")).toContainText(`หน้า ${pageNumber}`);
 const original=await student.request.get(base+source.originalUrl);
 if(!original.ok())throw Error("Student cannot open original citation");
 await screenshot(student,`citation-${doc.type.toLowerCase()}-${pageNumber}`);
 await student.keyboard.press("Escape");
 await expect(chat.getByLabel("รายละเอียดแหล่งอ้างอิง")).toHaveCount(0);
 checks.push({file:doc.name,model:result.model,page:pageNumber,answer:result.answer,quote:source.quote,passed:true});
}
try{
 await login(teacher,qa.username,qa.password);
 await api(teacher,"/settings/test",{});console.log("PASS live GPT connection from built handler");
 const username="ocr_"+Math.random().toString(36).slice(2,10);
 const registered=await api(student,"/auth/register",{username,displayName:"ผู้เรียนทดสอบ OCR",password:qa.studentPassword});
 const approved=await teacher.request.post(base+"/api/school/users/"+registered.user.id,{headers:{Origin:origin},data:{status:"active"}});
 if(!approved.ok())throw Error("Could not approve isolated QA student");
 await student.goto(base+"/app");await expect(student.locator(".learning-topbar")).toBeVisible();
 const photo=await textImage("สถานีสายลม รหัส SL3701 ตรวจวัด PM2.5 ได้ 37 ไมโครกรัมต่อลูกบาศก์เมตร วันที่ 15 มกราคม 2026");
 await writeFile(new URL("thai-image.png",out),photo);
 const imageDoc=await upload({name:"ocr-thai-image.png",mimeType:"image/png",buffer:photo});
 if(!imageDoc.pages[0].text.includes("37") || !imageDoc.pages[0].text.includes("สายลม"))throw Error("Thai image OCR incorrect");
 await ask("สถานีสายลม SL3701 ตรวจวัด PM2.5 ได้เท่าไร",imageDoc,"37",1);
 await fixture.setContent(`<meta charset="utf-8"><style>@page{size:A4;margin:22mm}body{font:22px -apple-system,sans-serif;line-height:1.8}section{break-after:page}section:last-child{break-after:auto}</style><section><h1>รายงานสถานีแสงดาว</h1><p>ข้อมูลสมมติสำหรับทดสอบระบบเท่านั้น</p><p>การอ่านค่าต้องตรวจสอบวัน เวลา และหน่วย</p></section><section><h1>ผลตรวจวัด</h1><p>สถานีแสงดาว รหัส SD6302 ตรวจวัด PM2.5 ได้ 63 ไมโครกรัมต่อลูกบาศก์เมตร วันที่ 16 มกราคม 2026</p></section>`);
 await fixture.evaluate(()=>document.fonts.ready);
 const pdf=await fixture.pdf({format:"A4",printBackground:true});await writeFile(new URL("text-two-pages.pdf",out),pdf);
 const pdfDoc=await upload({name:"ocr-text-two-pages.pdf",mimeType:"application/pdf",buffer:pdf});
 if(pdfDoc.pages.length!==2 || !pdfDoc.pages[1].text.includes("63"))throw Error("PDF page extraction incorrect");
 await teacher.getByRole("button",{name:"ดู ocr-text-two-pages.pdf",exact:true}).click();
 await expect(teacher.getByRole("dialog",{name:"ตัวอย่างเอกสาร"})).toContainText("หน้า 2");
 await screenshot(teacher,"pdf-preview-desktop");await teacher.setViewportSize({width:390,height:844});await screenshot(teacher,"pdf-preview-mobile");await teacher.keyboard.press("Escape");
 await teacher.setViewportSize({width:1440,height:900});
 await ask("สถานีแสงดาว SD6302 ตรวจวัด PM2.5 ได้เท่าไร",pdfDoc,"63",2);
 const scan1=await textImage("รายงานสถานีลานฟ้า ข้อมูลสมมติสำหรับการทดสอบระบบ");
 const scan2=await textImage("สถานีลานฟ้า รหัส LF8203 ตรวจวัด PM2.5 ได้ 82 ไมโครกรัมต่อลูกบาศก์เมตร วันที่ 17 มกราคม 2026");
 await fixture.setContent(`<style>@page{size:A4;margin:12mm}body{margin:0}section{break-after:page}section:last-child{break-after:auto}img{width:100%}</style><section><img src="data:image/png;base64,${scan1.toString("base64")}"></section><section><img src="data:image/png;base64,${scan2.toString("base64")}"></section>`);
 await fixture.waitForFunction(()=>[...document.images].every(image=>image.complete));
 const scanned=await fixture.pdf({format:"A4",printBackground:true});await writeFile(new URL("scan-two-pages.pdf",out),scanned);
 const scanDoc=await upload({name:"ocr-scan-two-pages.pdf",mimeType:"application/pdf",buffer:scanned});
 if(scanDoc.pages.length!==2 || !scanDoc.pages[1].text.includes("82"))throw Error("Scanned PDF OCR/page incorrect");
 await ask("สถานีลานฟ้า LF8203 ตรวจวัด PM2.5 ได้เท่าไร",scanDoc,"82",2);
 await student.goto(base+"/app?screen=lesson&class=eco-m5&lesson=air-1");
 await student.getByRole("button",{name:"ocr-scan-two-pages.pdf",exact:true}).click();
 await expect(student.getByRole("region",{name:"เนื้อหาไฟล์ ocr-scan-two-pages.pdf",exact:true})).toContainText("82");
 await screenshot(student,"student-ocr-reader-mobile");
 const unrelated=await api(student,"/chat",{question:"สูตรพุดดิ้งวานิลลา",lessonId:"air-1"});
 if(unrelated.sources.length || unrelated.model)throw Error("Unsupported topic should not invoke model or cite unrelated content");
 checks.push({case:"unrelated query refusal",passed:true});
 if(errors.length)throw Error(errors.join(";"));
 console.log("PASS live GPT: Thai image, text PDF, scanned PDF, original downloads and page-specific answers from another account");
}catch(error){console.error("LIVE OCR QA FAILED:",String(error.message).split("Call log:")[0].slice(0,500));process.exitCode=1;}
finally{await writeFile(new URL("live-results.json",out),JSON.stringify({model:"gpt-6-luna",liveProviderTested:true,checks,errors},null,2));await browser.close();}
