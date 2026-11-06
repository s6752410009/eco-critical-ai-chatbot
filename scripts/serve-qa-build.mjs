// Loopback-only integration harness for the exact built Worker bundle.
// Uses Node fetch for outbound live-provider tests when workerd's local egress stalls.
import {createServer} from "node:http";
import {DatabaseSync} from "node:sqlite";
import {readFile,readdir,stat} from "node:fs/promises";
import path from "node:path";
import {pathToFileURL,fileURLToPath} from "node:url";
const state=process.env.ECO_QA_DIRECTORY;
if(!state || !path.basename(state).startsWith("eco-school-qa-"))throw Error("Requires isolated QA workspace");
const root=fileURLToPath(new URL("../",import.meta.url)),dist=path.join(root,"frontend/dist-demo");
const worker=(await import(pathToFileURL(path.join(dist,"_worker.js")))).default;
const db=new DatabaseSync(path.join(state,"live-qa.sqlite"));db.exec("PRAGMA foreign_keys=ON");
for(const name of (await readdir(path.join(root,"cloudflare/migrations"))).filter(name=>name.endsWith(".sql")).sort())db.exec(await readFile(path.join(root,"cloudflare/migrations",name),"utf8"));
db.exec(await readFile(path.join(state,"qa-account.sql"),"utf8"));
const wrap=(sql,params=[])=>({bind:(...args)=>wrap(sql,args),first:async()=>db.prepare(sql).get(...params)||null,all:async()=>({results:db.prepare(sql).all(...params)}),run:async()=>({meta:{changes:Number(db.prepare(sql).run(...params).changes)}})});
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".woff2":"font/woff2",".ttf":"font/ttf"};
const env={...JSON.parse(await readFile(path.join(state,"cloudflare-secrets.json"),"utf8")),SCHOOL_AUTH_REQUIRED:"true",BOARD_DB:{prepare:sql=>wrap(sql),batch:async statements=>{db.exec("BEGIN");try{const results=[];for(const s of statements)results.push(await s.run());db.exec("COMMIT");return results;}catch(error){db.exec("ROLLBACK");throw error;}}},ASSETS:{fetch:async request=>{
 const pathname=decodeURIComponent(new URL(request.url).pathname);let file=path.resolve(dist,"."+pathname);
 if(!file.startsWith(dist+path.sep))file=path.join(dist,"index.html");
 try {if(!(await stat(file)).isFile())file=path.join(dist,"index.html");}catch{file=path.join(dist,"index.html");}
 return new Response(await readFile(file),{headers:{"Content-Type":mime[path.extname(file)] || "application/octet-stream"}});
}}};
createServer(async(req,res)=>{
 try{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const request=new Request("http://127.0.0.1:3415"+req.url,{method:req.method,headers:req.headers,...(!["GET","HEAD"].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
  const response=await worker.fetch(request,env);res.statusCode=response.status;
  for(const [name,value] of response.headers)res.setHeader(name,value);
  res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){console.error("QA request error",error.name);res.statusCode=500;res.end("QA harness error");}
}).listen(3415,"127.0.0.1",()=>console.log("Exact built Worker serving live QA on loopback"));
