import test from "node:test";
import assert from "node:assert/strict";
import { makeSeed, retrieve, chunkText, readDemo, saveDemo } from "../../frontend/src/pages/Classroom/data.js";
test("demo includes two classrooms, four visual topics and valid lesson/document relationships", () => {
  const data=makeSeed();assert.equal(data.classrooms.length,2);assert.equal(new Set(data.lessons.map((lesson)=>lesson.topic)).size,4);
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
  storage.setItem("eco-critical-demo-v2","invalid json");assert.equal(readDemo(storage).classrooms.length,2);
});
