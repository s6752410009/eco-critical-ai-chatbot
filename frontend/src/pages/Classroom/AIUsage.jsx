import { useCallback, useEffect, useState } from "react";
import { Bell, Download, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/mentingo/components/ui/button";
import { Input } from "@/mentingo/components/ui/input";
import { schoolRequest } from "./SchoolApp";
const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(n / 1e9);
const count = (n) => new Intl.NumberFormat("th-TH").format(n);
const labels = {
  chat: "ตอบคำถาม",
  ocr: "อ่านรูป / PDF",
  connection_test: "ทดสอบการเชื่อมต่อ",
};
const currentMonth = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
function Alert({ report }) {
  const exceeded = report.alert === "exceeded";
  if (!exceeded && report.alert !== "warning") return null;
  return (
    <div className={`usage-alert ${exceeded ? "exceeded" : ""}`} role="status">
      <Bell size={20} />
      <div>
        <strong>
          {exceeded
            ? "ค่าใช้จ่าย GPT ถึงงบที่ตั้งไว้แล้ว"
            : "ค่าใช้จ่าย GPT ใกล้ถึงงบแล้ว"}
        </strong>
        <p>
          ใช้ไป {report.percent.toFixed(1)}% ของงบ $
          {report.settings.monthlyUsd.toFixed(2)} / เดือน · ระบบยังให้ใช้งานต่อ
        </p>
      </div>
    </div>
  );
}
export function UsageNotice({ onOpen }) {
  const [report, setReport] = useState(null),
    [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const load = () => {
      if (document.hidden) return;
      schoolRequest("/usage")
        .then((r) => {
          if (active) {
            setReport(r);
            setError(false);
          }
        })
        .catch(() => {
          if (active) setError(true);
        });
    };
    load();
    const timer = setInterval(load, 60000);
    document.addEventListener("visibilitychange", load);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);
  if (error)
    return (
      <div className="usage-alert" role="status">
        ตรวจสถานะงบ GPT ไม่สำเร็จ{" "}
        <button onClick={onOpen}>เปิดรายงานเพื่อลองใหม่</button>
      </div>
    );
  if (!report || !["warning", "exceeded"].includes(report.alert)) return null;
  return (
    <div className="usage-notice">
      <Alert report={report} />
      <Button variant="outline" onClick={onOpen}>
        ดูค่าใช้จ่าย GPT
      </Button>
    </div>
  );
}
export default function AIUsage({ school }) {
  const [month, setMonth] = useState(currentMonth),
    [report, setReport] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(false),
    [saving, setSaving] = useState(false);
  const [limit, setLimit] = useState("10"),
    [threshold, setThreshold] = useState("80");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await schoolRequest("/usage?month=" + month);
      setReport(r);
      setLimit(String(r.settings.monthlyUsd));
      setThreshold(String(r.settings.warningPercent));
    } catch (e) {
      setError(e.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [month]);
  useEffect(() => {
    load();
  }, [load]);
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");
    try {
      await schoolRequest("/usage", {
        method: "POST",
        body: { monthlyUsd: Number(limit), warningPercent: Number(threshold) },
      });
      await load();
      setNotice("บันทึกงบและเกณฑ์แจ้งเตือนแล้ว");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  function download() {
    const rows = [
      [
        "วันที่ (Asia/Bangkok)",
        "จำนวนคำขอ",
        "Input tokens",
        "Cached tokens",
        "Output tokens",
        "ค่าใช้จ่ายประมาณการ USD",
        "รายการไม่ทราบราคา",
      ],
      ...report.daily.map((r) => [
        r.day,
        r.requests,
        r.inputTokens,
        r.cachedTokens,
        r.outputTokens,
        (r.costNano / 1e9).toFixed(9),
        r.unpriced,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + rows.map((row) => row.join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `gpt-usage-${month}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="school-management usage-page">
      <header className="geography-heading">
        <div>
          <span className="geography-eyebrow">
            <Wallet size={18} /> สำหรับครูและแอดมิน
          </span>
          <h1>ค่าใช้จ่าย GPT</h1>
          <p>ดูการใช้จริงจากแชทและ OCR ในห้องเรียนนี้</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw size={16} /> รีเฟรชรายงาน
        </Button>
      </header>
      <div className="usage-toolbar">
        <label>
          เดือนที่รายงาน
          <Input
            type="month"
            value={month}
            min="2020-01"
            max="2099-12"
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value);
            }}
          />
        </label>
        <Button
          variant="outline"
          disabled={!report || loading}
          onClick={download}
        >
          <Download size={16} /> ดาวน์โหลด CSV
        </Button>
      </div>
      {error && (
        <div role="alert" className="school-error">
          {error}
        </div>
      )}
      {notice && (
        <p role="status" className="school-notice">
          {notice}
        </p>
      )}
      {loading && <p role="status">กำลังโหลดรายงาน…</p>}
      {report && (
        <>
          <Alert report={report} />
          {report.totals.unpriced > 0 && (
            <div className="usage-alert" role="status">
              มี {count(report.totals.unpriced)} คำขอที่ยังไม่ทราบค่าใช้จ่าย
              (เช่น เชื่อมต่อขัดข้อง หรือโมเดลที่ไม่มีตารางราคา)
              ยอดรวมจึงอาจต่ำกว่าค่าบริการจริง
            </div>
          )}
          <div className="usage-metrics">
            <div>
              <span>ค่าใช้จ่ายประมาณการ</span>
              <strong>{money(report.totals.costNano)}</strong>
              <small>USD · คิดจาก token ที่ API รายงาน</small>
            </div>
            <div>
              <span>คำขอทั้งหมด</span>
              <strong>{count(report.totals.requests)}</strong>
              <small>รวมคำขอที่ไม่สำเร็จ</small>
            </div>
            <div>
              <span>Token รับเข้า / ตอบกลับ</span>
              <strong>
                {count(report.totals.inputTokens)} /{" "}
                {count(report.totals.outputTokens)}
              </strong>
              <small>
                Cached input {count(report.totals.cachedTokens)} tokens
              </small>
            </div>
          </div>
          <section className="usage-budget" aria-label="งบรายเดือน">
            <h2>งบรายเดือน</h2>
            <p>
              {report.settings.monthlyUsd === 0
                ? "ปิดการแจ้งเตือนงบ"
                : `งบ $${report.settings.monthlyUsd.toFixed(2)} · ใช้ไป ${(report.percent || 0).toFixed(1)}%`}
            </p>
            {report.percent !== null && (
              <progress
                aria-label="สัดส่วนงบที่ใช้"
                value={Math.min(report.percent, 100)}
                max="100"
              />
            )}
            {school.user.role === "admin" ? (
              <form onSubmit={save}>
                <label>
                  งบต่อเดือน (USD)
                  <Input
                    type="number"
                    min="0"
                    max="100000"
                    step="0.01"
                    required
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                  />
                </label>
                <label>
                  แจ้งเตือนเมื่อใช้ถึง (%)
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    step="1"
                    required
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                  />
                </label>
                <Button type="submit" disabled={saving || loading}>
                  {saving ? "กำลังบันทึก…" : "บันทึกงบ"}
                </Button>
              </form>
            ) : (
              <p>แอดมินเป็นผู้แก้ไขงบและเกณฑ์แจ้งเตือน</p>
            )}
            <small>
              งบเป็นเกณฑ์แจ้งเตือน ไม่ตัดการใช้งานอัตโนมัติ · ตั้ง 0
              เพื่อปิดการเตือน · ใช้เกณฑ์เดียวกันทุกเดือน
              และเริ่มนับเดือนใหม่ตามเวลาไทย
            </small>
          </section>
          <section className="usage-table-section">
            <h2>แยกตามงานและโมเดล</h2>
            <div
              className="usage-table-scroll"
              tabIndex="0"
              role="region"
              aria-label="ค่าใช้จ่ายแยกตามงาน"
            >
              <table>
                <thead>
                  <tr>
                    <th>งาน / โมเดล</th>
                    <th>คำขอ</th>
                    <th>ประมาณการ USD</th>
                    <th>ไม่ทราบราคา</th>
                  </tr>
                </thead>
                <tbody>
                  {report.breakdown.map((r) => (
                    <tr key={r.purpose + r.model}>
                      <td>
                        {labels[r.purpose] || r.purpose}
                        <small>{r.model}</small>
                      </td>
                      <td>{count(r.requests)}</td>
                      <td>{money(r.costNano)}</td>
                      <td>{r.unpriced}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!report.breakdown.length && (
              <p className="usage-empty">
                ยังไม่มีการเรียก GPT ในเดือนนี้ เมื่อมีการถามหรืออ่านเอกสาร
                รายการจะแสดงที่นี่
              </p>
            )}
          </section>
          <section className="usage-table-section">
            <h2>การใช้งานรายวัน</h2>
            <div
              className="usage-table-scroll"
              tabIndex="0"
              role="region"
              aria-label="ค่าใช้จ่ายรายวัน"
            >
              <table>
                <thead>
                  <tr>
                    <th>วันที่ (เวลาไทย)</th>
                    <th>คำขอ</th>
                    <th>Input / Output tokens</th>
                    <th>ประมาณการ USD</th>
                  </tr>
                </thead>
                <tbody>
                  {report.daily.map((r) => (
                    <tr key={r.day}>
                      <td>{r.day}</td>
                      <td>{count(r.requests)}</td>
                      <td>
                        {count(r.inputTokens)} / {count(r.outputTokens)}
                      </td>
                      <td>{money(r.costNano)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p className="usage-footnote">
            เริ่มบันทึกหลังอัปเดตระบบนี้ ไม่รวมการใช้คีย์จากเว็บอื่น ภาษี
            หรือยอดก่อนติดตั้ง · รายงานเป็นประมาณการ ไม่ใช่ใบแจ้งหนี้ OpenAI ·{" "}
            <a href={report.priceSource} target="_blank" rel="noreferrer">
              อัตราราคา GPT-6 Luna
            </a>{" "}
            ตรวจสอบ 6 พ.ย. 2026 · หากเปลี่ยนเป็นโมเดลอื่นที่ยังไม่มีราคา
            จะแสดงจำนวน token พร้อมแจ้งว่าประเมินราคาไม่ได้
          </p>
        </>
      )}
    </section>
  );
}
