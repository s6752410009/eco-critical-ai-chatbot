import { useState } from "react";
import { ChevronDown, FileText, LoaderCircle } from "lucide-react";
export default function LessonDocuments({
  documents,
  classroom,
  lesson,
  school,
}) {
  const [active, setActive] = useState(null),
    [files, setFiles] = useState({});
  const available = documents.filter(
    (doc) =>
      doc.classroomId === classroom.id &&
      (!doc.lessonId || doc.lessonId === lesson.id) &&
      doc.status === "ready"
  );
  async function open(doc) {
    if (active === doc.id) {
      setActive(null);
      return;
    }
    setActive(doc.id);
    if (files[doc.id]?.text !== undefined || files[doc.id]?.loading) return;
    setFiles((previous) => ({ ...previous, [doc.id]: { loading: true } }));
    try {
      const result = school
        ? await school.request(`/documents/${encodeURIComponent(doc.id)}`)
        : { document: doc };
      setFiles((previous) => ({
        ...previous,
        [doc.id]: { text: result.document.text, loading: false },
      }));
    } catch (error) {
      setFiles((previous) => ({
        ...previous,
        [doc.id]: { error: error.message, loading: false },
      }));
    }
  }
  if (!available.length) return null;
  return (
    <section className="lesson-documents" aria-label="เอกสารประกอบบทเรียน">
      <h2>
        <FileText size={20} />
        เอกสารประกอบบทเรียน
      </h2>
      <p>เปิดอ่านเนื้อหาที่ใช้ประกอบบทเรียนและคำตอบของ Eco AI</p>
      {available.map((doc) => (
        <article key={doc.id}>
          <button
            type="button"
            className="lesson-document-toggle"
            aria-expanded={active === doc.id}
            onClick={() => open(doc)}
          >
            <FileText size={18} />
            <span>{doc.name}</span>
            <ChevronDown size={18} />
          </button>
          {active === doc.id && (
            <div
              className="lesson-document-content"
              role="region"
              aria-label={`เนื้อหาไฟล์ ${doc.name}`}
              tabIndex={0}
            >
              {files[doc.id]?.loading ? (
                <p role="status">
                  <LoaderCircle size={16} className="spin" /> กำลังเปิดเอกสาร…
                </p>
              ) : files[doc.id]?.error ? (
                <p role="alert">{files[doc.id].error}</p>
              ) : (
                <p>{files[doc.id]?.text}</p>
              )}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
