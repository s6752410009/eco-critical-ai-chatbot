import { useState } from "react";
import {
  Check,
  X,
  RotateCcw,
  ArrowRight,
  Recycle,
  Leaf,
  ShieldAlert,
  Trash2,
} from "lucide-react";
export function PollutionExplorer() {
  const [value, setValue] = useState(25);
  return (
    <section className="activity pm-explorer">
      <div className="section-kicker">ทดลองด้วยตัวเอง</div>
      <h3>ถ้าปริมาณฝุ่นเปลี่ยนไป?</h3>
      <div className="pm-scene" aria-hidden="true">
        <svg viewBox="0 0 420 120" fill="none">
          <path d="M0 105h420v15H0z" fill="#d7e9ff" />
          <path
            d="M30 105V57h42v48M83 105V35h48v70M145 105V65h42v40M218 105V49h50v56M301 105V64h56v41"
            fill="#73aafa"
          />
          {Array.from({ length: Math.round(value * 0.6) + 5 }, (_, i) => (
            <circle
              key={i}
              cx={12 + ((i * 53) % 400)}
              cy={7 + ((i * 31) % 87)}
              r={1.3 + (i % 3) * 0.5}
              fill="#1769e0"
              opacity=".6"
            />
          ))}
        </svg>
        <div className="pm-value">
          <strong>{value}</strong>
          <span>µg/m³</span>
        </div>
      </div>
      <label className="range-label" htmlFor="pm-slider">
        ปรับความเข้มข้นในแบบจำลอง <strong>{value} µg/m³</strong>
      </label>
      <input
        id="pm-slider"
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
      />
      <div className="range-ends">
        <span>ฝุ่นน้อยลง</span>
        <span>ฝุ่นมากขึ้น</span>
      </div>
      <p className="activity-feedback">
        {value < 30
          ? "อนุภาคในอากาศของแบบจำลองมีน้อยลง ลองเพิ่มค่าแล้วสังเกตสิ่งที่เปลี่ยนไป"
          : value < 65
            ? "ในปริมาตรอากาศเท่าเดิม มีมวลอนุภาคฝุ่นเพิ่มขึ้น แต่ตาเปล่าไม่ได้บอกความเข้มข้นได้แม่นยำ"
            : "จำนวนจุดหนาแน่นขึ้นใช้สื่อถึงฝุ่นที่มากขึ้น การประเมินสถานการณ์จริงยังต้องมีข้อมูลการวัดและช่วงเวลา"}
      </p>
      <small>
        แบบจำลองเพื่อการเรียนรู้ · ไม่ใช่ข้อมูลเซนเซอร์สด ไม่ใช่ค่า AQI
        หรือเกณฑ์แนะนำสุขภาพ
      </small>
    </section>
  );
}
const ITEMS = [
  {
    name: "ขวดน้ำพลาสติกสะอาดและแห้ง",
    category: "รีไซเคิล",
    explanation:
      "แยกเป็นวัสดุรีไซเคิลตามระบบรับของพื้นที่ และทำให้สะอาดแห้งก่อนส่งต่อ",
  },
  {
    name: "เปลือกกล้วย",
    category: "อินทรีย์",
    explanation:
      "แยกเศษอาหารและวัสดุอินทรีย์ หากมีระบบเหมาะสมสามารถนำไปทำปุ๋ยได้",
  },
  {
    name: "ถ่านไฟฉายใช้แล้ว",
    category: "อันตราย",
    explanation:
      "รวบรวมไปยังจุดรับขยะอันตราย ไม่ปะปนกับเศษอาหารหรือวัสดุรีไซเคิล",
  },
];
export function WasteSorting() {
  const [item, setItem] = useState(0);
  const [choice, setChoice] = useState("");
  const [solved, setSolved] = useState([]);
  const current = ITEMS[item];
  function choose(category) {
    setChoice(category);
    if (category === current.category)
      setSolved((prev) => [...new Set([...prev, item])]);
  }
  return (
    <section className="activity waste-activity">
      <div className="section-kicker">กิจกรรมคัดแยกขยะ</div>
      <h3>ชิ้นนี้ควรไปที่ไหน?</h3>
      <div className="item-selector">
        {ITEMS.map((entry, index) => (
          <button
            key={entry.name}
            className={item === index ? "selected" : ""}
            onClick={() => {
              setItem(index);
              setChoice("");
            }}
          >
            {index + 1}
            {solved.includes(index) && <Check size={13} />}
          </button>
        ))}
      </div>
      <div className="waste-item" key={item}>
        {current.name}
      </div>
      <div className="waste-bins">
        {["รีไซเคิล", "อินทรีย์", "อันตราย", "ทั่วไป"].map((category) => (
          <button
            key={category}
            className={`bin bin-${category} ${choice === category ? "selected" : ""}`}
            onClick={() => choose(category)}
          >
            <span aria-hidden="true">
              {category === "รีไซเคิล" && <Recycle />}
              {category === "อินทรีย์" && <Leaf />}
              {category === "อันตราย" && <ShieldAlert />}
              {category === "ทั่วไป" && <Trash2 />}
            </span>
            {category}
          </button>
        ))}
      </div>
      {choice && (
        <p
          key={`${item}-${choice}`}
          className={`answer-feedback ${choice === current.category ? "correct" : "incorrect"}`}
          role="status"
        >
          {choice === current.category ? (
            <>
              <Check size={18} />
              {current.explanation}
            </>
          ) : (
            <>
              <X size={18} />
              ลองอีกครั้ง พิจารณาวัสดุและปลายทางที่เหมาะสม
            </>
          )}
        </p>
      )}
      <small>
        สำเร็จ {solved.length}/{ITEMS.length} ชิ้น ·
        สีและระบบรับขยะอาจต่างกันในแต่ละพื้นที่ ให้ยึดป้ายของจุดรับ
      </small>
    </section>
  );
}
export function KnowledgeCheck({ lesson, onFinish }) {
  const [answers, setAnswers] = useState({});
  if (!lesson.quiz?.length)
    return (
      <section className="knowledge-check">
        <p>อ่านบทเรียนครบแล้ว บันทึกความก้าวหน้าของคุณได้</p>
        <button className="button" onClick={() => onFinish(0, 0, {})}>
          บันทึกว่าเรียนจบแล้ว <ArrowRight size={17} />
        </button>
      </section>
    );
  const all = Object.keys(answers).length === lesson.quiz.length;
  const score = lesson.quiz.reduce(
    (sum, question, index) =>
      sum + (answers[index] === question.answer ? 1 : 0),
    0
  );
  return (
    <section className="knowledge-check">
      <div className="section-kicker">เช็กความเข้าใจ</div>
      <h2>ลองทบทวนด้วยตัวเอง</h2>
      {lesson.quiz.map((question, index) => (
        <div className="quiz-question" key={question.question}>
          <h3>
            <span>{index + 1}.</span> {question.question}
          </h3>
          <div className="quiz-options">
            {question.options.map((option, choice) => (
              <button
                key={option}
                className={`${answers[index] === choice ? "is-chosen" : ""} ${answers[index] !== undefined && question.answer === choice ? "is-correct" : ""}`}
                onClick={() =>
                  setAnswers((prev) => ({ ...prev, [index]: choice }))
                }
              >
                <span>{String.fromCharCode(65 + choice)}</span>
                {option}
                {answers[index] === choice &&
                  (choice === question.answer ? (
                    <Check size={18} />
                  ) : (
                    <X size={18} />
                  ))}
              </button>
            ))}
          </div>
          {answers[index] !== undefined && (
            <p className="quiz-explanation" role="status">
              {question.explanation}
            </p>
          )}
        </div>
      ))}
      {all && (
        <div className="quiz-result">
          <div>
            <strong>
              ทบทวนแล้ว {score}/{lesson.quiz.length} ข้อ
            </strong>
            <p>กลับไปอ่านเหตุผลของแต่ละคำตอบได้เสมอ</p>
          </div>
          <button
            className="button"
            onClick={() => onFinish(score, lesson.quiz.length, answers)}
          >
            บันทึกผลและจบบทเรียน <ArrowRight size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="ลองทำแบบทดสอบใหม่"
            onClick={() => setAnswers({})}
          >
            <RotateCcw size={17} />
          </button>
        </div>
      )}
    </section>
  );
}
