import { useCallback, useEffect, useState } from "react";
import {
  Check,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/mentingo/components/ui/button";
import { Input } from "@/mentingo/components/ui/input";
import { schoolRequest, ChangePassword } from "./SchoolApp";
const roles = { student: "นักเรียน", teacher: "คุณครู", admin: "แอดมิน" },
  statuses = { pending: "รออนุมัติ", active: "ใช้งานได้", suspended: "ระงับ" };
export function Members({ school, lessons }) {
  const [users, setUsers] = useState([]),
    [q, setQ] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [temporary, setTemporary] = useState(null),
    [selected, setSelected] = useState(null),
    [hasMore, setHasMore] = useState(false);
  const load = useCallback(async (search = "") => {
    setBusy(true);
    setError("");
    try {
      const result = await schoolRequest(
        `/users?q=${encodeURIComponent(search)}`
      );
      setUsers(result.users);
      setHasMore(result.hasMore);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  async function change(user, values) {
    setBusy(true);
    setError("");
    try {
      await schoolRequest(`/users/${user.id}`, {
        method: "POST",
        body: values,
      });
      await load(q);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function reset(user) {
    setBusy(true);
    setError("");
    try {
      const result = await schoolRequest(`/users/${user.id}/reset`, {
        method: "POST",
      });
      setTemporary({ name: user.username, password: result.temporaryPassword });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="school-management">
      <header className="geography-heading">
        <div>
          <span className="geography-eyebrow">
            <Users size={17} />
            ห้องเรียนภูมิศาสตร์
          </span>
          <h1>
            {school.user.role === "admin"
              ? "จัดการผู้ใช้และสิทธิ์"
              : "นักเรียนในห้องเรียน"}
          </h1>
          <p>ตรวจรายชื่อผู้สมัคร อนุมัติการเข้าเรียน และดูความก้าวหน้ารายคน</p>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => load(q)}>
          <RefreshCw size={17} /> รีเฟรช
        </Button>
      </header>
      {error && (
        <div role="alert" className="school-error">
          {error}
        </div>
      )}
      <form
        className="school-user-search"
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
      >
        <Input
          aria-label="ค้นหาผู้ใช้"
          placeholder="ค้นหาชื่อ ชื่อผู้ใช้ หรืออีเมล"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          <Search size={17} /> ค้นหา
        </Button>
      </form>
      {temporary && (
        <div className="school-temp-password" role="status">
          <h2>รหัสชั่วคราวของ {temporary.name}</h2>
          <code>{temporary.password}</code>
          <p>
            ส่งให้เจ้าของบัญชีโดยตรง ระบบจะให้เปลี่ยนรหัสเมื่อเข้าสู่ระบบ
            และแสดงรหัสนี้เฉพาะครั้งนี้
          </p>
          <Button variant="outline" onClick={() => setTemporary(null)}>
            ปิดรหัสชั่วคราว
          </Button>
        </div>
      )}
      <div className="school-users-list">
        {users.map((user) => {
          const completed = user.progress.filter(
            (p) =>
              p.percent === 100 && lessons.some((l) => l.id === p.lesson_id)
          ).length;
          return (
            <article key={user.id} className="school-user-row">
              <div className="school-user-info">
                <strong>{user.displayName}</strong>
                <span>
                  @{user.username}
                  {user.email ? ` · ${user.email}` : ""}
                </span>
                <small>
                  สมัคร {new Date(user.createdAt).toLocaleDateString("th-TH")} ·{" "}
                  {user.lastLogin
                    ? `เข้าสู่ระบบล่าสุด ${new Date(user.lastLogin).toLocaleDateString("th-TH")}`
                    : "ยังไม่เคยเข้าสู่ระบบ"}
                </small>
              </div>
              <span className={`school-status ${user.status}`}>
                {statuses[user.status]}
              </span>
              <div className="school-user-progress">
                <strong>
                  {completed}/{lessons.length}
                </strong>
                <small>บทเรียนจบแล้ว</small>
                <Button variant="link" onClick={() => setSelected(user)}>
                  ดูรายละเอียด
                </Button>
              </div>
              <div className="school-user-actions">
                {user.status === "pending" && (
                  <Button
                    disabled={busy}
                    onClick={() => change(user, { status: "active" })}
                  >
                    <Check size={16} /> อนุมัติ
                  </Button>
                )}
                {school.user.role === "admin" && user.id !== school.user.id && (
                  <>
                    <label className="school-role-control">
                      สิทธิ์
                      <select
                        aria-label={`สิทธิ์ของ ${user.username}`}
                        value={user.role}
                        disabled={busy}
                        onChange={(e) => {
                          const role = e.target.value;
                          if (
                            role === "admin" &&
                            !window.confirm(
                              `มอบสิทธิ์แอดมินให้ @${user.username}? บัญชีนี้จะจัดการผู้ใช้ สิทธิ์ และตั้งค่า AI ได้`
                            )
                          ) {
                            e.target.value = user.role;
                            return;
                          }
                          change(user, { role });
                        }}
                      >
                        {Object.entries(roles).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        change(user, {
                          status:
                            user.status === "suspended"
                              ? "active"
                              : "suspended",
                        })
                      }
                    >
                      {user.status === "suspended" ? "เปิดบัญชี" : "ระงับบัญชี"}
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        setSelected({ ...user, resetConfirm: true })
                      }
                    >
                      <KeyRound size={16} /> รีเซ็ตรหัส
                    </Button>
                  </>
                )}
                {user.id === school.user.id && (
                  <span className="school-self">
                    บัญชีของคุณ · {roles[user.role]}
                  </span>
                )}
              </div>
            </article>
          );
        })}
        {!users.length && (
          <p>{busy ? "กำลังโหลดรายชื่อ…" : "ยังไม่พบผู้สมัครที่ตรงกับคำค้น"}</p>
        )}
        {hasMore && <p>แสดง 100 รายการแรก ใช้คำค้นเพื่อค้นหาผู้ใช้เพิ่มเติม</p>}
      </div>
      {selected && (
        <section className="school-member-detail">
          <div className="board-form-heading">
            <h2>
              {selected.resetConfirm
                ? "ยืนยันรีเซ็ตรหัสผ่าน"
                : "ความก้าวหน้าของ"}{" "}
              {selected.displayName}
            </h2>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              ปิด
            </Button>
          </div>
          {selected.resetConfirm ? (
            <>
              <p>
                บัญชีนี้จะออกจากทุกเครื่อง
                และต้องใช้รหัสชั่วคราวเพื่อเปลี่ยนเป็นรหัสส่วนตัว
              </p>
              <Button
                disabled={busy}
                onClick={() => {
                  reset(selected);
                  setSelected(null);
                }}
              >
                ยืนยันรีเซ็ตรหัส
              </Button>
            </>
          ) : (
            <div>
              {lessons.map((lesson) => {
                const item = selected.progress.find(
                  (p) => p.lesson_id === lesson.id
                );
                return (
                  <div className="school-member-lesson" key={lesson.id}>
                    <span>{lesson.title}</span>
                    <span>
                      {item
                        ? `${item.percent}%${item.total ? ` · ${item.score}/${item.total} ข้อ` : ""}`
                        : "ยังไม่เริ่ม"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
export function AISettings() {
  const [model, setModel] = useState("gemini-3.8-flash"),
    [key, setKey] = useState(""),
    [configured, setConfigured] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    schoolRequest("/settings")
      .then((r) => {
        setModel(r.model);
        setConfigured(r.configured);
      })
      .catch((e) => setError(e.message));
  }, []);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await schoolRequest("/settings", {
        method: "POST",
        body: { model, apiKey: key },
      });
      setKey("");
      const value = await schoolRequest("/settings");
      setConfigured(value.configured);
      setNotice("บันทึกการตั้งค่าแล้ว กรุณาทดสอบการเชื่อมต่อ");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function test() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await schoolRequest("/settings/test", { method: "POST" });
      setNotice("เรียก Gemini จริงสำเร็จ พร้อมตอบจากเอกสารบทเรียน");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="school-management">
      <header className="geography-heading">
        <div>
          <span className="geography-eyebrow">
            <ShieldCheck size={17} />
            เฉพาะผู้ดูแลระบบ
          </span>
          <h1>ตั้งค่า AI</h1>
          <p>
            API key เก็บแบบเข้ารหัสฝั่งเซิร์ฟเวอร์
            ไม่ส่งกลับมายังหน้าจอหรือฝังใน React
          </p>
        </div>
      </header>
      <form className="school-form school-settings" onSubmit={save}>
        {error && (
          <div role="alert" className="school-error">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="school-notice">
            {notice}
          </div>
        )}
        <p>
          สถานะ:{" "}
          <strong>
            {configured ? "ตั้งค่า API key แล้ว" : "ยังไม่ได้ตั้งค่า API key"}
          </strong>
        </p>
        <label>
          ชื่อโมเดล Gemini
          <Input
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gemini-3.8-flash"
          />
        </label>
        <label>
          Gemini API key
          <Input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
            placeholder={
              configured
                ? "เว้นว่างเพื่อใช้ key เดิม"
                : "ใส่ key ของบัญชี Google AI Studio"
            }
          />
        </label>
        <Button type="submit" disabled={busy}>
          <Save size={17} /> บันทึกการตั้งค่า
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={busy || !configured}
          onClick={test}
        >
          {busy ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <Check size={17} />
          )}{" "}
          ทดสอบเรียก Gemini จริง
        </Button>
        <p>
          จำกัดคำถาม 8 ครั้งต่อนาที และ 80 ครั้งต่อวันต่อบัญชี
          ระบบปฏิเสธคำถามที่ไม่พบหลักฐานในเอกสาร
        </p>
      </form>
    </section>
  );
}
export function Account({ school }) {
  return (
    <section className="school-account">
      <div>
        <h1>บัญชีของฉัน</h1>
        <p>
          {school.user.displayName} · @{school.user.username} ·{" "}
          {roles[school.user.role]}
        </p>
      </div>
      <ChangePassword onSaved={school.reload} onLogout={school.logout} />
    </section>
  );
}
