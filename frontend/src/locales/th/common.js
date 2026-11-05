import English from "../en/common";
export default {
  ...English,
  profile_settings: { ...English.profile_settings, account: "ตั้งค่าบัญชี", support: "ติดต่อผู้ดูแล", signout: "ออกจากระบบ" },
  common: { ...English.common, "workspaces-name": "ชื่อห้องเรียน", saving: "กำลังบันทึก…", saved: "บันทึกแล้ว", save: "บันทึกการเปลี่ยนแปลง", search: "ค้นหา", loading: "กำลังโหลด", refresh: "โหลดใหม่", noResults: "ไม่พบข้อมูล", yes: "ใช่", no: "ไม่", next: "ถัดไป", previous: "ก่อนหน้า" },
  home: { ...English.home, chooseWorkspace: "เลือกห้องเรียนเพื่อเริ่มทบทวน", notAssigned: "ยังไม่มีห้องเรียนที่ได้รับมอบหมาย กรุณาติดต่อคุณครู" },
  "new-workspace": { title: "สร้างห้องเรียน", placeholder: "มลพิษและสิ่งแวดล้อม" },
  "workspaces—settings": { general: "ตั้งค่าทั่วไป", chat: "ตั้งค่า AI", vector: "ดัชนีบทเรียน", members: "สมาชิก", agent: "ตั้งค่าเครื่องมือ" },
  login: { ...English.login, "sign-in": "เข้าสู่ระบบ {{appName}} ด้วยบัญชีของคุณ", "multi-user": { ...English.login["multi-user"], welcome: "ยินดีต้อนรับ", "placeholder-username": "ชื่อผู้ใช้", "placeholder-password": "รหัสผ่าน", login: "เข้าสู่ระบบ", validating: "กำลังตรวจสอบ…", "forgot-pass": "ลืมรหัสผ่าน" } },
  chat: { ...English.chat, mode: { ...English.chat.mode, title: "โหมดการตอบคำถาม", query: { title: "อ้างอิงบทเรียน", description: "ตอบเมื่อพบข้อมูลในเอกสารบทเรียนที่เกี่ยวข้องเท่านั้น ตรวจสอบแหล่งอ้างอิงทุกครั้ง" } } },
  chat_window: { ...English.chat_window, attachments_processing: "กำลังประมวลผลไฟล์…", generating_response: "กำลังเรียบเรียงคำตอบ", response_failed: "ยังตอบคำถามไม่ได้ กรุณาลองอีกครั้ง", response_failed_reason: "สาเหตุ: {{reason}}", send_message: "ถามจากบทเรียนของคุณครู…", attach_file: "แนบไฟล์ในบทสนทนา", send: "ส่งคำถาม", copy: "คัดลอก", regenerate: "ตอบใหม่", good_response: "คำตอบมีประโยชน์", sources: "แหล่งอ้างอิงจากบทเรียน", source_count_one: "{{count}} แหล่งอ้างอิง", source_count_other: "{{count}} แหล่งอ้างอิง", document: "เอกสาร", cancel: "ยกเลิก", submit: "ยืนยัน", save: "บันทึก", stop_generating: "หยุดตอบ", see_more: "แสดงเพิ่มเติม", see_less: "ย่อข้อความ" },
  connectors: { ...English.connectors, upload: { ...English.connectors.upload, "privacy-notice": "ไฟล์ถูกประมวลผลบนเซิร์ฟเวอร์ และเนื้อหาที่เกี่ยวข้องจะส่งไปยังผู้ให้บริการ AI ที่ตั้งค่าไว้ เช่น Gemini หลีกเลี่ยงข้อมูลส่วนบุคคล" } },
};
