import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  FlaskConical,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Leaf,
  ListChecks,
  LoaderCircle,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings2,
  Sparkles,
  Upload,
} from "lucide-react";
import useUser from "@/hooks/useUser";
import useMultiUserMode from "@/hooks/useMultiUserMode";
import { classroomRequest } from "./api";
import { TOPICS, readDemo, saveDemo } from "./data";
import { TopicArt } from "./Visuals";
import { KnowledgeCheck, PollutionExplorer, WasteSorting } from "./Activities";
import EcoChat from "./Chat";
import StudentDashboard from "./StudentDashboard";
import Teacher from "./Teacher";
import "./classroom.css";

const STUDENT_NAV = [
  { id: "dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { id: "classrooms", label: "ห้องเรียนของฉัน", icon: GraduationCap },
  { id: "lessons", label: "บทเรียน", icon: BookOpen },
  { id: "chat", label: "ถาม AI", icon: MessageCircle },
  { id: "progress", label: "ความก้าวหน้า", icon: ListChecks },
];
const TEACHER_NAV = [
  { id: "dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { id: "classrooms", label: "จัดการห้องเรียน", icon: GraduationCap },
  { id: "lessons", label: "เนื้อหาบทเรียน", icon: BookOpen },
  { id: "knowledge", label: "AI Knowledge Base", icon: FolderOpen },
  { id: "questions", label: "คำถามนักเรียน", icon: MessageCircle },
];
const emptyData = {
  classrooms: [],
  lessons: [],
  documents: [],
  progress: {},
  lastLesson: null,
  conversations: {},
};
export default function Classroom({ demo = false }) {
  const { user } = useUser();
  const multiUser = useMultiUserMode();
  const [params, setParams] = useSearchParams();
  const [demoRole, setDemoRole] = useState("student");
  const role = demo
    ? demoRole
    : !multiUser || ["admin", "manager"].includes(user?.role)
      ? "teacher"
      : "student";
  const [data, setData] = useState(() => (demo ? readDemo() : emptyData));
  const [status, setStatus] = useState(demo ? "ready" : "loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [prepared, setPrepared] = useState("");
  const screen = params.get("screen") || "dashboard";
  const classroom =
    data.classrooms.find((entry) => entry.id === params.get("class")) ||
    data.classrooms[0] ||
    null;
  const lesson =
    data.lessons.find(
      (entry) =>
        entry.id === params.get("lesson") &&
        classroom?.lessonIds.includes(entry.id)
    ) || null;
  const nav = role === "teacher" ? TEACHER_NAV : STUDENT_NAV;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, lesson?.id]);
  const available = data.lessons.filter((entry) =>
    classroom?.lessonIds.includes(entry.id)
  );
  const progressKey = (id) => `${classroom?.id}:${id}`;
  const progress = (id) => data.progress[progressKey(id)]?.percent || 0;
  const update = useCallback(
    (callback) => setData((previous) => callback(previous)),
    []
  );
  useEffect(() => {
    if (!demo) return;
    try {
      saveDemo(data);
    } catch {
      setError(
        "พื้นที่จัดเก็บในเบราว์เซอร์เต็ม การเปลี่ยนแปลงล่าสุดยังไม่ได้บันทึก กรุณาลดขนาดเอกสาร"
      );
    }
  }, [data, demo]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  const loadLive = useCallback(async () => {
    if (demo) return;
    setStatus("loading");
    setError("");
    try {
      const result = await classroomRequest("/workspaces");
      const courses = (result.workspaces || []).map((entry) => ({
        id: entry.slug,
        name: entry.name,
        description: "",
        lessonIds: [],
      }));
      const details = await Promise.all(
        courses.map((course) =>
          classroomRequest(`/workspace/${encodeURIComponent(course.id)}`)
        )
      );
      const documents = details.flatMap(({ workspace }, index) =>
        (workspace?.documents || []).map((doc) => ({
          ...doc,
          id: doc.id,
          name: doc.filename || doc.docpath,
          classroomId: courses[index].id,
          lessonId: null,
          status: "ready",
          type: "DOC",
        }))
      );
      setData({ ...emptyData, classrooms: courses, documents });
      setStatus("ready");
    } catch (failure) {
      setError(failure.message);
      setStatus("error");
    }
  }, [demo]);
  useEffect(() => {
    loadLive();
  }, [loadLive]);
  function go(next, extra = {}) {
    setParams({
      screen: next,
      ...(classroom ? { class: classroom.id } : {}),
      ...extra,
    });
    setSidebarOpen(false);
    setTutorOpen(false);
  }
  function setClassroom(id) {
    setParams({ screen: screen === "lesson" ? "lessons" : screen, class: id });
    setPrepared("");
  }
  function openLesson(id) {
    if (demo)
      update((previous) => ({
        ...previous,
        lastLesson: { classroomId: classroom.id, lessonId: id },
        progress: {
          ...previous.progress,
          [progressKey(id)]: {
            ...previous.progress[progressKey(id)],
            percent: Math.max(
              previous.progress[progressKey(id)]?.percent || 0,
              20
            ),
          },
        },
      }));
    go("lesson", { lesson: id });
  }
  function ask(question, lessonId) {
    setPrepared(question || "");
    go("chat", lessonId ? { lesson: lessonId } : {});
  }
  function conversation(key, messages) {
    update((previous) => ({
      ...previous,
      conversations: { ...previous.conversations, [key]: messages },
    }));
  }
  function finish(score, total) {
    update((previous) => ({
      ...previous,
      progress: {
        ...previous.progress,
        [progressKey(lesson.id)]: {
          percent: 100,
          score,
          total,
          completedAt: new Date().toISOString(),
        },
      },
    }));
    setNotice("บันทึกผลการเรียนในเบราว์เซอร์แล้ว");
  }
  function resume() {
    const last = data.lastLesson;
    const target =
      last && data.lessons.find((entry) => entry.id === last.lessonId);
    if (target) {
      setParams({
        screen: "lesson",
        class: last.classroomId,
        lesson: last.lessonId,
      });
    } else if (available[0]) openLesson(available[0].id);
    else go("lessons");
  }
  const topicCards = (
    <div className="topic-grid">
      {TOPICS.map((topic) => {
        const entries = available.filter((entry) => entry.topic === topic.id);
        const percent = entries.length
          ? Math.round(
              entries.reduce((sum, entry) => sum + progress(entry.id), 0) /
                entries.length
            )
          : 0;
        return (
          <article className={`topic-card ${topic.tone}`} key={topic.id}>
            <div className="topic-visual">
              <span className="topic-tag">{topic.tag}</span>
              <TopicArt topic={topic.id} />
            </div>
            <div className="topic-card-content">
              <div className="row-between">
                <h2>{topic.title}</h2>
                <span className="lesson-count">{entries.length} บทเรียน</span>
              </div>
              <p>{topic.description}</p>
              <div className="topic-progress">
                <div
                  role="progressbar"
                  aria-label={`ความก้าวหน้า ${topic.title}`}
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${percent}%` }} />
                </div>
                <span>{percent}%</span>
              </div>
              <button
                className="topic-start"
                disabled={!entries.length}
                onClick={() => openLesson(entries[0].id)}
              >
                {entries.length
                  ? percent === 100
                    ? "ทบทวนอีกครั้ง"
                    : "เริ่มเรียน"
                  : "ยังไม่มีบทเรียน"}
                <ArrowRight size={17} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
  return (
    <div
      className={`learning-app ${sidebarOpen ? "sidebar-open" : ""} ${role === "student" && screen === "dashboard" ? "student-dashboard-view" : ""}`}
    >
      <a className="skip-link" href="#learning-main">
        ข้ามไปยังเนื้อหา
      </a>
      <aside className="learning-sidebar">
        <Link to={demo ? "/demo" : "/live"} className="product-brand">
          <span className="product-monogram">
            e<span>c</span>
          </span>
          <div>
            <strong>Eco-Critical</strong>
            <small>AI Chatbot</small>
          </div>
        </Link>
        <div className="workspace-label">
          {role === "teacher" ? "TEACHER WORKSPACE" : "STUDENT WORKSPACE"}
        </div>
        <nav aria-label="เมนูหลัก">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-label={label}
              title={label}
              onClick={() => go(id)}
              aria-current={
                screen === id || (screen === "lesson" && id === "lessons")
                  ? "page"
                  : undefined
              }
              className={
                screen === id || (screen === "lesson" && id === "lessons")
                  ? "active"
                  : ""
              }
            >
              <Icon size={19} aria-hidden="true" />
              {label}
              {id === "chat" && (
                <span className="nav-ai" aria-hidden="true">
                  AI
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {demo ? (
            <div className="demo-note">
              <FlaskConical size={16} />
              <div>
                <strong>พื้นที่ทดลองใช้งาน</strong>
                <span>ข้อมูลบันทึกในเบราว์เซอร์นี้</span>
              </div>
            </div>
          ) : (
            <Link className="sidebar-settings" to="/settings/llm-preference">
              <Settings2 size={17} />
              ตั้งค่า Gemini และระบบ
            </Link>
          )}
          <button
            title="วิธีใช้งาน"
            aria-label="วิธีใช้งาน"
            className="sidebar-help"
            onClick={() => go("guide")}
          >
            <HelpCircle size={17} />
            วิธีใช้งาน
          </button>
          <div className="workspace-user">
            <span>{role === "teacher" ? "ครู" : "นร."}</span>
            <div>
              <strong>
                {demo
                  ? role === "teacher"
                    ? "คุณครูสาธิต"
                    : "นักเรียนสาธิต"
                  : user?.username || "ผู้ดูแล"}
              </strong>
              <small>
                {role === "teacher"
                  ? "พื้นที่จัดการการสอน"
                  : "พื้นที่เรียนรู้ของฉัน"}
              </small>
            </div>
          </div>
        </div>
      </aside>
      {sidebarOpen && (
        <button
          className="sidebar-scrim"
          aria-label="ปิดเมนู"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="learning-workspace">
        <header className="learning-topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="เปิดเมนู"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={20} />
            ) : (
              <PanelLeftOpen size={20} />
            )}
          </button>
          <div className="breadcrumbs">
            <button onClick={() => go("dashboard")}>Eco-Critical</button>
            <ChevronRight size={14} />
            <span>
              {screen === "lesson"
                ? "บทเรียน"
                : nav.find((entry) => entry.id === screen)?.label ||
                  "วิธีใช้งาน"}
            </span>
          </div>
          <div className="topbar-actions">
            {demo && (
              <>
                <span className="demo-badge">DEMO</span>
                <label className="role-switch">
                  <span>มุมมอง</span>
                  <select
                    aria-label="บทบาทสาธิต"
                    value={demoRole}
                    onChange={(event) => {
                      setDemoRole(event.target.value);
                      go("dashboard");
                    }}
                  >
                    <option value="student">นักเรียน</option>
                    <option value="teacher">คุณครู</option>
                  </select>
                </label>
              </>
            )}
            {!demo && <span className="live-badge">ระบบจริง</span>}
          </div>
        </header>
        <main
          id="learning-main"
          className={`learning-main ${screen === "chat" ? "chat-page" : ""}`}
          tabIndex={-1}
        >
          {notice && (
            <div className="toast-notice" role="status">
              <Check size={16} />
              {notice}
            </div>
          )}
          {error && (
            <div className="inline-error" role="alert">
              {error}
              {status === "error" && (
                <button onClick={loadLive}>ลองอีกครั้ง</button>
              )}
            </div>
          )}
          {status === "loading" && (
            <div className="empty-state" role="status">
              <LoaderCircle size={20} className="spin" />
              กำลังโหลดห้องเรียน…
            </div>
          )}
          {status === "ready" && (
            <>
              <div className="classroom-context">
                <GraduationCap size={17} />
                <select
                  aria-label="ห้องเรียนที่ใช้งาน"
                  value={classroom?.id || ""}
                  onChange={(event) => setClassroom(event.target.value)}
                >
                  {!data.classrooms.length && (
                    <option value="">ยังไม่มีห้องเรียน</option>
                  )}
                  {data.classrooms.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
                <span className="context-divider" />
                <span>
                  {demo
                    ? "เนื้อหาสาธิตสำหรับ ม.4–ม.6"
                    : "เข้าถึงตามสิทธิ์บัญชี"}
                </span>
              </div>
              {role === "teacher" &&
              [
                "dashboard",
                "classrooms",
                "lessons",
                "knowledge",
                "questions",
              ].includes(screen) ? (
                <Teacher
                  key={`${screen}-${classroom?.id}`}
                  screen={screen}
                  data={data}
                  update={update}
                  classroom={classroom}
                  setClassroom={setClassroom}
                  demo={demo}
                  openLesson={(id) => openLesson(id)}
                  onCreated={(id) =>
                    setParams({ screen: "lessons", class: id })
                  }
                  onNotice={setNotice}
                />
              ) : (
                <>
                  {screen === "dashboard" && (
                    <StudentDashboard
                      data={data}
                      classroom={classroom}
                      available={available}
                      name={demo ? "นักเรียน" : user?.username || "นักเรียน"}
                      demo={demo}
                      progress={progress}
                      onResume={resume}
                      onOpenLesson={openLesson}
                      onLessons={() => go("lessons")}
                      onAsk={() => ask("")}
                      onConversation={conversation}
                    />
                  )}
                  {screen === "classrooms" && (
                    <>
                      <div className="page-heading">
                        <div>
                          <h1>ห้องเรียนของฉัน</h1>
                          <p>
                            เปิดห้องเรียนเพื่อดูหัวข้อและเอกสารประกอบการเรียน
                          </p>
                        </div>
                      </div>
                      <div className="classroom-grid">
                        {data.classrooms.map((entry) => (
                          <article className="classroom-card" key={entry.id}>
                            <span className="classroom-symbol">
                              <GraduationCap size={25} />
                            </span>
                            <h2>{entry.name}</h2>
                            <p>{entry.description}</p>
                            <div className="classroom-meta">
                              {entry.lessonIds.length} บทเรียน
                            </div>
                            <button
                              className="button secondary"
                              onClick={() =>
                                setParams({
                                  screen: "lessons",
                                  class: entry.id,
                                })
                              }
                            >
                              เปิดห้องเรียน
                              <ArrowRight size={17} />
                            </button>
                          </article>
                        ))}
                      </div>
                      {!data.classrooms.length && (
                        <p className="empty-state">
                          ยังไม่มีห้องเรียนที่ได้รับมอบหมาย กรุณาติดต่อคุณครู
                        </p>
                      )}
                    </>
                  )}
                  {screen === "lessons" && (
                    <>
                      <div className="page-heading">
                        <div>
                          <h1>บทเรียน</h1>
                          <p>
                            เลือกเรื่องที่อยากเข้าใจ แล้วลองทำกิจกรรมไปด้วยกัน
                          </p>
                        </div>
                      </div>
                      <label className="lesson-search">
                        <Search size={17} />
                        <input
                          aria-label="ค้นหาบทเรียน"
                          type="search"
                          placeholder="ค้นหาบทเรียน"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                        />
                      </label>
                      {search ? (
                        <div className="lesson-results">
                          {available
                            .filter((entry) => entry.title.includes(search))
                            .map((entry) => (
                              <button
                                key={entry.id}
                                onClick={() => openLesson(entry.id)}
                              >
                                <TopicArt topic={entry.topic} small />
                                <div>
                                  <strong>{entry.title}</strong>
                                  <p>{entry.description}</p>
                                </div>
                                <ArrowRight size={18} />
                              </button>
                            ))}
                        </div>
                      ) : (
                        topicCards
                      )}
                      {!available.length && (
                        <p className="empty-state">
                          ยังไม่มีบทเรียนแบบภาพในห้องเรียนนี้{" "}
                          {demo
                            ? "คุณครูสามารถเพิ่มบทเรียนและเอกสารได้"
                            : "ใช้หน้าถาม AI เพื่อค้นจากเอกสารในห้องเรียนจริง"}
                        </p>
                      )}
                    </>
                  )}
                  {screen === "progress" && (
                    <>
                      <div className="page-heading">
                        <div>
                          <h1>ความก้าวหน้าของฉัน</h1>
                          <p>
                            {demo
                              ? "บันทึกจากกิจกรรมที่คุณทำในเบราว์เซอร์นี้"
                              : "ติดตามการเรียนในโหมดสาธิตได้ก่อนเชื่อมฐานข้อมูลนักเรียน"}
                          </p>
                        </div>
                      </div>
                      <div className="progress-lessons">
                        {available.map((entry) => (
                          <article key={entry.id}>
                            <span
                              className={`completion-circle ${progress(entry.id) === 100 ? "completed" : ""}`}
                            >
                              {progress(entry.id) === 100 ? (
                                <Check size={20} />
                              ) : (
                                <BookOpen size={19} />
                              )}
                            </span>
                            <div>
                              <h3>{entry.title}</h3>
                              <div className="topic-progress">
                                <div
                                  role="progressbar"
                                  aria-label={entry.title}
                                  aria-valuenow={progress(entry.id)}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                >
                                  <span
                                    style={{ width: `${progress(entry.id)}%` }}
                                  />
                                </div>
                                <span>{progress(entry.id)}%</span>
                              </div>
                            </div>
                            <button
                              className="button secondary"
                              onClick={() => openLesson(entry.id)}
                            >
                              {progress(entry.id) === 100
                                ? "ทบทวน"
                                : "เรียนต่อ"}
                              <ArrowRight size={16} />
                            </button>
                          </article>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
              {screen === "lesson" && lesson && (
                <>
                  <div className="lesson-toolbar">
                    <button
                      className="text-button"
                      onClick={() => go("lessons")}
                    >
                      <ArrowLeft size={17} />
                      กลับไปบทเรียน
                    </button>
                    <span>
                      {lesson.minutes
                        ? `${lesson.minutes} นาที`
                        : "บทเรียนของคุณครู"}
                    </span>
                    {role === "teacher" && demo && (
                      <button
                        className="button secondary"
                        onClick={() => setDemoRole("student")}
                      >
                        ดูแบบนักเรียน
                      </button>
                    )}
                    <button
                      className="button secondary tutor-toggle"
                      onClick={() => setTutorOpen(!tutorOpen)}
                    >
                      <Sparkles size={16} />
                      ถาม Eco AI
                    </button>
                  </div>
                  <div
                    className={`lesson-layout ${tutorOpen ? "tutor-open" : ""}`}
                  >
                    <article className="visual-lesson">
                      <div className="lesson-category">
                        {
                          TOPICS.find((topic) => topic.id === lesson.topic)
                            ?.title
                        }
                      </div>
                      <h1>{lesson.title}</h1>
                      <p className="lesson-description">{lesson.description}</p>
                      <div className={`lesson-cover ${lesson.topic}`}>
                        <TopicArt topic={lesson.topic} />
                      </div>
                      <section className="lesson-section">
                        <span className="section-kicker">
                          01 · มองให้เห็นความเชื่อมโยง
                        </span>
                        <h2>จากต้นเหตุ สู่ผลกระทบ</h2>
                        <div className="concept-steps">
                          {lesson.concepts.map((concept, index) => (
                            <div key={concept.title}>
                              <span>{String(index + 1).padStart(2, "0")}</span>
                              <h3>{concept.title}</h3>
                              <p>{concept.body}</p>
                            </div>
                          ))}
                        </div>
                        {!lesson.concepts.length && (
                          <p>
                            {lesson.description ||
                              "อ่านเอกสารที่เชื่อมกับบทเรียนนี้ แล้วตั้งคำถามกับ Eco AI"}
                          </p>
                        )}
                      </section>
                      {lesson.topic === "air" && <PollutionExplorer />}
                      {lesson.topic === "plastic" && <WasteSorting />}
                      {lesson.topic === "water" && (
                        <section className="activity water-chain">
                          <span className="section-kicker">
                            ลองไล่ความสัมพันธ์
                          </span>
                          <h3>เมื่อน้ำได้รับอินทรียวัตถุมากขึ้น</h3>
                          <div>
                            {[
                              "อินทรียวัตถุเพิ่ม",
                              "จุลินทรีย์ย่อยสลาย",
                              "ใช้ออกซิเจนมากขึ้น",
                              "สัตว์น้ำได้รับผลกระทบ",
                            ].map((step, index) => (
                              <details key={step}>
                                <summary>
                                  <span>{index + 1}</span>
                                  {step}
                                </summary>
                                <p>
                                  {lesson.concepts[Math.min(index, 2)].body}
                                </p>
                              </details>
                            ))}
                          </div>
                          <small>
                            กดแต่ละขั้นเพื่อดูคำอธิบาย ·
                            ความสัมพันธ์จริงยังขึ้นกับสภาพแวดล้อมและช่วงเวลา
                          </small>
                        </section>
                      )}
                      <details className="critical-question">
                        <summary>
                          ลองคิดต่อ: เรารู้ได้อย่างไรว่าข้อสรุปนี้น่าเชื่อถือ?
                          <ChevronRight size={17} />
                        </summary>
                        <p>
                          ลองระบุข้อมูลที่มี ข้อมูลที่ยังขาด และคำอธิบายทางเลือก
                          ก่อนเลือกแนวทางแก้ปัญหา คุณสามารถถาม Eco AI
                          ให้ช่วยค้นข้อความจากเอกสารได้
                        </p>
                      </details>
                      {lesson.quiz.length ? (
                        <KnowledgeCheck
                          key={`${classroom.id}-${lesson.id}`}
                          lesson={lesson}
                          onFinish={finish}
                        />
                      ) : (
                        <button className="button" onClick={() => finish(0, 0)}>
                          บันทึกว่าอ่านบทเรียนแล้ว
                          <Check size={17} />
                        </button>
                      )}
                      <div className="lesson-reference">
                        {demo && (
                          <span>
                            เนื้อหาสาธิตเพื่อทดลองระบบ ·
                            ควรให้ครูตรวจเนื้อหาก่อนใช้สอนจริง
                          </span>
                        )}
                        {lesson.reference && (
                          <a
                            href={lesson.reference}
                            target="_blank"
                            rel="noreferrer"
                          >
                            แหล่งข้อมูลสำหรับตรวจสอบบทเรียน
                            <ArrowRight size={14} />
                          </a>
                        )}
                      </div>
                      <div className="lesson-next">
                        <button
                          className="button secondary"
                          onClick={() => {
                            const index = available.findIndex(
                              (entry) => entry.id === lesson.id
                            );
                            if (available[index + 1])
                              openLesson(available[index + 1].id);
                            else go("progress");
                          }}
                        >
                          {available.findIndex(
                            (entry) => entry.id === lesson.id
                          ) <
                          available.length - 1
                            ? "บทเรียนถัดไป"
                            : "ดูความก้าวหน้า"}
                          <ArrowRight size={17} />
                        </button>
                      </div>
                    </article>
                    <div className="lesson-tutor">
                      <EcoChat
                        key={`${classroom.id}-${lesson.id}`}
                        classroom={classroom}
                        lesson={lesson}
                        documents={data.documents}
                        demo={demo}
                        compact
                        conversations={data.conversations}
                        onConversation={conversation}
                      />
                    </div>
                  </div>
                </>
              )}
              {screen === "chat" && (
                <div className="chat-workspace">
                  <EcoChat
                    key={`${classroom?.id}-${lesson?.id || "all"}`}
                    classroom={classroom}
                    lesson={lesson}
                    documents={data.documents}
                    demo={demo}
                    prepared={prepared}
                    conversations={data.conversations}
                    onConversation={conversation}
                  />
                  <aside className="sources-panel">
                    <div className="section-heading">
                      <h2>เอกสารในบริบท</h2>
                      <FileText size={18} />
                    </div>
                    <p>
                      {lesson
                        ? "ค้นเฉพาะเอกสารที่เชื่อมกับบทเรียนนี้ในโหมดสาธิต"
                        : "ใช้เอกสารของห้องเรียนที่กำลังเลือก"}
                    </p>
                    {data.documents
                      .filter(
                        (doc) =>
                          doc.classroomId === classroom?.id &&
                          (!lesson || doc.lessonId === lesson.id)
                      )
                      .map((doc) => (
                        <details key={doc.id}>
                          <summary>
                            <span className="source-file-icon">
                              <FileText size={18} />
                            </span>
                            <span>
                              {doc.name}
                              <small>
                                {doc.sample ? "เอกสารตัวอย่าง" : "เอกสารของครู"}
                              </small>
                            </span>
                            <ChevronRight size={15} />
                          </summary>
                          <p>
                            {doc.text ||
                              "อ่านข้อความที่ค้นพบได้จากแหล่งอ้างอิงใต้คำตอบ"}
                          </p>
                        </details>
                      ))}
                    <small className="source-footnote">
                      {demo
                        ? "ค้นข้อความที่ตรงกับคำถามในเครื่อง ไม่ได้ใช้ embedding หรือ Gemini"
                        : "โหมดระบบจริงค้นด้วย embeddings จาก workspace ที่มีสิทธิ์"}
                    </small>
                  </aside>
                </div>
              )}
              {screen === "guide" && (
                <section className="app-guide">
                  <h1>เริ่มใช้งานในหนึ่งนาที</h1>
                  <div>
                    <h2>สำหรับนักเรียน</h2>
                    <p>
                      เลือกห้องเรียน → เปิดบทเรียน → ทดลองกิจกรรม → ถาม Eco AI →
                      กดดูข้อความอ้างอิง
                    </p>
                  </div>
                  <div>
                    <h2>สำหรับคุณครู</h2>
                    <p>
                      สลับมุมมองเป็นคุณครู → สร้างห้องเรียน → เพิ่มบทเรียน →
                      อัปโหลด TXT/Markdown ใน AI Knowledge Base → ดูแบบนักเรียน
                    </p>
                  </div>
                  <div>
                    <h2>โหมดสาธิตและระบบจริงต่างกันอย่างไร?</h2>
                    <p>
                      โหมดสาธิตบันทึกข้อมูลในเบราว์เซอร์และตอบด้วยข้อความที่ค้นพบ
                      ไม่เรียกโมเดลภาษา ระบบจริงต้องมี backend, collector และ
                      Gemini API key ที่ตั้งค่าโดยผู้ดูแลก่อน
                    </p>
                  </div>
                  {demo ? (
                    <Link className="button secondary" to="/live">
                      เปิดการตั้งค่าระบบจริง
                      <ArrowRight size={17} />
                    </Link>
                  ) : (
                    <Link className="button secondary" to="/demo">
                      เปิดโหมดสาธิต
                      <ArrowRight size={17} />
                    </Link>
                  )}
                </section>
              )}
            </>
          )}
        </main>
      </div>
      {role === "student" && (
        <nav className="student-bottom-nav" aria-label="เมนูนักเรียนบนมือถือ">
          {STUDENT_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={
                screen === id || (screen === "lesson" && id === "lessons")
                  ? "active"
                  : ""
              }
              onClick={() => go(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
