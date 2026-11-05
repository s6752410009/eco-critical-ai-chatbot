import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LoaderCircle, RefreshCw } from "lucide-react";
import PrivateRoute from "@/components/PrivateRoute";
import Main from "@/pages/Main";
import { classroomRequest } from "./api";
export default function LiveEntry() {
  const [online, setOnline] = useState(null);
  const check = useCallback(async () => {
    setOnline(null);
    try {
      const result = await classroomRequest("/ping");
      setOnline(result.online === true);
    } catch {
      setOnline(false);
    }
  }, []);
  useEffect(() => {
    check();
  }, [check]);
  if (online) return <PrivateRoute Component={Main} />;
  return (
    <div className="learning-app">
      <main className="live-setup">
        <span className="live-badge">ระบบจริง</span>
        <h1>
          {online === null
            ? "กำลังตรวจการเชื่อมต่อ…"
            : "ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์"}
        </h1>
        <p>
          {online === null
            ? "กำลังตรวจ backend ของห้องเรียน"
            : "โหมดนี้ต้องมี AnythingLLM server, document collector และการตั้งค่า Gemini ก่อน จึงจะเข้าสู่บัญชีและใช้ RAG จริงได้"}
        </p>
        {online === null ? (
          <LoaderCircle size={24} className="spin" />
        ) : (
          <button className="button" onClick={check}>
            <RefreshCw size={17} />
            ตรวจสอบอีกครั้ง
          </button>
        )}
        <Link className="text-button" to="/demo">
          <ArrowLeft size={17} />
          กลับไปทดลองใน Demo Mode
        </Link>
      </main>
    </div>
  );
}
