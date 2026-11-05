import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { PageWrapper } from "@/mentingo/components/PageWrapper";
import { Button } from "@/mentingo/components/ui/button";
import { Input } from "@/mentingo/components/ui/input";
import { Textarea } from "@/mentingo/components/ui/textarea";
import { CASE_STUDIES } from "./caseStudies";
function identity() {
  let token = localStorage.getItem("eco-board-token");
  if (!token) {
    token = crypto.randomUUID() + crypto.randomUUID();
    localStorage.setItem("eco-board-token", token);
  }
  return token;
}
const stamp = (ms) =>
  new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(ms);
export default function Discussions({ onOpenLesson, school = null }) {
  const accountBased = !!school;
  const [params, setParams] = useSearchParams();
  const selected = params.get("thread") || "";
  const caseContext = params.get("case") || "";
  const [threads, setThreads] = useState([]),
    [detail, setDetail] = useState(null),
    [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [composer, setComposer] = useState(!!caseContext),
    [alias, setAlias] = useState(
      () =>
        school?.user.displayName ||
        localStorage.getItem("eco-board-alias") ||
        ""
    );
  const [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [reply, setReply] = useState(""),
    [caseId, setCaseId] = useState(caseContext),
    [deleting, setDeleting] = useState("");
  const request = useCallback(
    async (path = "", method = "GET", value, signal) => {
      const response = await fetch(`/api/discussions${path}`, {
        method,
        signal,
        headers: {
          ...(!accountBased ? { "X-Board-Token": identity() } : {}),
          ...(value ? { "Content-Type": "application/json" } : {}),
        },
        ...(value ? { body: JSON.stringify(value) } : {}),
      });
      const contentType = response.headers.get("Content-Type") || "";
      if (!contentType.includes("application/json"))
        throw new Error("เชื่อมต่อบอร์ดไม่ได้ กรุณารีเฟรชหน้าแล้วลองใหม่");
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "เชื่อมต่อบอร์ดไม่สำเร็จ");
      return result;
    },
    [accountBased]
  );
  const refresh = useCallback(
    async (signal) => {
      const result = await request("", "GET", undefined, signal);
      setThreads(result.threads);
      setHasMore(result.hasMore);
    },
    [request]
  );
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    refresh(controller.signal)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    const controller = new AbortController();
    setDetail(null);
    setDeleting("");
    setReply("");
    if (selected)
      request(`/${selected}`, "GET", undefined, controller.signal)
        .then(setDetail)
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        });
    return () => controller.abort();
  }, [selected, request]);
  function open(id) {
    setError("");
    setComposer(false);
    setParams({
      screen: "discussions",
      class: "eco-m5",
      ...(id ? { thread: id } : {}),
    });
  }
  function create(context = "") {
    setCaseId(context);
    setTitle("");
    setBody("");
    setComposer(true);
    setError("");
  }
  async function submit(event, isReply = false) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      localStorage.setItem("eco-board-alias", alias.trim());
      const result = await request(
        isReply ? `/${selected}/replies` : "",
        "POST",
        { alias, body: isReply ? reply : body, title, caseId }
      );
      await refresh();
      if (isReply) {
        setDetail(await request(`/${selected}`));
        setReply("");
      } else {
        open(result.id);
        setBody("");
        setTitle("");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(path) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await request(path, "DELETE");
      setDeleting("");
      await refresh();
      if (path === `/${selected}`) open("");
      else setDetail(await request(`/${selected}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function reload() {
    setLoading(true);
    setError("");
    try {
      await refresh();
      if (selected) setDetail(await request(`/${selected}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function more() {
    setBusy(true);
    try {
      const result = await request(`?offset=${threads.length}`);
      setThreads((previous) => [
        ...previous,
        ...result.threads.filter(
          (t) => !previous.some((old) => old.id === t.id)
        ),
      ]);
      setHasMore(result.hasMore);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const caseEntry = CASE_STUDIES.find(
    (entry) => entry.id === (detail?.thread.case_id || caseId)
  );
  function deleteControl(path, label) {
    return deleting === path ? (
      <span className="board-delete-confirm">
        <span>ยืนยันการลบ?</span>
        <Button
          variant="destructive"
          disabled={busy}
          onClick={() => remove(path)}
        >
          ลบ
        </Button>
        <Button variant="ghost" onClick={() => setDeleting("")}>
          ยกเลิก
        </Button>
      </span>
    ) : (
      <Button
        variant="ghost"
        aria-label={label}
        onClick={() => setDeleting(path)}
      >
        <Trash2 size={16} />
      </Button>
    );
  }
  return (
    <PageWrapper isBarebones className="discussion-board">
      <header className="geography-heading">
        <div>
          <span className="geography-eyebrow">
            <MessageSquare size={16} />
            ห้องเรียนภูมิศาสตร์
          </span>
          <h1>บอร์ดสนทนา</h1>
          <p>ตั้งข้อสังเกต แลกเปลี่ยนหลักฐาน แล้วลองมองอีกมุม</p>
        </div>
        <div className="board-heading-actions">
          <Button
            variant="outline"
            onClick={reload}
            disabled={loading || busy}
            aria-label="รีเฟรชบอร์ด"
          >
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => create()}>
            <Plus size={18} /> ตั้งกระทู้
          </Button>
        </div>
      </header>
      <div className="board-public-note">
        {school
          ? "บอร์ดสำหรับสมาชิกห้องเรียน · อ้างอิงแหล่งข้อมูลเมื่อเสนอข้อเท็จจริง · ครูดูแลข้อความได้"
          : "บอร์ดสาธารณะสำหรับการทดสอบ"}
      </div>
      {error && (
        <div className="inline-error" role="alert">
          {error}
          <Button variant="outline" onClick={reload}>
            ลองอีกครั้ง
          </Button>
        </div>
      )}
      {composer && (
        <form className="board-composer" onSubmit={submit}>
          <div className="board-form-heading">
            <h2>เปิดประเด็นใหม่</h2>
            <Button
              type="button"
              variant="ghost"
              aria-label="ปิดฟอร์มกระทู้"
              onClick={() => setComposer(false)}
            >
              <X size={20} />
            </Button>
          </div>
          <label>
            ชื่อที่ใช้แสดง
            <Input
              required
              maxLength={40}
              value={alias}
              readOnly={!!school}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="ใช้นามแฝง ไม่ต้องใช้ชื่อจริง"
            />
          </label>
          <label>
            เชื่อมกับกรณีศึกษา
            <select value={caseId} onChange={(e) => setCaseId(e.target.value)}>
              <option value="">ประเด็นทั่วไปในห้องเรียน</option>
              {CASE_STUDIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.place} · {c.year}
                </option>
              ))}
            </select>
          </label>
          <label>
            หัวข้อกระทู้
            <Input
              required
              minLength={3}
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="มีคำถามหรือข้อสังเกตอะไร?"
            />
          </label>
          <label>
            ข้อความ
            <Textarea
              required
              maxLength={3000}
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="เล่าเหตุผล แนบลิงก์หลักฐาน หรือชวนเพื่อนตรวจสอบข้อสันนิษฐาน"
            />
          </label>
          <div className="board-form-footer">
            <small>{body.length}/3000</small>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                <Send size={17} />
              )}{" "}
              เผยแพร่กระทู้
            </Button>
          </div>
        </form>
      )}
      {selected && !composer ? (
        <section className="board-thread">
          <Button variant="ghost" onClick={() => open("")}>
            <ArrowLeft size={17} /> กลับไปกระทู้ทั้งหมด
          </Button>
          {!detail && !error && <p role="status">กำลังโหลดกระทู้…</p>}
          {detail && (
            <>
              <article className="board-original">
                <div className="board-author">
                  <span className="board-avatar" aria-hidden="true">
                    {detail.thread.alias.slice(0, 1)}
                  </span>
                  <span>
                    <strong>{detail.thread.alias}</strong>
                    <small>
                      {stamp(detail.thread.created_at)}
                      {detail.thread.mine ? " · คุณ" : ""}
                    </small>
                  </span>
                  {(detail.thread.mine ||
                    ["admin", "teacher"].includes(school?.user.role)) &&
                    deleteControl(`/${selected}`, "ลบกระทู้ของฉัน")}
                </div>
                <h2>{detail.thread.title}</h2>
                <p className="board-body">{detail.thread.body}</p>
                {caseEntry && (
                  <Button
                    variant="outline"
                    onClick={() => onOpenLesson(caseEntry.id)}
                  >
                    {caseEntry.place} · {caseEntry.year}
                    <ArrowRight size={16} />
                  </Button>
                )}
              </article>
              <h2 className="board-reply-title">
                คำตอบ · {detail.replies.length}
              </h2>
              {detail.replies.map((item) => (
                <article className="board-reply" key={item.id}>
                  <div className="board-author">
                    <span className="board-avatar" aria-hidden="true">
                      {item.alias.slice(0, 1)}
                    </span>
                    <span>
                      <strong>{item.alias}</strong>
                      <small>
                        {stamp(item.created_at)}
                        {item.mine ? " · คุณ" : ""}
                      </small>
                    </span>
                    {(item.mine ||
                      ["admin", "teacher"].includes(school?.user.role)) &&
                      deleteControl(
                        `/${selected}/replies/${item.id}`,
                        "ลบคำตอบของฉัน"
                      )}
                  </div>
                  <p className="board-body">{item.body}</p>
                </article>
              ))}
              {detail.replyLimitReached ? (
                <p>
                  กระทู้นี้มีคำตอบครบ 100 ข้อความแล้ว
                  สามารถเปิดกระทู้ต่อเนื่องได้
                </p>
              ) : (
                <form
                  className="board-composer board-reply-form"
                  onSubmit={(e) => submit(e, true)}
                >
                  <h2>ร่วมสนทนา</h2>
                  <label>
                    ชื่อที่ใช้แสดง
                    <Input
                      required
                      maxLength={40}
                      value={alias}
                      readOnly={!!school}
                      onChange={(e) => setAlias(e.target.value)}
                    />
                  </label>
                  <label>
                    คำตอบของคุณ
                    <Textarea
                      required
                      maxLength={3000}
                      rows={3}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="ต่อยอดด้วยเหตุผลหรือหลักฐาน"
                    />
                  </label>
                  <div className="board-form-footer">
                    <small>{reply.length}/3000</small>
                    <Button type="submit" disabled={busy}>
                      <Send size={17} /> ส่งคำตอบ
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>
      ) : (
        !composer && (
          <section className="board-list" aria-label="กระทู้ในห้องเรียน">
            {loading && <p role="status">กำลังโหลดบอร์ด…</p>}
            {threads.map((thread) => (
              <button
                className="board-list-row"
                key={thread.id}
                onClick={() => open(thread.id)}
              >
                <span className="board-row-icon">
                  <MessageSquare size={22} />
                </span>
                <span className="board-row-copy">
                  <span className="board-row-meta">
                    {CASE_STUDIES.find((c) => c.id === thread.case_id)?.place ||
                      "ประเด็นทั่วไป"}
                  </span>
                  <strong>{thread.title}</strong>
                  <span>
                    {thread.alias} · {stamp(thread.created_at)}
                  </span>
                </span>
                <span className="board-reply-count">
                  {thread.reply_count}
                  <small>คำตอบ</small>
                </span>
                <ArrowRight size={18} />
              </button>
            ))}
            {!loading && !error && !threads.length && (
              <div className="board-empty">
                <h2>เริ่มจากคำถามที่อยากชวนเพื่อนคิด</h2>
                <p>
                  ยังไม่มีกระทู้ คุณสามารถเปิดประเด็นแรกจากกรณีศึกษาที่เรียนได้
                </p>
                <Button variant="outline" onClick={() => create("london-1952")}>
                  ทำไมควันในลอนดอนจึงสะสมใกล้พื้นดิน? <Plus size={16} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => create("thailand-2026")}
                >
                  เราควรใช้ข้อมูลอะไรเลือกพื้นที่ช่วยเหลือเรื่องฝุ่น?{" "}
                  <Plus size={16} />
                </Button>
              </div>
            )}
            {hasMore && (
              <Button variant="outline" disabled={busy} onClick={more}>
                โหลดกระทู้เพิ่มเติม
              </Button>
            )}
          </section>
        )
      )}
      <p className="case-source-note">
        ข้อความบันทึกในฐานข้อมูลร่วมกัน · กดรีเฟรชเพื่อดูคำตอบใหม่ ·
        {school
          ? "เจ้าของข้อความลบได้จากบัญชีของตัวเอง"
          : "ลบข้อความของตัวเองได้จากเบราว์เซอร์ที่ใช้เขียน"}
      </p>
    </PageWrapper>
  );
}
