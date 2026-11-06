import test from "node:test";
import assert from "node:assert/strict";
import {answerFromSources} from "../../cloudflare/school-openai.mjs";
const source={title:"evidence.pdf",text:"Chiang Mai PM2.5 measured 63 micrograms.",page:2};
test("GPT answers cannot cite a nonexistent source or fabricated quote",async t=>{
 let citation={source:9,quote:"Chiang Mai"};
 t.mock.method(globalThis,"fetch",async()=>Response.json({status:"completed",output:[{content:[{type:"output_text",text:JSON.stringify({answer:"63",insufficient:false,citations:[citation]})}]}]}));
 await assert.rejects(()=>answerFromSources({apiKey:"test",model:"gpt-6-luna"},"PM2.5?",[source]),/อ้างอิง/);
 citation={source:1,quote:"made up measurement"};
 await assert.rejects(()=>answerFromSources({apiKey:"test",model:"gpt-6-luna"},"PM2.5?",[source]),/อ้างอิง/);
});
test("incomplete provider output never becomes an answer",async t=>{
 t.mock.method(globalThis,"fetch",async()=>Response.json({status:"incomplete",output:[]}));
 await assert.rejects(()=>answerFromSources({apiKey:"test",model:"gpt-6-luna"},"PM2.5?",[source]),/ไม่ครบ/);
});
