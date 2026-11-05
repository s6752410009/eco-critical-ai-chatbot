/** Adapted from Selleo/mentingo HeroBanner.tsx, MIT © 2024 Selleo. */
import { BookOpen, Clock3, MessageCircle, Play } from "lucide-react";
import { courseCover } from "./MentingoCourseCard";
export default function MentingoHeroBanner({
  lesson,
  progress,
  continued,
  onResume,
  onAsk,
}) {
  return (
    <section className="mentingo-catalog-hero" aria-label="บทเรียนแนะนำ">
      <div className="catalog-hero-media">
        <img
          src={courseCover(lesson?.topic)}
          alt=""
          width="1400"
          height="934"
          fetchpriority="high"
        />
        <div className="catalog-hero-fade" aria-hidden="true" />
      </div>
      <div className="catalog-hero-content">
        <div className="catalog-hero-copy">
          <span className="catalog-hero-eyebrow">
            {continued ? "เรียนต่อจากครั้งล่าสุด" : "บทเรียนแนะนำสำหรับคุณ"}
          </span>
          <h1>{lesson?.title || "ยังไม่มีบทเรียนในห้องนี้"}</h1>
          <div className="catalog-hero-meta">
            <span>
              <Clock3 size={16} />
              {lesson?.minutes || 0} นาที
            </span>
            <span>
              <BookOpen size={16} />
              บทเรียนและกิจกรรม
            </span>
          </div>
          <div className="catalog-hero-actions">
            <button
              className="feature-start"
              onClick={onResume}
              disabled={!lesson}
            >
              <Play size={16} fill="currentColor" />
              เรียนต่อ
            </button>
            <button className="catalog-ask-ai" onClick={onAsk}>
              <MessageCircle size={17} />
              ถาม Eco AI
            </button>
          </div>
          <div className="catalog-continue-progress">
            <div
              role="progressbar"
              aria-label="ความก้าวหน้าบทเรียนที่เรียนต่อ"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
