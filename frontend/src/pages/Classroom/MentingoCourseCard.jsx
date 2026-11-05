/**
 * Adapted from Selleo/mentingo ModernCourseCard.tsx, MIT © 2024 Selleo.
 * Pinned original and full license: /third_party/mentingo/.
 * React Router and existing Eco lesson callbacks replace Remix/API dependencies.
 * Static cover/progress variant: no video autoplay, popout-only content, or new API.
 */
import { memo } from "react";
import { ArrowUpRight, BookOpen, Clock3, Play } from "lucide-react";

export const courseCover = (topic) =>
  `/classroom/${["air", "water", "plastic", "climate"].includes(topic) ? topic : "air"}.jpg`;

function MentingoCourseCard({
  title,
  description,
  topic,
  category,
  estimatedDurationMinutes,
  lessonCount,
  progressPercent = 0,
  onSelect,
}) {
  const progress = Math.max(0, Math.min(100, progressPercent));
  return (
    <button
      type="button"
      className={`mentingo-course-card topic-card course-${topic}`}
      onClick={onSelect}
      disabled={!lessonCount}
      aria-label={`${title} · ${lessonCount ? (progress === 100 ? "ทบทวนบทเรียน" : "เริ่มเรียน") : "ยังไม่มีบทเรียน"}`}
    >
      <div className="course-card-media">
        <img
          src={courseCover(topic)}
          alt=""
          width="640"
          height="360"
          decoding="async"
          onError={(event) => {
            if (!event.currentTarget.dataset.fallback) {
              event.currentTarget.dataset.fallback = "true";
              event.currentTarget.src = courseCover("air");
            }
          }}
        />
        <div className="course-card-scrim" aria-hidden="true" />
        <span className="course-category">{category}</span>
        <span className="course-card-open">
          <ArrowUpRight size={17} />
        </span>
        <div className="course-card-overlay">
          <h3>{title}</h3>
          <span>{description}</span>
        </div>
        <span className="course-card-play">
          <Play size={14} fill="currentColor" />
        </span>
      </div>
      <div className="course-card-details">
        <div className="course-card-meta">
          <span>
            <BookOpen size={13} />
            {lessonCount} บทเรียน
          </span>
          <span>
            <Clock3 size={13} />
            {estimatedDurationMinutes || 0} นาที
          </span>
          <strong>{progress}%</strong>
        </div>
        <div
          className="course-card-progress"
          role="progressbar"
          aria-label={`ความก้าวหน้า ${title}`}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </button>
  );
}
export default memo(MentingoCourseCard);
