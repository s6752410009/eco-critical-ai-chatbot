import { ArrowUpRight, BookOpen, MessageCircle } from "lucide-react";
import { CASE_STUDIES } from "../pages/Classroom/caseStudies";
import { useEcoData } from "./context";
import {
  KnowledgeCheck,
  PollutionExplorer,
  WasteSorting,
} from "../pages/Classroom/Activities";
import EcoChat from "../pages/Classroom/Chat";
import Images from "../pages/Classroom/Images";
import LessonDocuments from "../pages/Classroom/LessonDocuments";
export function LessonContentRenderer({ lesson: nativeLesson }) {
  const bridge = useEcoData();
  const lesson = bridge.data.lessons.find(
    (entry) => entry.id === nativeLesson.id
  );
  if (!lesson) return null;
  const caseStudy = CASE_STUDIES.find(
    (entry) => entry.id === lesson.caseStudyId
  );
  return (
    <div className="eco-native-lesson-body">
      <figure className="eco-native-photo">
        <img
          src={`/classroom/${lesson.topic}.jpg`}
          alt={
            {
              air: "ภาพเมืองและปล่องควัน",
              water: "ลำน้ำและระบบนิเวศ",
              plastic: "ขวดพลาสติกที่ถูกทิ้งบนชายหาด",
              climate: "ธารน้ำแข็ง",
            }[lesson.topic]
          }
        />
        <figcaption>
          ภาพประกอบบทเรียน · ไม่ใช่ภาพเหตุการณ์จริง · Unsplash
        </figcaption>
      </figure>
      <div className="eco-native-lesson-copy">
        <p className="eco-native-lead">{lesson.description}</p>
        <div className="eco-native-reading">
          {lesson.concepts.map((concept, index) => (
            <section key={concept.title}>
              <span className="eco-reading-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2>{concept.title}</h2>
                <p>{concept.body}</p>
              </div>
            </section>
          ))}
        </div>
        <Images images={lesson.images} />
        <LessonDocuments
          documents={bridge.data.documents}
          classroom={bridge.classroom}
          lesson={lesson}
          school={bridge.school}
        />
        {caseStudy && (
          <aside className="case-discussion-invite">
            <h2>ลองตั้งข้อสังเกตจากกรณีนี้</h2>
            <p>{caseStudy.question}</p>
            <a
              href={`${bridge.school ? "/app" : "/demo"}?screen=discussions&class=eco-m5&case=${caseStudy.id}`}
            >
              ชวนเพื่อนคุยในบอร์ด <ArrowUpRight size={16} />
            </a>
          </aside>
        )}
        {lesson.topic === "air" && !caseStudy && <PollutionExplorer />}
        {lesson.topic === "plastic" && <WasteSorting />}
        {lesson.topic === "water" && (
          <section className="activity water-chain">
            <h3>เมื่อน้ำได้รับอินทรียวัตถุมากขึ้น</h3>
            <div>
              {[
                "อินทรียวัตถุเพิ่ม",
                "จุลินทรีย์ย่อยสลาย",
                "ใช้ออกซิเจนมากขึ้น",
                "สัตว์น้ำได้รับผลกระทบ",
              ].map((step, index) => (
                <details key={step}>
                  <summary>
                    <span>{index + 1}</span>
                    {step}
                  </summary>
                  <p>{lesson.concepts[Math.min(index, 2)]?.body}</p>
                </details>
              ))}
            </div>
          </section>
        )}
        <details className="critical-question">
          <summary>
            <BookOpen size={18} />
            เรารู้ได้อย่างไรว่าข้อสรุปนี้น่าเชื่อถือ?
          </summary>
          <p>
            เปรียบเทียบข้อมูลที่มี ข้อมูลที่ยังขาด และคำอธิบายทางเลือก
            ก่อนสรุปหรือเลือกแนวทางแก้ปัญหา
          </p>
        </details>
        <KnowledgeCheck lesson={lesson} onFinish={bridge.onFinish} />
        {lesson.reference && (
          <a
            className="eco-native-reference"
            href={lesson.reference}
            target="_blank"
            rel="noreferrer"
          >
            ตรวจสอบแหล่งข้อมูลของบทเรียน
            <ArrowUpRight size={16} />
          </a>
        )}
        <section className="eco-native-tutor">
          <h2>
            <MessageCircle size={22} />
            ถามจากบทเรียนนี้
          </h2>
          <EcoChat
            key={`native-${bridge.classroom.id}-${lesson.id}`}
            classroom={bridge.classroom}
            lesson={lesson}
            documents={bridge.data.documents}
            demo={bridge.demo}
            school={bridge.school}
            conversations={bridge.data.conversations}
            onConversation={bridge.onConversation}
          />
        </section>
      </div>
    </div>
  );
}
