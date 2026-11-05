import { lazy, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  KeyRound,
  LoaderCircle,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/mentingo/components/ui/button";
import { Input } from "@/mentingo/components/ui/input";
const Classroom = lazy(() => import("./index"));
import "@/mentingo-native.css";
import "./native-brand.css";
import "./school.css";
function curriculumPayload(data) {
  return {
    version: 3,
    classrooms: data.classrooms,
    lessons: data.lessons,
    documents: data.documents.map(
      ({ chunks: Chunks, ...document }) => document
    ),
  };
}
export async function schoolRequest(
  path,
  { method = "GET", body, signal } = {}
) {
  const response = await fetch(`/api/school${path}`, {
    method,
    signal,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...(method !== "GET" ? { body: JSON.stringify(body || {}) } : {}),
  });
  if (!response.headers.get("Content-Type")?.includes("application/json"))
    throw new Error("ไม่พบ API ของระบบบัญชี กรุณารันผ่าน Cloudflare/Wrangler");
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || "ทำรายการไม่สำเร็จ");
    error.status = response.status;
    throw error;
  }
  return result;
}
export function ChangePassword({ onSaved, onLogout, forced = false }) {
  const [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (next !== confirm) {
      setError("รหัสผ่านใหม่ทั้งสองช่องต้องตรงกัน");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await schoolRequest("/auth/password", {
        method: "POST",
        body: { currentPassword: current, newPassword: next },
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      setDone(true);
      onSaved?.(result.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="school-form" onSubmit={submit}>
      <span className="school-form-symbol">
        <KeyRound size={24} />
      </span>
      <h1>{forced ? "ตั้งรหัสผ่านใหม่ก่อนเข้าใช้งาน" : "เปลี่ยนรหัสผ่าน"}</h1>
      <p>
        {forced
          ? "บัญชีนี้ใช้รหัสตั้งต้นหรือรหัสชั่วคราว กรุณาตั้งรหัสส่วนตัวก่อนเข้าห้องเรียน"
          : "เปลี่ยนแล้วระบบจะออกจากเซสชันอื่นของบัญชีนี้"}
      </p>
      {error && (
        <div role="alert" className="school-error">
          {error}
        </div>
      )}
      {done && <p role="status">เปลี่ยนรหัสผ่านแล้ว</p>}
      <label>
        รหัสผ่านปัจจุบัน
        <Input
          type="password"
          required
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </label>
      <label>
        รหัสผ่านใหม่
        <Input
          type="password"
          required
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          aria-label="รหัสผ่านใหม่"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <small>ใช้ข้อความหรือวลีที่จำได้ ยาวอย่างน้อย 12 ตัวอักษร</small>
      </label>
      <label>
        ยืนยันรหัสผ่านใหม่
        <Input
          type="password"
          required
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>
      <Button disabled={busy} type="submit">
        {busy ? (
          <LoaderCircle className="spin" size={18} />
        ) : (
          <Check size={18} />
        )}{" "}
        บันทึกรหัสผ่านใหม่
      </Button>
      {onLogout && (
        <Button type="button" variant="ghost" onClick={onLogout}>
          <LogOut size={16} /> ออกจากระบบ
        </Button>
      )}
    </form>
  );
}
export default function SchoolApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const register = location.pathname === "/register";
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [state, setState] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [displayName, setDisplayName] = useState(""),
    [email, setEmail] = useState(""),
    [setupCode, setSetupCode] = useState("");
  const revision = useRef(0),
    lastSent = useRef(""),
    queue = useRef(Promise.resolve());
  const load = useCallback(async () => {
    setError("");
    try {
      const me = await schoolRequest("/auth/me");
      setUser(me.user);
      if (me.user && me.user.status === "active" && !me.user.mustChange) {
        const loaded = await schoolRequest("/data");
        revision.current = loaded.revision;
        setState(loaded.data);
        lastSent.current = JSON.stringify(curriculumPayload(loaded.data));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (
      ready &&
      user &&
      !user.mustChange &&
      ["/", "/login", "/register"].includes(location.pathname)
    )
      navigate("/app" + location.search, { replace: true });
  }, [ready, user, location.pathname, location.search, navigate]);
  async function submit(event) {
    event.preventDefault();
    if (register && password !== confirm) {
      setError("รหัสผ่านทั้งสองช่องต้องตรงกัน");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await schoolRequest(
        register ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: { username, password, displayName, email, setupCode },
        }
      );
      setUser(result.user);
      setPassword("");
      setConfirm("");
      setSetupCode("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    try {
      await schoolRequest("/auth/logout", { method: "POST" });
      setUser(null);
      setState(null);
      window.location.assign("/login");
    } catch (e) {
      setError(e.message);
    }
  }
  const persist = useCallback((data) => {
    const payload = curriculumPayload(data);
    const text = JSON.stringify(payload);
    if (text === lastSent.current) return Promise.resolve(false);
    const previousSent = lastSent.current;
    lastSent.current = text;
    const operation = queue.current
      .catch(() => {})
      .then(async () => {
        const result = await schoolRequest("/data", {
          method: "PUT",
          body: { data: payload, revision: revision.current },
        });
        revision.current = result.revision;
        return true;
      });
    const guarded = operation.catch((error) => {
      if (lastSent.current === text) lastSent.current = previousSent;
      throw error;
    });
    queue.current = guarded;
    return guarded;
  }, []);
  if (!ready)
    return (
      <main className="school-loading" role="status">
        <LoaderCircle className="spin" /> กำลังตรวจสอบบัญชี…
      </main>
    );
  if (user?.mustChange)
    return (
      <main className="mentingo-root school-auth">
        <ChangePassword forced onSaved={() => load()} onLogout={logout} />
      </main>
    );
  if (user && user.status !== "active")
    return (
      <main className="mentingo-root school-auth">
        <section className="school-form">
          <ShieldCheck size={30} />
          <h1>สมัครแล้ว รอคุณครูอนุมัติ</h1>
          <p>
            บัญชี <strong>{user.username}</strong>{" "}
            ถูกส่งเข้ารายชื่อผู้ขอเข้าเรียนภูมิศาสตร์แล้ว เมื่อครูอนุมัติ
            คุณจะเข้าบทเรียน ถาม AI และใช้บอร์ดได้
          </p>
          {error && <p role="alert">{error}</p>}
          <Button onClick={load}>ตรวจสอบสถานะ</Button>
          <Button variant="outline" onClick={logout}>
            ออกจากระบบ
          </Button>
        </section>
      </main>
    );
  if (user && state)
    return (
      <Classroom
        school={{
          user,
          data: state,
          persist,
          logout,
          reload: load,
          request: schoolRequest,
        }}
      />
    );
  return (
    <main className="mentingo-root school-auth">
      <aside className="school-auth-story">
        <Link className="school-auth-brand" to="/">
          Eco-Critical <span>AI Chatbot</span>
        </Link>
        <div>
          <p>ห้องเรียนภูมิศาสตร์ · มัธยมศึกษาตอนปลาย</p>
          <h2>
            ภูมิศาสตร์
            <br />
            เรื่องใกล้ตัว
          </h2>
          <p>
            เรียนเรื่องฝุ่นและควันจากเหตุการณ์จริง
            <br />
            ในห้องเรียนของเรา
          </p>
        </div>
        <a
          className="school-photo-credit"
          href="https://unsplash.com/photos/7fQwXbLZXf0"
          target="_blank"
          rel="noreferrer"
        >
          ภาพถ่าย Bernd Dittrich / Unsplash
        </a>
      </aside>
      <div className="school-auth-entry">
        <form className="school-form" onSubmit={submit}>
          <span className="geography-eyebrow">Eco-Critical AI Chatbot</span>
          <h1>{register ? "สมัครเข้าเรียน" : "เข้าสู่ห้องเรียน"}</h1>
          <p>
            {register
              ? "สร้างบัญชีนักเรียน แล้วรอครูอนุมัติการเข้าห้องเรียน"
              : "ใช้บัญชีที่สมัครไว้เพื่อเรียนต่อและติดตามความก้าวหน้า"}
          </p>
          {error && (
            <div className="school-error" role="alert">
              {error}
            </div>
          )}
          {register && (
            <>
              <label>
                ชื่อที่ใช้แสดง
                <Input
                  required
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label>
                อีเมล (ไม่บังคับ)
                <Input
                  type="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
            </>
          )}
          <label>
            ชื่อผู้ใช้
            <Input
              required
              minLength={register ? 3 : 1}
              maxLength={32}
              aria-label="ชื่อผู้ใช้"
              aria-describedby={register ? "school-username-help" : undefined}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
            {register && (
              <small id="school-username-help">
                ใช้ a–z ตัวเลข จุด ขีด หรือขีดล่าง 3–32 ตัวอักษร
              </small>
            )}
          </label>
          <label>
            รหัสผ่าน
            <Input
              required
              type="password"
              minLength={register ? 12 : 1}
              maxLength={128}
              aria-label="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={register ? "new-password" : "current-password"}
            />
            {register && <small>ยาวอย่างน้อย 12 ตัวอักษร</small>}
          </label>
          {register && (
            <label>
              ยืนยันรหัสผ่าน
              <Input
                required
                type="password"
                minLength={12}
                maxLength={128}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </label>
          )}
          {!register && username.toLowerCase() === "admin" && (
            <details className="school-setup-field">
              <summary>ตั้งค่าบัญชี admin ครั้งแรก</summary>
              <label>
                รหัสตั้งค่าผู้ดูแล
                <Input
                  type="password"
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value)}
                  autoComplete="off"
                />
              </label>
            </details>
          )}
          <Button disabled={busy} type="submit">
            {busy ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <ArrowRight size={18} />
            )}{" "}
            {register ? "สมัครเข้าเรียน" : "เข้าสู่ระบบ"}
          </Button>
          <p className="school-auth-switch">
            {register ? "มีบัญชีแล้ว?" : "ยังไม่มีบัญชี?"}{" "}
            <Link
              to={register ? "/login" : "/register"}
              onClick={() => setError("")}
            >
              {register ? "เข้าสู่ระบบ" : "สมัครเข้าเรียน"}
            </Link>
          </p>
          {!register && (
            <small className="school-recovery">
              ลืมรหัสผ่าน? ติดต่อครูหรือผู้ดูแลเพื่อรับรหัสชั่วคราว
              แล้วเปลี่ยนรหัสเมื่อเข้าใช้ครั้งถัดไป
            </small>
          )}
        </form>
      </div>
    </main>
  );
}
