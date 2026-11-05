import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Globe2,
  MapPin,
  MessageSquare,
  Search,
} from "lucide-react";
import { PageWrapper } from "@/mentingo/components/PageWrapper";
import { Button } from "@/mentingo/components/ui/button";
import { Input } from "@/mentingo/components/ui/input";
import { CASE_STUDIES } from "./caseStudies";
export default function CaseStudies({ onOpenLesson, onDiscuss, lessons = [] }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const entries = CASE_STUDIES.map((entry) => {
    const lesson = lessons.find((item) => item.id === entry.id);
    return lesson
      ? { ...entry, title: lesson.title, summary: lesson.description }
      : entry;
  }).filter(
    (entry) =>
      (!country || entry.country === country) &&
      `${entry.title} ${entry.country} ${entry.year} ${entry.summary}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  return (
    <PageWrapper isBarebones className="geography-cases">
      <header className="geography-heading">
        <div>
          <span className="geography-eyebrow">
            <Globe2 size={16} />
            ภูมิศาสตร์ · มัธยมศึกษาตอนปลาย
          </span>
          <h1>ฝุ่นและควันพิษ ผ่านพื้นที่และเวลา</h1>
          <p>6 กรณีศึกษาจาก 5 ประเทศ ตั้งแต่ 1948–2026</p>
        </div>
        <Button variant="outline" onClick={() => onDiscuss("")}>
          <MessageSquare size={18} /> บอร์ดสนทนา
        </Button>
      </header>
      <div className="case-tools">
        <label className="case-search">
          <Search size={18} />
          <Input
            aria-label="ค้นหากรณีศึกษา"
            placeholder="ค้นหาประเทศ เมือง หรือปี"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="ประเทศของกรณีศึกษา"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="">ทุกประเทศ</option>
          {[...new Set(CASE_STUDIES.map((c) => c.country))].map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </div>
      <div className="case-timeline" aria-label="กรณีศึกษาเรียงตามปี">
        {entries.map((entry) => (
          <article key={entry.id} className="case-timeline-row">
            <div className="case-year">
              <span>{entry.year}</span>
              <small>{entry.country}</small>
            </div>
            <div className="case-story">
              <span className="case-place">
                <MapPin size={14} />
                {entry.place} · {entry.period}
              </span>
              <h2>{entry.title}</h2>
              <p>{entry.summary}</p>
              <div className="case-row-actions">
                <Button onClick={() => onOpenLesson(entry.id)}>
                  <BookOpen size={16} /> เรียนกรณีนี้ <ArrowRight size={16} />
                </Button>
                <Button variant="ghost" onClick={() => onDiscuss(entry.id)}>
                  <MessageSquare size={16} /> ชวนคุย
                </Button>
                <a href={entry.url} target="_blank" rel="noreferrer">
                  {entry.source} ↗
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!entries.length && (
        <p role="status">ไม่พบกรณีศึกษาที่ตรงกัน ลองเปลี่ยนประเทศหรือคำค้น</p>
      )}
      <p className="case-source-note">
        ทบทวนแหล่งข้อมูล 5 พฤศจิกายน 2026 · เนื้อหาสรุปเพื่อการเรียนรู้
        ไม่ใช่ค่าคุณภาพอากาศสด
      </p>
    </PageWrapper>
  );
}
