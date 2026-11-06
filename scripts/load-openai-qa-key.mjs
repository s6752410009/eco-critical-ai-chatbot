// Read only this application's encrypted key for explicitly requested live QA.
// Never log key material; no credential is written to the repository or report.
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
export async function loadOpenaiQaKey(){
  const root=fileURLToPath(new URL("../",import.meta.url));
  let stdout;
  try {
    ({stdout}=await promisify(execFile)(process.execPath,[root+"frontend/node_modules/wrangler/bin/wrangler.js","d1","execute","eco-critical-discussions","--remote","--json","--command","SELECT value FROM school_settings WHERE key='openai_key'"],{cwd:root+"cloudflare/pages",maxBuffer:1024*1024,env:{...process.env,WRANGLER_SEND_METRICS:"false"}}));
  }catch{throw new Error("Cannot read this application's OpenAI configuration for live QA");}
  const row=JSON.parse(stdout)[0]?.results?.[0];
  if(!row?.value)throw new Error("OpenAI key has not been saved in the application's settings yet");
  const {APP_SECRET}=JSON.parse(await readFile(root+".classroom-local/cloudflare-secrets.json","utf8"));
  const encoder=new TextEncoder();
  const key=await crypto.subtle.importKey("raw",await crypto.subtle.digest("SHA-256",encoder.encode("eco-settings-v1:"+APP_SECRET)),"AES-GCM",false,["decrypt"]);
  const item=JSON.parse(row.value);
  try{return new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:new Uint8Array(item.iv)},key,new Uint8Array(item.value)));}
  catch{throw new Error("Stored application key could not be decrypted for live QA");}
}
