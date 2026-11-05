import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  BookOpen,
  ChevronDown,
  CircleStop,
  FileText,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Workspace from "@/models/workspace";
import { retrieve, SUGGESTIONS } from "./data";

export default function EcoChat({
  classroom,
  lesson,
  documents,
  demo,
  compact = false,
  prepared = "",
  conversations = {},
  onConversation,
}) {
  const key = `${classroom?.id || "none"}:${lesson?.id || "all"}`;
  const [messages, setMessages] = useState(conversations[key] || []);
  const [input, setInput] = useState(prepared);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeSource, setActiveSource] = useState(null);
  const thread = useRef(null);
  const generation = useRef(0);
  const streamState = useRef(false);
  const messagesContainer = useRef(null);
  const textarea = useRef(null);
  useEffect(() => {
    const counter = generation;
    const activeStream = streamState;
    return () => {
      counter.current++;
      if (activeStream.current)
        window.dispatchEvent(new Event("abort-chat-stream"));
    };
  }, []);
  useEffect(() => {
    if (prepared) {
      setInput(prepared);
      textarea.current?.focus({ preventScroll: true });
    }
  }, [prepared]);
  useEffect(() => {
    if (messagesContainer.current)
      messagesContainer.current.scrollTop =
        messagesContainer.current.scrollHeight;
  }, [messages, busy]);
  function persist(next) {
    setMessages(next);
    if (demo) onConversation?.(key, next);
  }
  async function send(provided) {
    const question = (provided || input).trim();
    if (!question || busy || !classroom) return;
    const requestGeneration = generation.current;
    setBusy(true);
    setInput("");
    setError("");
    const next = [
      ...messages,
      { id: crypto.randomUUID(), role: "user", text: question },
    ];
    persist(next);
    const reply = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "",
      sources: [],
    };
    try {
      if (demo) {
        // Local extractive retrieval, explicitly labeled. This is not a model call.
        await new Promise((resolve) => setTimeout(resolve, 180));
        if (generation.current !== requestGeneration) return;
        const matches = retrieve(
          documents,
          question,
          classroom.id,
          lesson?.id || null
        );
        reply.sources = matches;
        reply.text = matches.length
          ? `จากข้อความที่ค้นพบในเอกสาร:\n\n${matches.map((source) => source.text).join("\n\n")}\n\nลองพิจารณาว่าข้อมูลนี้ช่วยตอบคำถามของเราอย่างไร และมีส่วนใดที่ยังต้องหาหลักฐานเพิ่ม`
          : "ยังไม่พบข้อมูลที่เพียงพอในเอกสารของห้องเรียนนี้สำหรับคำถามนี้ ลองระบุหัวข้อที่อยู่ในบทเรียน หรือให้คุณครูเพิ่มเอกสารที่เกี่ยวข้อง";
        persist([...next, reply]);
      } else {
        if (!thread.current) {
          const result = await Workspace.threads.new(classroom.id);
          if (!result.thread)
            throw new Error("สร้างบทสนทนาไม่สำเร็จ กรุณาตรวจสอบการเข้าสู่ระบบ");
          thread.current = result.thread.slug;
        }
        streamState.current = true;
        await Workspace.multiplexStream({
          workspaceSlug: classroom.id,
          threadSlug: thread.current,
          prompt: question,
          chatHandler: (event) => {
            if (generation.current !== requestGeneration) return;
            if (event.type === "abort") {
              setError(event.error || "เชื่อมต่อ AI ไม่สำเร็จ");
              return;
            }
            if (event.type === "textResponseChunk")
              reply.text += event.textResponse || "";
            if (event.type === "textResponse")
              reply.text = event.textResponse || "";
            if (event.sources?.length)
              reply.sources = event.sources.map((source) => ({
                title:
                  source.title || source.metadata?.title || "เอกสารบทเรียน",
                text:
                  source.text ||
                  source.pageContent ||
                  source.description ||
                  "ไม่มีข้อความตัวอย่างใน response นี้",
                page: source.page || source.metadata?.loc?.pageNumber || null,
                section: source.section || source.metadata?.section || null,
              }));
            setMessages([...next, { ...reply }]);
          },
        });
        if (!reply.text)
          setError(
            "ยังไม่ได้รับคำตอบ ตรวจสอบ Gemini และเอกสารใน Knowledge Base แล้วลองอีกครั้ง"
          );
      }
    } catch (failure) {
      if (generation.current === requestGeneration)
        setError(failure.message || "ตอบคำถามไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      streamState.current = false;
      if (generation.current === requestGeneration) setBusy(false);
    }
  }
  return (
    <section
      className={`eco-chat ${compact ? "compact" : ""}`}
      aria-label="ผู้ช่วย Eco AI"
    >
      <header className="chat-heading">
        <span className="ai-mark">
          <Sparkles size={19} />
        </span>
        <div>
          <h2>Eco AI</h2>
          <p>{lesson ? "ผู้ช่วยประจำบทเรียน" : "ถามจากบทเรียนของคุณครู"}</p>
        </div>
        <span className={`chat-mode ${demo ? "is-demo" : ""}`}>
          {demo ? "สาธิต" : "ระบบจริง"}
        </span>
      </header>
      <div className="chat-context">
        <BookOpen size={15} />
        <span>
          {lesson?.title || classroom?.name || "เลือกห้องเรียนก่อนเริ่มถาม"}
        </span>
      </div>
      <div
        className="chat-messages"
        ref={messagesContainer}
        aria-live="polite"
        aria-relevant="additions"
      >
        {!messages.length && (
          <div className="chat-empty">
            <MessageCircle size={28} />
            <h3>มีคำถามจากบทเรียนไหม?</h3>
            <p>
              {demo
                ? "ทดลองค้นคำตอบจากเอกสารสาธิตของคุณครู"
                : "คำถามจะค้นจากเอกสารในห้องเรียนที่เลือก"}
            </p>
            <div className="suggested-questions">
              {(lesson?.topic === "air"
                ? [SUGGESTIONS[0], "เราจะตรวจสอบแหล่งกำเนิดฝุ่นได้อย่างไร?"]
                : lesson?.topic === "water"
                  ? [SUGGESTIONS[1], "ทำไมออกซิเจนในน้ำจึงสำคัญ?"]
                  : SUGGESTIONS
              ).map((question) => (
                <button
                  key={question}
                  onClick={() => {
                    setInput(question);
                    textarea.current?.focus({ preventScroll: true });
                  }}
                >
                  {question}
                  <ArrowUp size={15} />
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <article key={message.id} className={`chat-message ${message.role}`}>
            <span className="message-author">
              {message.role === "user"
                ? "คุณ"
                : demo
                  ? "Eco AI · ผลค้นเอกสารสาธิต"
                  : "Eco AI"}
            </span>
            <div className="message-text">{message.text}</div>
            {message.sources?.length > 0 && (
              <div className="message-sources">
                <small>แหล่งข้อมูลที่ค้นพบ</small>
                {message.sources.map((source, index) => (
                  <button
                    key={`${source.title}-${index}`}
                    onClick={() => setActiveSource(source)}
                  >
                    <FileText size={14} />
                    <span>{source.title}</span>
                    <span className="source-number">{index + 1}</span>
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
        {busy && (
          <div className="chat-loading" role="status">
            <LoaderCircle size={16} className="spin" />
            {demo
              ? "กำลังค้นข้อความในเอกสารสาธิต…"
              : "กำลังค้นบทเรียนและเรียบเรียงคำตอบ…"}
          </div>
        )}
        {error && (
          <div className="inline-error" role="alert">
            <span>{error}</span>
            <button
              onClick={() =>
                send(
                  [...messages]
                    .reverse()
                    .find((message) => message.role === "user")?.text
                )
              }
              disabled={busy}
            >
              <RotateCcw size={15} />
              ลองอีกครั้ง
            </button>
          </div>
        )}
        {activeSource && (
          <section
            className="source-detail"
            aria-label="รายละเอียดแหล่งอ้างอิง"
          >
            <div>
              <FileText size={17} />
              <strong>{activeSource.title}</strong>
              <button
                className="icon-button"
                aria-label="ปิดแหล่งอ้างอิง"
                onClick={() => setActiveSource(null)}
              >
                <ChevronDown size={18} />
              </button>
            </div>
            <small>
              {activeSource.page
                ? `หน้า ${activeSource.page}`
                : activeSource.section || "ข้อความที่ระบบส่งกลับ"}
            </small>
            <p>{activeSource.text}</p>
          </section>
        )}
      </div>
      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <label
          className="sr-label"
          htmlFor={`chat-input-${compact ? "side" : "main"}`}
        >
          คำถามถึง Eco AI
        </label>
        <textarea
          id={`chat-input-${compact ? "side" : "main"}`}
          ref={textarea}
          rows={2}
          placeholder="ถามเรื่องที่อยากเข้าใจ…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={!classroom}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              send();
            }
          }}
        />
        <div>
          <span>
            <FileText size={13} />
            {
              documents.filter(
                (doc) =>
                  doc.classroomId === classroom?.id &&
                  (!lesson || !doc.lessonId || doc.lessonId === lesson.id)
              ).length
            }{" "}
            เอกสารในบริบท
          </span>
          {busy ? (
            <button
              type="button"
              className="send-button"
              aria-label="หยุดตอบ"
              onClick={() => {
                generation.current++;
                window.dispatchEvent(new Event("abort-chat-stream"));
                setBusy(false);
              }}
            >
              <CircleStop size={18} />
            </button>
          ) : (
            <button
              className="send-button"
              aria-label="ส่งคำถาม"
              disabled={!input.trim() || !classroom}
            >
              <ArrowUp size={19} />
            </button>
          )}
        </div>
      </form>
      <p className="chat-disclosure">
        {demo
          ? "ค้นข้อความในเบราว์เซอร์ · ไม่ได้เรียก Gemini · ไม่ใช่คำตอบจากโมเดล"
          : "ตรวจสอบแหล่งอ้างอิงทุกครั้ง AI อาจตอบคลาดเคลื่อนได้"}
      </p>
    </section>
  );
}
