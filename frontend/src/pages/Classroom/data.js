export const TOPICS = [
  {
    id: "air",
    title: "มลพิษทางอากาศ",
    description: "มองให้เห็นสิ่งที่อยู่ในอากาศรอบตัว",
    tone: "green",
    tag: "AIR & HEALTH",
  },
  {
    id: "water",
    title: "มลพิษทางน้ำ",
    description: "เชื่อมโยงคุณภาพน้ำกับชีวิตในระบบนิเวศ",
    tone: "blue",
    tag: "WATER & LIFE",
  },
  {
    id: "plastic",
    title: "ขยะและไมโครพลาสติก",
    description: "ตามรอยพลาสติกจากมือเราสู่ธรรมชาติ",
    tone: "teal",
    tag: "WASTE & RESOURCES",
  },
  {
    id: "climate",
    title: "ภาวะโลกร้อน",
    description: "เข้าใจสาเหตุ แล้วเปรียบเทียบทางเลือก",
    tone: "amber",
    tag: "CLIMATE & CHANGE",
  },
];
export const SUGGESTIONS = [
  "PM2.5 ส่งผลต่อร่างกายอย่างไร?",
  "ทำไมน้ำเสียถึงกระทบระบบนิเวศ?",
  "ไมโครพลาสติกเข้าสู่ห่วงโซ่อาหารได้อย่างไร?",
];
const air = `ขนาดและแหล่งกำเนิด PM2.5
PM2.5 คืออนุภาคในอากาศที่มีเส้นผ่านศูนย์กลางเชิงอากาศพลศาสตร์ไม่เกิน 2.5 ไมโครเมตร แหล่งกำเนิดอาจเกี่ยวข้องกับการเผาไหม้ การคมนาคม อุตสาหกรรม และอนุภาคที่เกิดจากปฏิกิริยาในบรรยากาศ การเห็นท้องฟ้าขุ่นอย่างเดียวไม่พอจะระบุแหล่งกำเนิด ต้องใช้ข้อมูลประกอบ

ผลต่อร่างกาย
ฝุ่น PM2.5 สามารถเข้าสู่ส่วนลึกของปอดได้ การสัมผัสมลพิษทางอากาศสัมพันธ์กับผลกระทบต่อระบบหายใจและหัวใจ ความเสี่ยงขึ้นกับปริมาณและระยะเวลาที่สัมผัส รวมทั้งความไวของแต่ละคน ข้อมูลนี้ใช้เพื่อการเรียนรู้ ไม่ใช่คำวินิจฉัยเฉพาะบุคคล

คำถามเชิงหลักฐาน
หากจะอธิบายปัญหาฝุ่นใกล้โรงเรียน ให้เปรียบเทียบช่วงเวลา ทิศทางลม และกิจกรรมในพื้นที่ ก่อนสรุปว่าใครหรืออะไรเป็นสาเหตุ`;
const water = `น้ำเสียกับออกซิเจน
เมื่ออินทรียวัตถุในน้ำมีมาก จุลินทรีย์ที่ย่อยสลายใช้ออกซิเจนละลายน้ำเพิ่มขึ้น ออกซิเจนที่เหลือน้อยลงอาจกระทบสัตว์น้ำ อย่าใช้สีหรือกลิ่นเพียงอย่างเดียวตัดสินคุณภาพน้ำ

สารอาหารกับระบบนิเวศ
ไนโตรเจนและฟอสฟอรัสที่มากเกินไปอาจกระตุ้นการเพิ่มจำนวนของสาหร่าย การย่อยสลายหลังสาหร่ายตายอาจทำให้ออกซิเจนลดลง ผลต่อสิ่งมีชีวิตจึงเชื่อมโยงกันเป็นระบบ

สำรวจลำน้ำอย่างมีเหตุผล
ก่อนสรุปแหล่งมลพิษ ให้เปรียบเทียบจุดต้นน้ำและปลายน้ำ เวลาเก็บตัวอย่าง และกิจกรรมริมฝั่ง การจัดการน้ำเสียต้องมองทั้งต้นเหตุ การบำบัด และผู้ใช้น้ำร่วมกัน`;
const plastic = `พลาสติกและห่วงโซ่อาหาร
ไมโครพลาสติกคือชิ้นพลาสติกขนาดเล็กกว่า 5 มิลลิเมตร อาจเกิดจากผลิตภัณฑ์ขนาดเล็กหรือการแตกตัวของพลาสติกชิ้นใหญ่ สิ่งมีชีวิตในน้ำบางชนิดกินอนุภาคเหล่านี้ จึงอาจเคลื่อนผ่านความสัมพันธ์การกินในห่วงโซ่อาหารได้ ไม่ควรสรุปผลต่อสุขภาพมนุษย์แบบแน่นอนจากการพบอนุภาคเพียงอย่างเดียว

คัดแยกที่ต้นทาง
ขวดพลาสติกสะอาดและแห้งแยกเป็นวัสดุรีไซเคิลได้ตามระบบรับของพื้นที่ เศษอาหารแยกเป็นขยะอินทรีย์ ถ่านไฟฉายใช้แล้วควรเข้าจุดรับขยะอันตราย การคัดแยกช่วยได้เมื่อมีระบบเก็บและปลายทางที่เหมาะสม`;
const climate = `พลังงานกับภูมิอากาศ
ก๊าซเรือนกระจกดูดกลืนและแผ่รังสีความร้อนบางส่วน การเพิ่มก๊าซเรือนกระจกจากกิจกรรมมนุษย์ โดยเฉพาะการใช้เชื้อเพลิงฟอสซิล เป็นสาเหตุสำคัญของภาวะโลกร้อนในปัจจุบัน อากาศร้อนหนึ่งวันไม่ใช่หลักฐานเพียงพอของแนวโน้มภูมิอากาศ ต้องดูข้อมูลระยะยาว

ทางเลือกและข้อแลกเปลี่ยน
การลดการใช้พลังงาน การเดินทางร่วมกัน และพลังงานคาร์บอนต่ำเป็นทางเลือกที่ควรเปรียบเทียบทั้งการปล่อยก๊าซ ต้นทุน ความเป็นไปได้ และความเป็นธรรมต่อคนแต่ละกลุ่ม`;
export function chunkText(text) {
  return text
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .flatMap((section, sectionIndex) => {
      const trimmed = section.trim();
      if (!trimmed) return [];
      const chunks = [];
      for (let offset = 0; offset < trimmed.length; offset += 620)
        chunks.push({
          text: trimmed.slice(offset, offset + 700),
          section: `ส่วนที่ ${sectionIndex + 1}`,
          index: chunks.length,
        });
      return chunks;
    });
}
export function makeSeed() {
  const lessons = [
    {
      id: "air-1",
      topic: "air",
      title: "มลพิษทางอากาศกับชีวิตของเรา",
      description: "สำรวจต้นทางของฝุ่น ทดลองกับแบบจำลอง และใช้หลักฐานก่อนสรุป",
      minutes: 12,
      objectives: [
        "อธิบายขนาด PM2.5",
        "เชื่อมโยงต้นเหตุและผลกระทบ",
        "เลือกข้อมูลตรวจสอบข้อสรุป",
      ],
      concepts: [
        {
          title: "ต้นทาง",
          body: "การเผาไหม้และปฏิกิริยาในบรรยากาศทำให้เกิดฝุ่นได้หลายแบบ",
        },
        {
          title: "การสัมผัส",
          body: "การกระจายตัวขึ้นกับลม สภาพอากาศ และกิจกรรมในพื้นที่",
        },
        {
          title: "ผลกระทบ",
          body: "ฝุ่นละเอียดเข้าสู่ปอดได้ ความเสี่ยงขึ้นกับปริมาณและระยะเวลาสัมผัส",
        },
      ],
      quiz: [
        {
          question: "PM2.5 หมายถึงอะไร?",
          options: [
            "ชนิดของก๊าซ",
            "อนุภาคที่มีขนาดไม่เกิน 2.5 ไมโครเมตร",
            "คะแนนคุณภาพอากาศ",
          ],
          answer: 1,
          explanation:
            "PM2.5 เป็นการจัดกลุ่มตามขนาดของอนุภาค ไม่ใช่ชื่อก๊าซหรือค่า AQI",
        },
        {
          question: "ข้อมูลใดช่วยตรวจสอบแหล่งกำเนิดฝุ่นได้ดีที่สุด?",
          options: [
            "สีของท้องฟ้าเพียงอย่างเดียว",
            "ความรู้สึกของคนคนเดียว",
            "ข้อมูลฝุ่น ลม เวลา และกิจกรรมในพื้นที่ประกอบกัน",
          ],
          answer: 2,
          explanation:
            "การใช้หลายข้อมูลช่วยลดการด่วนสรุปสาเหตุจากสิ่งที่เห็นเพียงจุดเดียว",
        },
      ],
      reference:
        "https://www.who.int/teams/environment-climate-change-and-health/air-quality-and-health/health-impacts/types-of-pollutants",
    },
    {
      id: "water-1",
      topic: "water",
      title: "เมื่อสายน้ำเปลี่ยนไป",
      description:
        "ติดตามสิ่งที่เกิดขึ้นเมื่อสารอาหารและอินทรียวัตถุลงสู่แหล่งน้ำ",
      minutes: 10,
      objectives: [
        "อธิบายบทบาทของออกซิเจนในน้ำ",
        "อ่านความสัมพันธ์ในระบบนิเวศ",
        "ออกแบบการเก็บข้อมูล",
      ],
      concepts: [
        {
          title: "สิ่งที่เข้าสู่น้ำ",
          body: "น้ำทิ้งและการไหลบ่าพาอินทรียวัตถุหรือสารอาหารลงแหล่งน้ำ",
        },
        {
          title: "สิ่งที่เปลี่ยนไป",
          body: "การย่อยสลายใช้ออกซิเจน ขณะที่สารอาหารมากอาจเพิ่มการเติบโตของสาหร่าย",
        },
        {
          title: "สิ่งมีชีวิตที่ได้รับผล",
          body: "เมื่อออกซิเจนลดลง สัตว์น้ำบางชนิดอาจอยู่รอดได้ยากขึ้น",
        },
      ],
      quiz: [
        {
          question: "ทำไมอินทรียวัตถุที่มากเกินไปจึงอาจกระทบปลา?",
          options: [
            "ปลาเปลี่ยนสีทันที",
            "การย่อยสลายอาจใช้ออกซิเจนในน้ำเพิ่มขึ้น",
            "น้ำทุกชนิดไม่มีออกซิเจน",
          ],
          answer: 1,
          explanation:
            "จุลินทรีย์ใช้ออกซิเจนในการย่อยสลาย จึงอาจเหลือน้อยลงสำหรับสัตว์น้ำ",
        },
        {
          question: "ก่อนสรุปว่าน้ำเสียมาจากจุดใด ควรทำอย่างไร?",
          options: [
            "เก็บข้อมูลต้นน้ำและปลายน้ำโดยเทียบช่วงเวลา",
            "ดูสีของน้ำครั้งเดียว",
            "ถามความคิดเห็นเพียงคนเดียว",
          ],
          answer: 0,
          explanation:
            "การเปรียบเทียบสถานที่และช่วงเวลาช่วยตรวจสอบข้อสันนิษฐานเรื่องแหล่งกำเนิด",
        },
      ],
      reference: "https://www.epa.gov/nutrientpollution/problem",
    },
    {
      id: "plastic-1",
      topic: "plastic",
      title: "พลาสติกไม่ได้หายไปไหน",
      description: "ตามรอยการแตกตัวของพลาสติก แล้วฝึกแยกขยะให้ถูกปลายทาง",
      minutes: 8,
      objectives: [
        "อธิบายไมโครพลาสติก",
        "แยกขยะที่ต้นทาง",
        "พิจารณาปลายทางการจัดการ",
      ],
      concepts: [
        {
          title: "ใช้",
          body: "สิ่งของที่ใช้สั้นๆ อาจอยู่ในสิ่งแวดล้อมนานกว่าการใช้งาน",
        },
        {
          title: "แตกตัว",
          body: "พลาสติกชิ้นใหญ่แตกเป็นชิ้นเล็กได้ แต่ไม่ได้แปลว่าสลายหายไป",
        },
        {
          title: "จัดการ",
          body: "ลดใช้ซ้ำ แยกให้เหมาะกับระบบรับ และตรวจสอบปลายทาง",
        },
      ],
      quiz: [
        {
          question: "ชิ้นพลาสติกที่แตกเล็กลงหมายความว่าอย่างไร?",
          options: [
            "หายไปจากสิ่งแวดล้อมแล้ว",
            "อาจยังคงอยู่ในรูปอนุภาคขนาดเล็ก",
            "เปลี่ยนเป็นออกซิเจน",
          ],
          answer: 1,
          explanation: "การแตกตัวเป็นชิ้นเล็กต่างจากการสลายจนหมดไป",
        },
      ],
      reference:
        "https://www.unep.org/en/what-we-do/ocean-seas-and-coasts/ecosystem-degradation-pollution/plastic-pollution-marine-litter",
    },
    {
      id: "climate-1",
      topic: "climate",
      title: "โลกอุ่นขึ้น เราเลือกอะไรได้บ้าง",
      description: "แยกอากาศออกจากภูมิอากาศ แล้วพิจารณาทางเลือกด้านพลังงาน",
      minutes: 8,
      objectives: [
        "แยกอากาศกับภูมิอากาศ",
        "เชื่อมโยงพลังงานและก๊าซเรือนกระจก",
        "เปรียบเทียบข้อแลกเปลี่ยน",
      ],
      concepts: [
        {
          title: "พลังงาน",
          body: "การใช้เชื้อเพลิงฟอสซิลปล่อยก๊าซเรือนกระจกเพิ่ม",
        },
        { title: "ความร้อน", body: "ก๊าซเรือนกระจกมีผลต่อสมดุลพลังงานของโลก" },
        {
          title: "ทางเลือก",
          body: "มองทั้งผลลดการปล่อย ต้นทุน และโอกาสเข้าถึงของคนแต่ละกลุ่ม",
        },
      ],
      quiz: [
        {
          question: "ข้อมูลใดใช้ศึกษาภูมิอากาศได้เหมาะสมกว่า?",
          options: [
            "อุณหภูมิบ่ายนี้ครั้งเดียว",
            "แนวโน้มข้อมูลอุณหภูมิระยะยาว",
            "ความรู้สึกว่าเดือนนี้ร้อน",
          ],
          answer: 1,
          explanation:
            "ภูมิอากาศพิจารณาลักษณะและแนวโน้มในระยะยาว ต่างจากสภาพอากาศในช่วงสั้น",
        },
      ],
      reference: "https://science.nasa.gov/climate-change/causes/",
    },
  ];
  const classrooms = [
    {
      id: "eco-m5",
      name: "สิ่งแวดล้อมศึกษา ม.5/1",
      description: "สำรวจปัญหาใกล้ตัวผ่านหลักฐานและการลงมือทำ",
      lessonIds: lessons.map((lesson) => lesson.id),
    },
    {
      id: "eco-m6",
      name: "วิทยาศาสตร์สิ่งแวดล้อม ม.6/2",
      description: "เชื่อมโยงระบบนิเวศกับการตัดสินใจ",
      lessonIds: ["water-1", "climate-1"],
    },
  ];
  const texts = [air, water, plastic, climate];
  const documents = lessons.map((lesson, i) => ({
    id: `doc-${lesson.id}`,
    classroomId: "eco-m5",
    lessonId: lesson.id,
    name: `${lesson.title}.txt`,
    text: texts[i],
    chunks: chunkText(texts[i]),
    status: "ready",
    type: "TXT",
    sample: true,
  }));
  documents.push(
    ...documents
      .filter((doc) => ["water-1", "climate-1"].includes(doc.lessonId))
      .map((doc) => ({ ...doc, id: `m6-${doc.id}`, classroomId: "eco-m6" }))
  );
  return {
    version: 2,
    classrooms,
    lessons,
    documents,
    progress: {},
    lastLesson: null,
    conversations: {},
  };
}
const KEY = "eco-critical-demo-v2";
export function readDemo(storage = localStorage) {
  try {
    const value = JSON.parse(storage.getItem(KEY));
    if (
      value?.version === 2 &&
      [value.classrooms, value.lessons, value.documents].every(Array.isArray)
    )
      return value;
  } catch {
    /* Ignore corrupt optional demo state and start with a valid seed. */
  }
  return makeSeed();
}
export function saveDemo(value, storage = localStorage) {
  storage.setItem(KEY, JSON.stringify(value));
}
const stops = new Set([
  "คือ",
  "อะไร",
  "อย่างไร",
  "ทำไม",
  "กับ",
  "จาก",
  "เรื่อง",
  "ของ",
  "ที่",
  "ได้",
  "ใน",
  "และ",
  "ให้",
  "นี้",
  "เป็น",
  "ถึง",
  "บ้าง",
  "การ",
  "ช่วย",
  "อธิบาย",
  "ไหม",
  "ครับ",
  "ค่ะ",
]);
export function retrieve(documents, question, classroomId, lessonId = null) {
  const words = [
    ...new Intl.Segmenter("th", { granularity: "word" }).segment(
      question.toLowerCase()
    ),
  ]
    .filter((part) => part.isWordLike)
    .map((part) => part.segment)
    .filter((word) => word.length > 2 && !stops.has(word));
  if (!words.length) return [];
  return documents
    .filter(
      (doc) =>
        doc.status === "ready" &&
        doc.classroomId === classroomId &&
        (!lessonId || !doc.lessonId || doc.lessonId === lessonId)
    )
    .flatMap((doc) =>
      doc.chunks.map((chunk) => ({
        ...chunk,
        documentId: doc.id,
        title: doc.name,
        sample: doc.sample,
        score:
          words.filter((word) =>
            new Set(
              [
                ...new Intl.Segmenter("th", { granularity: "word" }).segment(
                  chunk.text.toLowerCase()
                ),
              ]
                .filter((part) => part.isWordLike)
                .map((part) => part.segment)
            ).has(word)
          ).length / words.length,
      }))
    )
    .filter((chunk) => chunk.score >= 0.22)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}
