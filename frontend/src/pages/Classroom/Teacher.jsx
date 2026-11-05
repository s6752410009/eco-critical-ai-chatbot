import { useState } from "react";
import {
  BookOpen,
  Check,
  Eye,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { chunkText, TOPICS } from "./data";
import Workspace from "@/models/workspace";
import { uploadLesson } from "./api";

export default function Teacher({
  screen,
  data,
  update,
  classroom,
  setClassroom,
  demo,
  openLesson,
  onCreated,
  onNotice,
}) {
  const [form, setForm] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("air");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [uploadLessonId, setUploadLessonId] = useState("");
  const [viewed, setViewed] = useState(null);
  const lessons = data.lessons.filter((lesson) =>
    classroom?.lessonIds.includes(lesson.id)
  );
  const docs = data.documents.filter(
    (doc) => doc.classroomId === classroom?.id
  );
  function begin(kind, item) {
    setForm({ kind, id: item?.id });
    setName(item?.name || item?.title || "");
    setDescription(item?.description || "");
    setTopic(item?.topic || "air");
    setError("");
  }
  async function submit(event) {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      if (form.kind === "classroom") {
        if (demo) {
          const id = form.id || crypto.randomUUID();
          update((previous) => ({
            ...previous,
            classrooms: form.id
              ? previous.classrooms.map((entry) =>
                  entry.id === id
                    ? { ...entry, name: name.trim(), description }
                    : entry
                )
              : [
                  ...previous.classrooms,
                  { id, name: name.trim(), description, lessonIds: [] },
                ],
          }));
          setClassroom(id);
          onCreated?.(id);
        } else {
          const result = form.id
            ? await Workspace.update(form.id, { name: name.trim() })
            : await Workspace.new({ name: name.trim() });
          if (!result.workspace)
            throw new Error(result.message || "บันทึกห้องเรียนไม่สำเร็จ");
          const item = {
            id: result.workspace.slug,
            name: result.workspace.name,
            description: "",
            lessonIds: [],
          };
          update((previous) => ({
            ...previous,
            classrooms: form.id
              ? previous.classrooms.map((entry) =>
                  entry.id === form.id ? item : entry
                )
              : [...previous.classrooms, item],
          }));
          setClassroom(item.id);
        }
      } else {
        const id = form.id || crypto.randomUUID();
        update((previous) => ({
          ...previous,
          lessons: form.id
            ? previous.lessons.map((entry) =>
                entry.id === id
                  ? { ...entry, title: name.trim(), description, topic }
                  : entry
              )
            : [
                ...previous.lessons,
                {
                  id,
                  title: name.trim(),
                  description,
                  topic,
                  minutes: null,
                  objectives: [],
                  concepts: [],
                  quiz: [],
                },
              ],
          classrooms: previous.classrooms.map((entry) =>
            entry.id === classroom.id && !entry.lessonIds.includes(id)
              ? { ...entry, lessonIds: [...entry.lessonIds, id] }
              : entry
          ),
        }));
      }
      setForm(null);
      onNotice("บันทึกแล้ว");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file || !classroom) return;
    setError("");
    setBusy(true);
    setStage("กำลังอ่านเอกสาร…");
    try {
      if (demo) {
        if (!/\.(txt|md)$/i.test(file.name))
          throw new Error(
            "โหมดสาธิตอ่าน TXT และ Markdown ในเบราว์เซอร์เท่านั้น PDF/DOCX ใช้ตัวประมวลผลในโหมดระบบจริง"
          );
        if (file.size > 1024 * 1024)
          throw new Error("เอกสารสาธิตต้องไม่เกิน 1 MB เพื่อเก็บในเบราว์เซอร์");
        const text = await file.text();
        const chunks = chunkText(text);
        if (!chunks.length)
          throw new Error("ไม่พบข้อความในเอกสาร กรุณาตรวจไฟล์แล้วลองอีกครั้ง");
        const document = {
          id: crypto.randomUUID(),
          name: file.name,
          text,
          chunks,
          type: file.name.toLowerCase().endsWith(".md") ? "MD" : "TXT",
          status: "ready",
          classroomId: classroom.id,
          lessonId: uploadLessonId || null,
          sample: false,
        };
        update((previous) => ({
          ...previous,
          documents: [...previous.documents, document],
        }));
        onNotice(
          `อ่านและสร้างดัชนีข้อความ ${chunks.length} ส่วนแล้ว · เก็บเฉพาะในเบราว์เซอร์ ไม่ได้ส่ง Gemini`
        );
      } else {
        const result = await uploadLesson(classroom.id, file, setStage);
        update((previous) => ({
          ...previous,
          documents: [
            ...previous.documents.filter(
              (doc) => doc.classroomId !== classroom.id
            ),
            ...(result.workspace.documents || []).map((doc) => ({
              ...doc,
              id: doc.id,
              classroomId: classroom.id,
              name: doc.filename || doc.docpath,
              type: doc.filename?.split(".").pop()?.toUpperCase() || "DOC",
              status: result.ready ? "ready" : "processing",
            })),
          ],
        }));
        onNotice(
          result.ready
            ? "สร้างดัชนีสำเร็จแล้ว"
            : "รับไฟล์แล้ว อยู่ระหว่างประมวลผล"
        );
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
      setStage("");
      event.target.value = "";
    }
  }
  async function remove(doc) {
    setError("");
    try {
      if (!demo) {
        const result = await Workspace.modifyEmbeddings(classroom.id, {
          deletes: [doc.docpath],
        });
        if (result.message || !result.workspace)
          throw new Error(result.message || "นำเอกสารออกไม่สำเร็จ");
      }
      update((previous) => ({
        ...previous,
        documents: previous.documents.filter((entry) => entry.id !== doc.id),
      }));
      onNotice(
        demo ? "นำเอกสารออกจากคลังสาธิตแล้ว" : "นำเอกสารออกจากดัชนี AI แล้ว"
      );
    } catch (failure) {
      setError(failure.message);
    }
  }
  return (
    <div className="teacher-view">
      <div className="page-heading">
        <div>
          <span className="section-kicker">พื้นที่คุณครู</span>
          <h1>
            {
              {
                dashboard: "ภาพรวมการสอน",
                classrooms: "จัดการห้องเรียน",
                lessons: "เนื้อหาบทเรียน",
                knowledge: "AI Knowledge Base",
                questions: "คำถามนักเรียน",
              }[screen]
            }
          </h1>
          <p>
            {screen === "knowledge"
              ? "เอกสารที่ใช้เป็นหลักฐานสำหรับคำตอบของ Eco AI"
              : "จัดเตรียมเนื้อหา แล้วดูประสบการณ์ที่นักเรียนจะได้รับ"}
          </p>
        </div>
        {["dashboard", "classrooms"].includes(screen) && (
          <button className="button" onClick={() => begin("classroom")}>
            <Plus size={17} />
            สร้างห้องเรียน
          </button>
        )}
        {screen === "lessons" && demo && classroom && (
          <button className="button" onClick={() => begin("lesson")}>
            <Plus size={17} />
            เพิ่มบทเรียน
          </button>
        )}
      </div>
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      {form && (
        <form className="editor-form" onSubmit={submit}>
          <div className="row-between">
            <h2>
              {form.id ? "แก้ไข" : "เพิ่ม"}
              {form.kind === "classroom" ? "ห้องเรียน" : "บทเรียน"}
            </h2>
            <button
              type="button"
              className="icon-button"
              aria-label="ปิดฟอร์ม"
              onClick={() => setForm(null)}
              disabled={busy}
            >
              <X size={19} />
            </button>
          </div>
          <label>
            {form.kind === "classroom" ? "ชื่อห้องเรียน" : "ชื่อบทเรียน"}
            <input
              autoFocus
              required
              maxLength={255}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            คำอธิบายสั้นๆ
            <textarea
              rows={2}
              maxLength={1000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          {form.kind === "lesson" && (
            <label>
              หัวข้อ
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              >
                {TOPICS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button className="button" disabled={busy || !name.trim()}>
            {busy ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <Check size={17} />
            )}
            บันทึก
          </button>
        </form>
      )}
      {["dashboard", "classrooms"].includes(screen) && (
        <div className="classroom-grid">
          {data.classrooms.map((entry) => (
            <article className="classroom-card" key={entry.id}>
              <div className="row-between">
                <span className="classroom-symbol">
                  <BookOpen size={24} />
                </span>
                <button
                  className="icon-button"
                  aria-label={`แก้ไข ${entry.name}`}
                  onClick={() => begin("classroom", entry)}
                >
                  <Pencil size={16} />
                </button>
              </div>
              <h2>{entry.name}</h2>
              <p>{entry.description || "เตรียมบทเรียนสำหรับห้องเรียนนี้"}</p>
              <div className="classroom-meta">
                {entry.lessonIds.length} บทเรียน ·{" "}
                {
                  data.documents.filter((doc) => doc.classroomId === entry.id)
                    .length
                }{" "}
                เอกสาร
              </div>
              <button
                className="button secondary"
                onClick={() => {
                  setClassroom(entry.id);
                  onCreated(entry.id);
                }}
              >
                เปิดห้องเรียน
              </button>
            </article>
          ))}
        </div>
      )}
      {screen === "lessons" && (
        <>
          <div className="section-heading">
            <h2>{classroom?.name || "เลือกห้องเรียนก่อนเพิ่มบทเรียน"}</h2>
            <span>{lessons.length} บทเรียน</span>
          </div>
          {!demo && (
            <p className="notice-panel">
              ระบบจริงใช้เอกสารใน workspace เป็นคลังบทเรียน
              การจัดหมวดบทเรียนแบบภาพในรอบนี้อยู่ในโหมดสาธิต
            </p>
          )}
          <div className="teacher-lesson-list">
            {lessons.map((lesson) => (
              <article key={lesson.id}>
                <span className={`topic-dot ${lesson.topic}`} />
                <div>
                  <small>
                    {TOPICS.find((entry) => entry.id === lesson.topic)?.title}
                  </small>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.description}</p>
                </div>
                <button
                  className="icon-button"
                  aria-label={`แก้ไขบทเรียน ${lesson.title}`}
                  onClick={() => begin("lesson", lesson)}
                >
                  <Pencil size={17} />
                </button>
                <button
                  className="button secondary"
                  onClick={() => openLesson(lesson.id)}
                >
                  <Eye size={16} />
                  ดูแบบนักเรียน
                </button>
              </article>
            ))}
          </div>
          {demo && !lessons.length && (
            <p className="empty-state">
              เพิ่มบทเรียนแรก แล้วเชื่อมเอกสารใน AI Knowledge Base
            </p>
          )}
        </>
      )}
      {screen === "knowledge" && (
        <>
          <div className="upload-workspace">
            <div>
              <Upload size={24} />
              <h2>เพิ่มเอกสารการสอน</h2>
              <p>
                {demo
                  ? "TXT, Markdown · ไม่เกิน 1 MB · ประมวลผลในเครื่อง"
                  : "PDF, DOCX, TXT, Markdown · ไม่เกิน 20 MB · ใช้ collector และ embedding จริง"}
              </p>
            </div>
            <label>
              เชื่อมกับบทเรียน
              <select
                value={uploadLessonId}
                onChange={(event) => setUploadLessonId(event.target.value)}
                disabled={!demo || busy}
              >
                <option value="">ทุกบทเรียนในห้องเรียน</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={`button upload-button ${busy ? "disabled" : ""}`}>
              {busy ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                <Plus size={17} />
              )}
              เลือกเอกสาร
              <input
                aria-label="อัปโหลดเอกสารการสอน"
                type="file"
                disabled={!classroom || busy}
                accept={demo ? ".txt,.md" : ".pdf,.docx,.txt,.md"}
                onChange={upload}
              />
            </label>
            {stage && <p role="status">{stage}</p>}
          </div>
          <div className="section-heading">
            <h2>เอกสารใน {classroom?.name || "ห้องเรียน"}</h2>
            <span>{docs.length} ไฟล์</span>
          </div>
          <div className="knowledge-list">
            {docs.map((doc) => (
              <article key={doc.id}>
                <span className="file-type">{doc.type || "TXT"}</span>
                <div>
                  <h3>{doc.name}</h3>
                  <p>
                    {data.lessons.find((lesson) => lesson.id === doc.lessonId)
                      ?.title || "ทุกบทเรียนในห้องเรียน"}
                  </p>
                  <small className="document-status">
                    <Check size={13} />
                    {doc.status === "ready"
                      ? `พร้อมค้นหา${demo ? ` · ${doc.chunks.length} ส่วนข้อความ` : ""}`
                      : "กำลังประมวลผล"}
                    {doc.sample ? " · เอกสารตัวอย่าง" : ""}
                  </small>
                </div>
                <div className="document-actions">
                  {demo && (
                    <>
                      <button
                        className="icon-button"
                        aria-label={`ดู ${doc.name}`}
                        onClick={() =>
                          setViewed(viewed?.id === doc.id ? null : doc)
                        }
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`สร้างดัชนีใหม่ ${doc.name}`}
                        onClick={() => {
                          update((previous) => ({
                            ...previous,
                            documents: previous.documents.map((entry) =>
                              entry.id === doc.id
                                ? {
                                    ...entry,
                                    chunks: chunkText(entry.text),
                                    status: "ready",
                                  }
                                : entry
                            ),
                          }));
                          onNotice("สร้างดัชนีข้อความในเบราว์เซอร์ใหม่แล้ว");
                        }}
                      >
                        <RefreshCw size={16} />
                      </button>
                    </>
                  )}
                  <button
                    className="icon-button danger"
                    aria-label={`นำออก ${doc.name}`}
                    onClick={() => remove(doc)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!docs.length && (
            <p className="empty-state">
              ยังไม่มีเอกสาร อัปโหลดไฟล์เพื่อให้ Eco AI ค้นข้อมูลได้
            </p>
          )}
          {viewed && (
            <section className="document-preview">
              <div className="row-between">
                <h2>
                  <FileText size={18} />
                  {viewed.name}
                </h2>
                <button
                  className="icon-button"
                  aria-label="ปิดตัวอย่างเอกสาร"
                  onClick={() => setViewed(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <p>{viewed.text}</p>
            </section>
          )}
        </>
      )}
      {screen === "questions" && (
        <>
          <p className="notice-panel">
            {demo
              ? "ประวัติการทดลองถามที่บันทึกในเบราว์เซอร์นี้"
              : "ดูประวัติบทสนทนาในหน้าผู้ดูแลของระบบจริง"}
          </p>
          {Object.entries(data.conversations || {}).flatMap(([key, messages]) =>
            messages
              .filter((message) => message.role === "user")
              .map((message) => (
                <article className="student-question" key={message.id}>
                  <span>คำถามจากห้องเรียนสาธิต</span>
                  <h3>{message.text}</h3>
                  <small>
                    {
                      data.classrooms.find((entry) =>
                        key.startsWith(entry.id + ":")
                      )?.name
                    }
                  </small>
                </article>
              ))
          )}
          {!Object.values(data.conversations || {}).some((messages) =>
            messages.some((message) => message.role === "user")
          ) && (
            <p className="empty-state">
              ยังไม่มีคำถาม ลองเปิดแบบนักเรียนและถาม Eco AI ก่อน
            </p>
          )}
        </>
      )}
    </div>
  );
}
