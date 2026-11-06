import { extractionId } from "./school-ocr.mjs";
import { ApiError, bodyJson, requireTeacher, sameOrigin, reply } from "./school-auth.mjs";
export function imageRefs(value) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 8) throw new ApiError("เพิ่มรูปได้ไม่เกิน 8 รูปต่อบทเรียน");
  return value.map(image => {
    if (!/^[a-f0-9-]{36}$/.test(image?.id || "")) throw new ApiError("รหัสรูปไม่ถูกต้อง");
    return { id: image.id, caption: String(image.caption || "").slice(0, 500), ...(image.extractionId ? {extractionId:extractionId(image.extractionId)} : {}) };
  });
}
export async function uploadImage(request, env, user) {
  requireTeacher(user);
  sameOrigin(request);
  const input = await bodyJson(request, 720000);
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.image || "");
  if (!match) throw new ApiError("รองรับรูป JPG, PNG และ WebP เท่านั้น");
  let bytes;
  try { bytes = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0)); } catch { throw new ApiError("ไฟล์ภาพไม่ถูกต้อง"); }
  if (bytes.length > 512000) throw new ApiError("รูปหลังย่อต้องไม่เกิน 500 KB", 413);
  const signature = Array.from(bytes.slice(0, 12));
  const valid = match[1] === "jpeg" ? signature[0] === 255 && signature[1] === 216 && signature[2] === 255
    : match[1] === "png" ? [137,80,78,71,13,10,26,10].every((v,i)=>signature[i]===v)
    : String.fromCharCode(...signature.slice(0,4)) === "RIFF" && String.fromCharCode(...signature.slice(8,12)) === "WEBP";
  if (!valid) throw new ApiError("ชนิดไฟล์ไม่ตรงกับข้อมูลภาพ");
  const id = crypto.randomUUID();
  const result = await env.BOARD_DB.prepare("INSERT INTO school_images(id,mime,content,created_by,created_at) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM school_images)<1000")
    .bind(id, "image/"+match[1], match[2], user.id, Date.now()).run();
  if (!result.meta.changes) throw new ApiError("พื้นที่เก็บรูปเต็ม กรุณาติดต่อผู้ดูแล", 413);
  return reply({ image: { id, caption: "" } });
}
export async function readImage(env, id) {
  const row = await env.BOARD_DB.prepare("SELECT mime,content FROM school_images WHERE id=?").bind(id).first();
  if (!row) throw new ApiError("ไม่พบรูปภาพ", 404);
  return new Response(Uint8Array.from(atob(row.content), c=>c.charCodeAt(0)), {headers:{"Content-Type":row.mime,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
