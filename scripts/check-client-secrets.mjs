import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const target=path.resolve(process.argv[2] || "frontend/dist");
const canary="eco_build_secret_must_not_ship_7f2b";
async function walk(directory){for(const file of await readdir(directory,{withFileTypes:true})){const name=path.join(directory,file.name);if(file.isDirectory())await walk(name);else if(/\.(js|css|html|json)$/.test(file.name)){if((await readFile(name,"utf8")).includes(canary))throw new Error(`Build secret canary leaked into ${name}`);}}}
await walk(target);console.log("PASS build environment canary absent from client assets");
