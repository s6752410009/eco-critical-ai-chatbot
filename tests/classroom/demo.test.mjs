import test from "node:test";
import assert from "node:assert/strict";
import { makeSeed, retrieve, chunkText, readDemo, saveDemo, migrateDemo } from "../../frontend/src/pages/Classroom/data.js";
test("demo includes one geography classroom, historical cases and four supporting topics and valid lesson/document relationships", () => {
  const data=makeSeed();assert.equal(data.classrooms.length,1);assert.equal(new Set(data.lessons.map((lesson)=>lesson.topic)).size,4);
  for(const classroom of data.classrooms) for(const id of classroom.lessonIds) assert.ok(data.lessons.find((lesson)=>lesson.id===id));
  for(const doc of data.documents) {assert.ok(data.classrooms.find((classroom)=>classroom.id===doc.classroomId));assert.ok(doc.chunks.length);}
});
test("demo retrieval returns only matching teacher text with real section identifiers", () => {
  const data=makeSeed();const found=retrieve(data.documents,"PM2.5 ส่งผลต่อร่างกายอย่างไร","eco-m5","air-1");
  assert.ok(found.length);for(const source of found){assert.match(source.section,/ส่วนที่/);assert.equal(source.page,undefined);assert.ok(data.documents.find((doc)=>doc.id===source.documentId).text.includes(source.text));}
});
test("retrieval cannot cross classroom or lesson boundaries", () => {
  const data=makeSeed();assert.deepEqual(retrieve(data.documents,"PM2.5","eco-m6"),[]);assert.deepEqual(retrieve(data.documents,"PM2.5","eco-m5","water-1"),[]);
  assert.deepEqual(retrieve(data.documents,"สมการควอนตัม","eco-m5"),[]);
});
test("classroom-wide uploads are included in a lesson but remain class-scoped", () => {
  const documents=[{id:"upload",name:"real-upload.txt",classroomId:"private",lessonId:null,status:"ready",chunks:chunkText("เฉพาะเอกสารทดสอบเบต้า หมายถึงเนื้อหาที่อัปโหลดจริง") }];
  assert.ok(retrieve(documents,"ทดสอบเบต้า","private","lesson-1").length);
  assert.equal(retrieve(documents,"ทดสอบเบต้า","other","lesson-1").length,0);
});
test("pending and removed documents cannot be cited", () => {
  const doc=makeSeed().documents[0];assert.equal(retrieve([{...doc,status:"processing"}],"PM2.5","eco-m5").length,0);assert.equal(retrieve([],"PM2.5","eco-m5").length,0);
});
test("demo storage preserves actual progress and uploads and recovers corrupt state", () => {
  const map=new Map();const storage={getItem:key=>map.get(key),setItem:(key,value)=>map.set(key,value)};
  const state=makeSeed();state.progress["eco-m5:air-1"]={percent:100};saveDemo(state,storage);assert.equal(readDemo(storage).progress["eco-m5:air-1"].percent,100);
  storage.setItem("eco-critical-demo-v2","invalid json");assert.equal(readDemo(storage).classrooms.length,1);
});

test("old demo merges classrooms while retaining uploads, custom lessons and best progress", () => {
 const seed=makeSeed();const old={...seed,version:2,classrooms:[{id:"eco-m5",lessonIds:["air-1"]},{id:"eco-m6",lessonIds:["custom"]}],lessons:[...seed.lessons,{id:"custom",title:"ครูเพิ่มเอง"}],documents:[...seed.documents,{id:"upload-keep",classroomId:"eco-m6",text:"เอกสารครู",chunks:[]}],progress:{"eco-m5:air-1":{percent:20},"eco-m6:air-1":{percent:100}},lastLesson:{classroomId:"eco-m6",lessonId:"custom"}};
 const value=migrateDemo(old);assert.equal(value.classrooms.length,1);assert.equal(value.classrooms[0].name,"ภูมิศาสตร์ มัธยมศึกษาตอนปลาย");assert.ok(value.classrooms[0].lessonIds.includes("custom"));assert.equal(value.documents.find(d=>d.id==="upload-keep").classroomId,"eco-m5");assert.equal(value.progress["eco-m5:air-1"].percent,100);assert.equal(value.lastLesson.classroomId,"eco-m5");assert.deepEqual(migrateDemo(value),value);
});
test("six chronological dust/smoke cases have primary references and searchable teaching documents",()=>{
 const value=makeSeed();const cases=value.lessons.filter(l=>l.caseStudyId);assert.equal(cases.length,6);assert.ok(cases.some(l=>l.id==="thailand-2026"));for(const lesson of cases){assert.match(lesson.reference,/^https:/);assert.ok(value.documents.some(d=>d.lessonId===lesson.id&&d.text.includes(lesson.reference)));}
 assert.ok(retrieve(value.documents,"ลอนดอน ถ่านหิน อุณหภูมิผกผัน","eco-m5","london-1952").length);
});
