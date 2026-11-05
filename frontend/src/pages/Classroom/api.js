import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

// Unlike the general upstream models, this view must distinguish a failed request
// from a successful empty classroom list.
export async function classroomRequest(
  path,
  { method = "GET", body, signal } = {}
) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...baseHeaders(),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal,
  });
  if (!response.ok) {
    if ([401, 403].includes(response.status))
      throw new Error("เซสชันหมดอายุหรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบอีกครั้ง");
    throw new Error("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
  }
  return response.json();
}

export async function uploadLesson(slug, file, onStage) {
  const form = new FormData();
  form.append("file", file, file.name);
  onStage(`กำลังอ่านไฟล์ ${file.name}`);
  const response = await fetch(
    `${API_BASE}/workspace/${encodeURIComponent(slug)}/upload`,
    {
      method: "POST",
      headers: baseHeaders(),
      body: form,
    }
  );
  const result = await response.json();
  if (!response.ok || !result.success)
    throw new Error(result.error || "อ่านเอกสารไม่สำเร็จ");
  const adds = result.documents?.map((doc) => doc.location) || [];
  if (!adds.length)
    throw new Error(
      "ระบบอ่านไฟล์แล้ว แต่ไม่พบเนื้อหาให้สร้างดัชนี กรุณาตรวจสอบเอกสาร"
    );
  onStage(`กำลังสร้างดัชนีบทเรียน ${file.name}`);
  const embedded = await classroomRequest(
    `/workspace/${encodeURIComponent(slug)}/update-embeddings`,
    {
      method: "POST",
      body: { adds },
    }
  );
  if (embedded.message) throw new Error(embedded.message);
  if (!embedded.workspace)
    throw new Error("ยังไม่สามารถยืนยันการบันทึกบทเรียนได้");
  // With the configured Gemini embedder the endpoint completes synchronously.
  // Native embedding may queue a background task; never label it ready early.
  const available = new Set(
    (embedded.workspace.documents || []).map((doc) => doc.docpath)
  );
  return {
    workspace: embedded.workspace,
    ready: adds.every((path) => available.has(path)),
  };
}
