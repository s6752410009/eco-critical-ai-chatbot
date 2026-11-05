import { useState } from "react";
import {
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
  ArrowRight,
} from "lucide-react";
import { Button as NativeButton } from "@/mentingo/components/ui/button";
import { Input as NativeInput } from "@/mentingo/components/ui/input";
import { Textarea as NativeTextarea } from "@/mentingo/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/mentingo/components/ui/table";
import { PageWrapper } from "@/mentingo/components/PageWrapper";
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
  school = null,
  openLesson,
  onCreated,
  onNotice,
}) {
  const [form, setForm] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lessonBody, setLessonBody] = useState("");
  const [quizDraft, setQuizDraft] = useState([]);
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
  async function commit(callback) {
    if (school) {
      const next = callback(data);
      await school.persist(next);
      update(() => next);
    } else update(callback);
  }
  function begin(kind, item) {
    if (busy) return;
    setForm({ kind, id: item?.id });
    setName(item?.name || item?.title || "");
    setDescription(item?.description || "");
    setTopic(item?.topic || "air");
    setLessonBody(
      (item?.concepts || []).map((c) => `${c.title}\n${c.body}`).join("\n\n")
    );
    setQuizDraft(item?.quiz ? structuredClone(item.quiz) : []);
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
          await commit((previous) => ({
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
          await commit((previous) => ({
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
        const concepts = lessonBody.trim()
          ? lessonBody
              .trim()
              .split(/\n\s*\n/)
              .map((text, index) => {
                const lines = text.trim().split("\n");
                return lines.length > 1
                  ? {
                      title: lines.shift().slice(0, 160),
                      body: lines.join("\n"),
                    }
                  : { title: `ส่วนที่ ${index + 1}`, body: text.trim() };
              })
          : [];
        const quiz = quizDraft.map((q) => ({
          ...q,
          explanation: q.explanation || "ทบทวนเนื้อหาบทเรียนแล้วลองใหม่",
        }));
        await commit((previous) => ({
          ...previous,
          lessons: form.id
            ? previous.lessons.map((entry) =>
                entry.id === id
                  ? {
                      ...entry,
                      title: name.trim(),
                      description,
                      topic,
                      concepts,
                      quiz,
                    }
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
                  concepts,
                  quiz,
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
      onNotice(school ? "บันทึกข้อมูลบนเซิร์ฟเวอร์แล้ว" : "บันทึกแล้ว");
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
            school
              ? "รองรับ TXT และ Markdown ไม่เกิน 1 MB กรุณาแปลง PDF/DOCX เป็นข้อความก่อนอัปโหลด"
              : "โหมดสาธิตอ่าน TXT และ Markdown ในเบราว์เซอร์เท่านั้น PDF/DOCX ใช้ตัวประมวลผลในโหมดระบบจริง"
          );
        if (file.size > 1024 * 1024)
          throw new Error(school ? "เอกสารต้องไม่เกิน 1 MB ต่อไฟล์" : "เอกสารสาธิตต้องไม่เกิน 1 MB เพื่อเก็บในเบราว์เซอร์");
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
        await commit((previous) => ({
          ...previous,
          documents: [...previous.documents, document],
        }));
        onNotice(
          school
            ? `บันทึกเอกสารบนเซิร์ฟเวอร์แล้ว · พร้อมค้นหา ${chunks.length} ส่วนข้อความ`
            : `อ่านและสร้างดัชนีข้อความ ${chunks.length} ส่วนแล้ว · เก็บเฉพาะในเบราว์เซอร์ ไม่ได้ส่ง Gemini`
        );
      } else {
        const result = await uploadLesson(classroom.id, file, setStage);
        await commit((previous) => ({
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
      await commit((previous) => ({
        ...previous,
        documents: previous.documents.filter((entry) => entry.id !== doc.id),
      }));
      onNotice(
        school
          ? "นำเอกสารออกจากเซิร์ฟเวอร์แล้ว"
          : demo
            ? "นำเอกสารออกจากคลังสาธิตแล้ว"
            : "นำเอกสารออกจากดัชนี AI แล้ว"
      );
    } catch (failure) {
      setError(failure.message);
    }
  }
  async function reindex(doc) {
    setError("");
    try {
      await commit((previous) => ({
        ...previous,
        documents: previous.documents.map((entry) =>
          entry.id === doc.id
            ? { ...entry, chunks: chunkText(entry.text), status: "ready" }
            : entry
        ),
      }));
      onNotice(
        school
          ? "จัดส่วนข้อความสำหรับค้นหาใหม่แล้ว"
          : "สร้างดัชนีข้อความในเบราว์เซอร์ใหม่แล้ว"
      );
    } catch (failure) {
      setError(failure.message);
    }
  }
  return (
    <PageWrapper isBarebones className="teacher-view native-teacher-workspace">
      <div className="page-heading">
        <div>
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
        {["dashboard", "classrooms"].includes(screen) && !demo && (
          <NativeButton className="button" onClick={() => begin("classroom")}>
            <Plus size={17} />
            สร้างห้องเรียน
          </NativeButton>
        )}
        {screen === "lessons" && demo && classroom && (
          <NativeButton className="button" onClick={() => begin("lesson")}>
            <Plus size={17} />
            เพิ่มบทเรียน
          </NativeButton>
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
            <NativeButton
              type="button"
              className="icon-button"
              aria-label="ปิดฟอร์ม"
              onClick={() => setForm(null)}
              disabled={busy}
            >
              <X size={19} />
            </NativeButton>
          </div>
          <label>
            {form.kind === "classroom" ? "ชื่อห้องเรียน" : "ชื่อบทเรียน"}
            <NativeInput
              autoFocus
              required
              maxLength={255}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            คำอธิบายสั้นๆ
            <NativeTextarea
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
          {form.kind === "lesson" && (
            <>
              <label>
                เนื้อหาบทเรียน
                <NativeTextarea
                  rows={8}
                  maxLength={50000}
                  value={lessonBody}
                  onChange={(event) => setLessonBody(event.target.value)}
                  placeholder="หัวข้อส่วนแรก แล้วขึ้นบรรทัดใหม่เพื่อเขียนเนื้อหา เว้นบรรทัดว่างเพื่อเริ่มส่วนถัดไป"
                />
              </label>
              <section className="teacher-quiz-editor">
                <h3>แบบทดสอบท้ายบท</h3>
                {quizDraft.map((question, index) => (
                  <div className="teacher-quiz-draft" key={index}>
                    <label>
                      คำถามที่ {index + 1}
                      <NativeInput
                        required
                        maxLength={1000}
                        value={question.question}
                        onChange={(e) =>
                          setQuizDraft((current) =>
                            current.map((q, i) =>
                              i === index
                                ? { ...q, question: e.target.value }
                                : q
                            )
                          )
                        }
                      />
                    </label>
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex}>
                        ตัวเลือก {optionIndex + 1}
                        <NativeInput
                          required
                          maxLength={1000}
                          value={option}
                          onChange={(e) =>
                            setQuizDraft((current) =>
                              current.map((q, i) =>
                                i === index
                                  ? {
                                      ...q,
                                      options: q.options.map((old, j) =>
                                        j === optionIndex ? e.target.value : old
                                      ),
                                    }
                                  : q
                              )
                            )
                          }
                        />
                      </label>
                    ))}
                    <label>
                      คำตอบที่ถูกต้อง
                      <select
                        value={question.answer}
                        onChange={(e) =>
                          setQuizDraft((current) =>
                            current.map((q, i) =>
                              i === index
                                ? { ...q, answer: Number(e.target.value) }
                                : q
                            )
                          )
                        }
                      >
                        {question.options.map((_, i) => (
                          <option key={i} value={i}>
                            ตัวเลือก {i + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      คำอธิบายเฉลย
                      <NativeTextarea
                        maxLength={2000}
                        value={question.explanation}
                        onChange={(e) =>
                          setQuizDraft((current) =>
                            current.map((q, i) =>
                              i === index
                                ? { ...q, explanation: e.target.value }
                                : q
                            )
                          )
                        }
                      />
                    </label>
                    <NativeButton
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setQuizDraft((current) =>
                          current.filter((_, i) => i !== index)
                        )
                      }
                    >
                      นำคำถามนี้ออก
                    </NativeButton>
                  </div>
                ))}
                <NativeButton
                  type="button"
                  variant="outline"
                  disabled={quizDraft.length >= 30}
                  onClick={() =>
                    setQuizDraft((current) => [
                      ...current,
                      {
                        question: "",
                        options: ["", "", ""],
                        answer: 0,
                        explanation: "",
                      },
                    ])
                  }
                >
                  <Plus size={16} /> เพิ่มคำถาม
                </NativeButton>
              </section>
            </>
          )}
          <NativeButton className="button" disabled={busy || !name.trim()}>
            {busy ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <Check size={17} />
            )}
            บันทึก
          </NativeButton>
        </form>
      )}
      {["dashboard", "classrooms"].includes(screen) && (
        <div className="native-teacher-table classroom-grid">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ห้องเรียน</TableHead>
                <TableHead>บทเรียน</TableHead>
                <TableHead>เอกสาร</TableHead>
                <TableHead className="native-actions-head">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.classrooms.map((entry) => {
                const firstLesson = data.lessons.find((lesson) =>
                  entry.lessonIds.includes(lesson.id)
                );
                const count = data.documents.filter(
                  (doc) => doc.classroomId === entry.id
                ).length;
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="native-class-cell">
                        <img
                          src={`/classroom/${firstLesson?.topic || "air"}.jpg`}
                          alt=""
                        />
                        <div>
                          <h2>
                            <NativeButton
                              variant="link"
                              className="native-title-link"
                              onClick={() => {
                                setClassroom(entry.id);
                                onCreated(entry.id);
                              }}
                            >
                              {entry.name}
                            </NativeButton>
                          </h2>
                          <p>
                            {entry.description ||
                              "เตรียมบทเรียนสำหรับห้องเรียนนี้"}
                          </p>
                          {entry.id === classroom?.id && (
                            <span className="native-active-class">
                              กำลังใช้งาน
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="native-table-count">
                        {entry.lessonIds.length}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="native-table-count">{count}</span>
                    </TableCell>
                    <TableCell>
                      <div className="native-table-actions">
                        <NativeButton
                          variant="ghost"
                          size="icon"
                          aria-label={`แก้ไข ${entry.name}`}
                          onClick={() => begin("classroom", entry)}
                        >
                          <Pencil size={17} />
                        </NativeButton>
                        <NativeButton
                          variant="outline"
                          aria-label="เปิดห้องเรียน"
                          onClick={() => {
                            setClassroom(entry.id);
                            onCreated(entry.id);
                          }}
                        >
                          <span className="native-action-label">
                            เปิดห้องเรียน
                          </span>
                          <ArrowRight size={16} />
                        </NativeButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
          <div className="teacher-lesson-list native-teacher-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>บทเรียน</TableHead>
                  <TableHead>หัวข้อ</TableHead>
                  <TableHead>เวลา</TableHead>
                  <TableHead className="native-actions-head">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell>
                      <div className="native-class-cell">
                        <img src={`/classroom/${lesson.topic}.jpg`} alt="" />
                        <div>
                          <h3>{lesson.title}</h3>
                          <p>{lesson.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`native-topic-label ${lesson.topic}`}>
                        {
                          TOPICS.find((entry) => entry.id === lesson.topic)
                            ?.title
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      {lesson.minutes ? `${lesson.minutes} นาที` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="native-table-actions">
                        <NativeButton
                          variant="ghost"
                          size="icon"
                          aria-label={`แก้ไขบทเรียน ${lesson.title}`}
                          onClick={() => begin("lesson", lesson)}
                        >
                          <Pencil size={17} />
                        </NativeButton>
                        <NativeButton
                          variant="outline"
                          aria-label="ดูแบบนักเรียน"
                          onClick={() => openLesson(lesson.id)}
                        >
                          <Eye size={16} />
                          <span className="native-action-label">
                            ดูแบบนักเรียน
                          </span>
                        </NativeButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                  ? school
                    ? "TXT, Markdown · ไม่เกิน 1 MB ต่อไฟล์ · บันทึกบนเซิร์ฟเวอร์"
                    : "TXT, Markdown · ไม่เกิน 1 MB · ประมวลผลในเครื่อง"
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
              <NativeInput
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
          <div className="knowledge-list native-teacher-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เอกสาร</TableHead>
                  <TableHead>บทเรียนที่เชื่อม</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="native-actions-head">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="native-document-cell">
                        <span className="native-document-icon">
                          <FileText size={22} />
                        </span>
                        <div>
                          <h3>{doc.name}</h3>
                          <small>
                            {doc.type || "TXT"}
                            {doc.sample ? " · เอกสารตัวอย่าง" : ""}
                          </small>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {data.lessons.find((lesson) => lesson.id === doc.lessonId)
                        ?.title || "ทุกบทเรียนในห้องเรียน"}
                    </TableCell>
                    <TableCell>
                      <span className="native-document-status">
                        <Check size={13} />
                        {doc.status === "ready"
                          ? "พร้อมค้นหา"
                          : "กำลังประมวลผล"}
                      </span>
                      {demo && (
                        <small className="native-document-chunks">
                          {doc.chunks.length} ส่วนข้อความ
                        </small>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="native-table-actions">
                        {demo && (
                          <>
                            <NativeButton
                              variant="ghost"
                              size="icon"
                              aria-label={`ดู ${doc.name}`}
                              onClick={() =>
                                setViewed(viewed?.id === doc.id ? null : doc)
                              }
                            >
                              <Eye size={17} />
                            </NativeButton>
                            <NativeButton
                              variant="ghost"
                              size="icon"
                              aria-label={`สร้างดัชนีใหม่ ${doc.name}`}
                              onClick={() => reindex(doc)}
                            >
                              <RefreshCw size={16} />
                            </NativeButton>
                          </>
                        )}
                        <NativeButton
                          variant="ghost"
                          size="icon"
                          className="native-remove"
                          aria-label={`นำออก ${doc.name}`}
                          onClick={() => remove(doc)}
                        >
                          <Trash2 size={17} />
                        </NativeButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                <NativeButton
                  className="icon-button"
                  aria-label="ปิดตัวอย่างเอกสาร"
                  onClick={() => setViewed(null)}
                >
                  <X size={18} />
                </NativeButton>
              </div>
              <p>{viewed.text}</p>
            </section>
          )}
        </>
      )}
      {screen === "questions" &&
        (school ? (
          <section>
            <p className="notice-panel">
              คำถามจริงจากบัญชีสมาชิกห้องเรียน · รีเฟรชหน้าเพื่อดูข้อมูลล่าสุด
            </p>
            {(data.teacherQuestions || []).map((item) => (
              <article className="student-question" key={item.id}>
                <span>
                  {item.displayName} · @{item.username}
                </span>
                <h3>{item.text}</h3>
                <small>
                  {data.lessons.find((lesson) => lesson.id === item.lessonId)
                    ?.title || "ถามจากห้องเรียน"}{" "}
                  · {new Date(item.createdAt).toLocaleString("th-TH")}
                </small>
              </article>
            ))}
            {!data.teacherQuestions?.length && (
              <p>ยังไม่มีคำถามที่บันทึกจากสมาชิกห้องเรียน</p>
            )}
          </section>
        ) : (
          <>
            <p className="notice-panel">
              {demo
                ? "ประวัติการทดลองถามที่บันทึกในเบราว์เซอร์นี้"
                : "ดูประวัติบทสนทนาในหน้าผู้ดูแลของระบบจริง"}
            </p>
            {Object.entries(data.conversations || {}).flatMap(
              ([key, messages]) =>
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
        ))}
    </PageWrapper>
  );
}
