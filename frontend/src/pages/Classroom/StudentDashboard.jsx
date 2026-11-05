import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Clock3,
  FileText,
  MessageCircle,
  Play,
} from "lucide-react";
import { TOPICS } from "./data";
import EcoChat from "./Chat";
import MentingoCourseCard, { courseCover } from "./MentingoCourseCard";
import "./student-dashboard.css";

const topicLabels = {
  air: {
    title: "มลพิษทางอากาศ",
    eyebrow: "AIR POLLUTION",
    detail: "ฝุ่นเล็ก ๆ กับผลกระทบที่ไม่เล็ก",
  },
  water: {
    title: "มลพิษทางน้ำ",
    eyebrow: "WATER POLLUTION",
    detail: "ตามหาคำตอบใต้ผิวน้ำ",
  },
  plastic: {
    title: "ขยะพลาสติก",
    eyebrow: "PLASTIC WASTE",
    detail: "จากของใช้ สู่ห่วงโซ่อาหาร",
  },
  climate: {
    title: "วิกฤตภูมิอากาศ",
    eyebrow: "CLIMATE CHANGE",
    detail: "เข้าใจโลกที่อุ่นขึ้น",
  },
};

export default function StudentDashboard({
  data,
  classroom,
  available,
  name,
  demo,
  progress,
  onResume,
  onOpenLesson,
  onLessons,
  onAsk,
  onConversation,
}) {
  const previous = data.lastLesson;
  const continued =
    previous && data.lessons.find((entry) => entry.id === previous.lessonId);
  const featured = continued || available[0];
  const featuredProgress = continued
    ? data.progress[`${previous.classroomId}:${continued.id}`]?.percent || 0
    : featured
      ? progress(featured.id)
      : 0;
  const completed = available.filter(
    (entry) => progress(entry.id) === 100
  ).length;
  const totalProgress = available.length
    ? Math.round(
        available.reduce((sum, entry) => sum + progress(entry.id), 0) /
          available.length
      )
    : 0;
  return (
    <div className="student-dashboard">
      <header className="dashboard-greeting">
        <div>
          <h1>สวัสดี, {name}</h1>
          <p>วันนี้มาเข้าใจโลกให้มากขึ้นอีกนิด</p>
        </div>
        <button className="dashboard-ai-shortcut" onClick={onAsk}>
          <MessageCircle size={19} /> ถาม Eco AI <ArrowUpRight size={16} />
        </button>
        <div
          className="dashboard-course-progress"
          aria-label={`เรียนจบ ${completed} จาก ${available.length} บทเรียน`}
        >
          <span
            className="course-progress-ring"
            style={{ "--course-progress": `${totalProgress}%` }}
          >
            <BookOpen size={18} />
          </span>
          <div>
            <strong>
              {completed}
              <span> / {available.length}</span>
            </strong>
            <small>บทเรียนที่เรียนจบ</small>
          </div>
        </div>
      </header>
      <div className="dashboard-layout">
        <div className="dashboard-learning">
          <section
            className="dashboard-feature"
            aria-labelledby="continue-heading"
          >
            <img
              className="feature-photo"
              src={courseCover(featured?.topic)}
              alt=""
              width="1400"
              height="934"
              fetchpriority="high"
            />
            <div className="feature-photo-shade" aria-hidden="true" />
            <div className="feature-copy">
              <span className="feature-eyebrow">
                <span />{" "}
                {continued ? "เรียนต่อจากครั้งล่าสุด" : "บทเรียนถัดไปของคุณ"}
              </span>
              <h2 id="continue-heading">
                {featured?.title || "ยังไม่มีบทเรียนในห้องนี้"}
              </h2>
              <div className="feature-meta">
                <span>
                  <Clock3 size={14} /> {featured?.minutes || 0} นาที
                </span>
                <span>
                  <BookOpen size={14} /> บทเรียนและกิจกรรม
                </span>
              </div>
              <div className="feature-actions">
                <button
                  className="feature-start"
                  onClick={onResume}
                  disabled={!featured}
                >
                  <Play size={15} fill="currentColor" /> เรียนต่อ{" "}
                  <ArrowRight size={17} />
                </button>
                <div className="feature-progress">
                  <span>
                    ความก้าวหน้า <strong>{featuredProgress}%</strong>
                  </span>
                  <div
                    role="progressbar"
                    aria-label="ความก้าวหน้าบทเรียนที่เรียนต่อ"
                    aria-valuenow={featuredProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <i style={{ width: `${featuredProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section
            className="dashboard-topics"
            aria-labelledby="topics-heading"
          >
            <div className="dashboard-section-heading">
              <div>
                <h2 id="topics-heading">สำรวจบทเรียน</h2>
              </div>
              <button onClick={onLessons}>
                ดูบทเรียนทั้งหมด <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="dashboard-topic-grid">
              {TOPICS.map((topic) => {
                const entries = available.filter(
                  (entry) => entry.topic === topic.id
                );
                const percent = entries.length
                  ? Math.round(
                      entries.reduce(
                        (sum, entry) => sum + progress(entry.id),
                        0
                      ) / entries.length
                    )
                  : 0;
                const labels = topicLabels[topic.id];
                return (
                  <MentingoCourseCard
                    key={topic.id}
                    title={labels.title}
                    description={labels.detail}
                    topic={topic.id}
                    category={labels.eyebrow}
                    estimatedDurationMinutes={entries.reduce(
                      (sum, entry) => sum + (entry.minutes || 0),
                      0
                    )}
                    lessonCount={entries.length}
                    progressPercent={percent}
                    onSelect={() => entries[0] && onOpenLesson(entries[0].id)}
                  />
                );
              })}
            </div>
          </section>
          <div className="dashboard-learning-note">
            <FileText size={16} />
            <span>เรียนจากเอกสารคุณครู · ตรวจสอบแหล่งอ้างอิงได้</span>
          </div>
        </div>
        <aside className="dashboard-tutor" aria-label="ถามผู้ช่วยจากหน้าแรก">
          <EcoChat
            key={`dashboard-${classroom?.id}`}
            classroom={classroom}
            documents={data.documents}
            demo={demo}
            dashboard
            conversations={data.conversations}
            onConversation={onConversation}
          />
        </aside>
      </div>
    </div>
  );
}
