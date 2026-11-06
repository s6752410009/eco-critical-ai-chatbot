import {usageRoute} from "./school-usage.mjs";
import { answerFromSources } from "./school-openai.mjs";
import {
  makeSeed,
  chunkText,
  retrieve,
} from "../frontend/src/pages/Classroom/data.js";
import {
  ApiError,
  reply,
  clean,
  sameOrigin,
  bodyJson,
  requireTeacher,
  requireAdmin,
  audit,
  budget,
} from "./school-auth.mjs";
import { imageRefs, uploadImage, readImage } from "./school-images.mjs";
import { hydrateOcr, extractionId, createOcrFile, processOcr, readOcrFile } from "./school-ocr.mjs";
const encoder = new TextEncoder();
export async function curriculum(env) {
  const select = env.BOARD_DB.prepare(
    "SELECT data,revision FROM school_curriculum WHERE id=1"
  );
  let row = await select.first();
  if (!row) {
    const { version, classrooms, lessons, documents } = makeSeed();
    const seed = {
      version, classrooms, lessons,
      documents: documents.map(({ chunks, ...document }) => document),
    };
    await env.BOARD_DB.prepare(
      "INSERT OR IGNORE INTO school_curriculum(id,data,revision,updated_at) VALUES (1,?,1,?)"
    ).bind(JSON.stringify(seed), Date.now()).run();
    // Read the winning row if two first-time requests initialized the class together.
    row = await select.first();
  }
  const data = JSON.parse(row.data);
  data.documents = data.documents.map((doc) => ({
    ...doc,
    chunks: chunkText(doc.text),
  }));
  await hydrateOcr(data, env);
  return { data, revision: row.revision };
}
function validateCurriculum(input) {
  if (
    !Array.isArray(input?.classrooms) ||
    input.classrooms.length !== 1 ||
    !Array.isArray(input.lessons) ||
    !Array.isArray(input.documents) ||
    input.lessons.length > 100 ||
    input.documents.length > 100
  )
    throw new ApiError(
      "ต้องมีห้องเรียนภูมิศาสตร์เดียว และไม่เกิน 100 บทเรียน/เอกสาร"
    );
  const lessons = input.lessons.map((item) => {
    if (!/^[\w-]{1,80}$/.test(item.id))
      throw new ApiError("รหัสบทเรียนไม่ถูกต้อง");
    if (!["air", "water", "plastic", "climate"].includes(item.topic))
      throw new ApiError("หัวข้อบทเรียนไม่ถูกต้อง");
    const concepts = (item.concepts || []).slice(0, 30).map((c) => ({
      title: clean(c.title, "หัวข้อเนื้อหา", 1, 160),
      body: clean(c.body, "เนื้อหา", 1, 12000),
    }));
    const quiz = (item.quiz || []).slice(0, 30).map((q) => {
      const options = q.options?.map((v) => clean(v, "ตัวเลือก", 1, 1000));
      if (
        !options ||
        options.length < 2 ||
        options.length > 8 ||
        !Number.isInteger(q.answer) ||
        q.answer < 0 ||
        q.answer >= options.length
      )
        throw new ApiError("แบบทดสอบไม่ถูกต้อง");
      return {
        question: clean(q.question, "คำถาม", 1, 1000),
        options,
        answer: q.answer,
        explanation: clean(
          q.explanation || "ทบทวนเนื้อหาแล้วลองใหม่",
          "คำอธิบาย",
          1,
          2000
        ),
      };
    });
    let reference = item.reference || "";
    if (reference && !/^https:\/\//.test(reference))
      throw new ApiError("แหล่งข้อมูลต้องเป็น HTTPS");
    return {
      id: item.id,
      topic: item.topic,
      title: clean(item.title, "ชื่อบทเรียน", 1, 255),
      description: String(item.description || "").slice(0, 2000),
      minutes: Number(item.minutes) || null,
      objectives: (item.objectives || [])
        .slice(0, 10)
        .map((x) => String(x).slice(0, 500)),
      concepts,
      images: imageRefs(item.images),
      quiz,
      reference,
      ...(item.caseStudyId ? { caseStudyId: String(item.caseStudyId) } : {}),
    };
  });
  if (new Set(lessons.map((l) => l.id)).size !== lessons.length)
    throw new ApiError("รหัสบทเรียนซ้ำ");
  const documents = input.documents.map((doc) => {
    if (doc.lessonId && !lessons.some((l) => l.id === doc.lessonId))
      throw new ApiError("เอกสารเชื่อมกับบทเรียนที่ไม่มีอยู่");
    const images = imageRefs(doc.images);
    const ocrId = extractionId(doc.extractionId);
    const text = ocrId ? "" : clean(doc.text || (images.length ? doc.name : ""), "เอกสาร", 1, 1000000);
    return {
      id: clean(doc.id, "รหัสเอกสาร", 1, 100),
      classroomId: "eco-m5",
      lessonId: doc.lessonId || null,
      name: clean(doc.name, "ชื่อไฟล์", 1, 255),
      text,
      chunks: chunkText(text),
      status: "ready",
      type: ocrId && doc.type === "PDF" ? "PDF" : images.length ? "IMAGE" : doc.type === "MD" ? "MD" : "TXT",
      ...(ocrId ? {extractionId:ocrId} : {}),
      images,
      sample: !!doc.sample,
    };
  });
  const classroom = input.classrooms[0];
  return {
    version: 3,
    classrooms: [
      {
        id: "eco-m5",
        name: clean(classroom.name, "ชื่อห้องเรียน", 1, 255),
        description: String(classroom.description || "").slice(0, 2000),
        lessonIds: lessons.map((l) => l.id),
      },
    ],
    lessons,
    documents,
  };
}
const keyBytes = async (env) =>
  crypto.subtle.importKey(
    "raw",
    await crypto.subtle.digest(
      "SHA-256",
      encoder.encode("eco-settings-v1:" + env.APP_SECRET)
    ),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
async function seal(text, env) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      await keyBytes(env),
      encoder.encode(text)
    )
  );
  return JSON.stringify({ iv: [...iv], value: [...encrypted] });
}
async function open(value, env) {
  const item = JSON.parse(value);
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(item.iv) },
      await keyBytes(env),
      new Uint8Array(item.value)
    )
  );
}
async function provider(env) {
  const { results } = await env.BOARD_DB.prepare(
    "SELECT key,value FROM school_settings WHERE key IN ('openai_key','openai_model')"
  ).all();
  const values = Object.fromEntries(results.map((r) => [r.key, r.value]));
  return {
    apiKey:
      env.OPENAI_API_KEY ||
      (values.openai_key ? await open(values.openai_key, env) : ""),
    accounting: env,
    model: values.openai_model || "gpt-6-luna",
  };
}
export async function callGPT(env, question, sources, purpose = "chat") {
  return answerFromSources({...await provider(env), purpose}, question, sources);
}
export async function storeRoute(request, env, user, path) {
  if(path === "/usage")return usageRoute(request,env,user);
  if (path === "/ocr/files" && request.method === "POST") return createOcrFile(request, env, user);
  const ocrPath=path.match(/^\/ocr\/([a-f0-9-]{36})\/(process|file)$/);
  if(ocrPath){
    const [,id,action]=ocrPath;
    if(action === "process" && request.method === "POST") {
      requireTeacher(user);
      return processOcr(request, env, user, id, await provider(env));
    }
    if(action === "file" && request.method === "GET") {
      if(!["teacher","admin"].includes(user.role)) {
        const {data}=await curriculum(env);
        if(!data.documents.some(doc=>doc.extractionId===id) && !data.lessons.some(lesson=>lesson.images?.some(image=>image.extractionId===id)))throw new ApiError("ไม่พบเอกสารที่เผยแพร่",404);
      }
      return readOcrFile(env,id);
    }
  }
  if (path === "/images" && request.method === "POST") return uploadImage(request, env, user);
  if (/^\/images\/[a-f0-9-]{36}$/.test(path) && request.method === "GET") {
    const id = path.split("/").pop();
    if (!["teacher", "admin"].includes(user.role)) {
      const {data} = await curriculum(env);
      if (![...data.lessons, ...data.documents].some(item => item.images?.some(image => image.id === id)))
        throw new ApiError("ไม่พบรูปในบทเรียน", 404);
    }
    return readImage(env, id);
  }
  if (path === "/data" && request.method === "GET") {
    const state = await curriculum(env),
      { results } = await env.BOARD_DB.prepare(
        "SELECT * FROM school_progress WHERE user_id=?"
      )
        .bind(user.id)
        .all();
    const progress = Object.fromEntries(
      results.map((r) => [
        `eco-m5:${r.lesson_id}`,
        {
          percent: r.percent,
          score: r.score,
          total: r.total,
          completedAt:
            r.percent === 100
              ? new Date(r.completed_at ?? r.updated_at).toISOString()
              : null,
        },
      ])
    );
    const latest = [...results].sort((a, b) => b.updated_at - a.updated_at)[0];
    const messages = (
      await env.BOARD_DB.prepare(
        "SELECT id,lesson_id,role,text,sources FROM school_chat_messages WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 300"
      )
        .bind(user.id)
        .all()
    ).results.reverse();
    const conversations = {};
    for (const message of messages) {
      const key = `eco-m5:${message.lesson_id || "all"}`;
      (conversations[key] ||= []).push({
        id: message.id,
        role: message.role,
        text: message.text,
        sources: JSON.parse(message.sources),
      });
    }
    return reply({
      ...state,
      data: {
        ...state.data,
        documents: ["admin", "teacher"].includes(user.role)
          ? state.data.documents
          : state.data.documents.map(
              ({ text, chunks, pages, ...document }) => document
            ),
        progress,
        lastLesson: latest
          ? { classroomId: "eco-m5", lessonId: latest.lesson_id }
          : null,
        conversations,
        teacherQuestions: ["admin", "teacher"].includes(user.role)
          ? (
              await env.BOARD_DB.prepare(
                "SELECT m.id,m.text,m.lesson_id AS lessonId,m.created_at AS createdAt,u.display_name AS displayName,u.username FROM school_chat_messages m JOIN school_users u ON u.id=m.user_id WHERE m.role='user' ORDER BY m.created_at DESC LIMIT 100"
              ).all()
            ).results
          : [],
      },
    });
  }
  if (path.startsWith("/documents/") && request.method === "GET") {
    const { data } = await curriculum(env);
    let id;
    try {
      id = decodeURIComponent(path.slice("/documents/".length));
    } catch {
      throw new ApiError("รหัสเอกสารไม่ถูกต้อง");
    }
    const document = data.documents.find(
      (doc) => doc.id === id && doc.status === "ready"
    );
    if (!document) throw new ApiError("ไม่พบเอกสารนี้ อาจถูกนำออกแล้ว", 404);
    const { chunks, ...metadata } = document;
    return reply({ document: metadata });
  }
  if (path === "/data" && request.method === "PUT") {
    requireTeacher(user);
    sameOrigin(request);
    const input = await bodyJson(request, 2500000),
      data = validateCurriculum(input.data),
      text = JSON.stringify({
        ...data,
        documents: data.documents.map(({ chunks, ...doc }) => doc),
      });
    for (const id of new Set([...data.lessons, ...data.documents].flatMap(item => (item.images || []).map(image => image.id)))) {
      if (!await env.BOARD_DB.prepare("SELECT id FROM school_images WHERE id=?").bind(id).first()) throw new ApiError("รูปภาพยังอัปโหลดไม่สำเร็จ กรุณาเลือกรูปใหม่");
    }
    for(const id of new Set([...data.documents.map(doc=>doc.extractionId),...data.lessons.flatMap(lesson=>(lesson.images || []).map(image=>image.extractionId))].filter(Boolean))){
      if(!await env.BOARD_DB.prepare("SELECT id FROM school_ocr WHERE id=?").bind(id).first())throw new ApiError("ไม่พบเอกสาร OCR กรุณาอัปโหลดใหม่");
    }
    if (encoder.encode(text).length > 1800000)
      throw new ApiError(
        "เนื้อหาเอกสารรวมใหญ่เกิน 1.8 MB กรุณาแบ่งหรือลดเอกสาร",
        413
      );
    const result = await env.BOARD_DB.prepare(
      "UPDATE school_curriculum SET data=?,revision=revision+1,updated_at=? WHERE id=1 AND revision=?"
    )
      .bind(text, Date.now(), Number(input.revision))
      .run();
    if (!result.meta.changes)
      throw new ApiError(
        "มีครูคนอื่นแก้ข้อมูลแล้ว กรุณารีเฟรชก่อนแก้ไขต่อ",
        409
      );
    await audit(env, user, "curriculum_saved");
    return reply({ revision: Number(input.revision) + 1 });
  }
  if (path === "/progress" && request.method === "POST") {
    sameOrigin(request);
    const value = await bodyJson(request),
      { data } = await curriculum(env);
    const lesson = data.lessons.find((l) => l.id === value.lessonId);
    if (!lesson) throw new ApiError("ไม่พบบทเรียน", 404);
    let percent = 20,
      score = null,
      total = null;
    if (value.answers) {
      if (
        !Array.isArray(value.answers) ||
        value.answers.length !== lesson.quiz.length ||
        value.answers.some(
          (answer, i) =>
            !Number.isInteger(answer) ||
            answer < 0 ||
            answer >= lesson.quiz[i].options.length
        )
      )
        throw new ApiError("กรุณาทำแบบทดสอบให้ครบ");
      percent = 100;
      total = lesson.quiz.length || null;
      score = total
        ? lesson.quiz.reduce(
            (sum, q, i) => sum + (q.answer === value.answers[i] ? 1 : 0),
            0
          )
        : null;
    }
    await env.BOARD_DB.prepare(
      "INSERT INTO school_progress(user_id,lesson_id,percent,score,total,updated_at,completed_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET percent=max(percent,excluded.percent),score=CASE WHEN excluded.percent=100 THEN excluded.score ELSE score END,total=CASE WHEN excluded.percent=100 THEN excluded.total ELSE total END,updated_at=excluded.updated_at,completed_at=CASE WHEN excluded.percent=100 THEN excluded.completed_at ELSE completed_at END"
    )
      .bind(
        user.id,
        lesson.id,
        percent,
        score,
        total,
        Date.now(),
        percent === 100 ? Date.now() : null
      )
      .run();
    return reply({ percent, score, total });
  }
  if (path === "/settings" && request.method === "GET") {
    requireAdmin(user);
    const config = await provider(env);
    return reply({ configured: !!config.apiKey, model: config.model });
  }
  if (path === "/settings" && request.method === "POST") {
    requireAdmin(user);
    sameOrigin(request);
    const value = await bodyJson(request);
    const model = clean(value.model || "gpt-6-luna", "ชื่อโมเดล", 1, 100);
    if (!/^[a-zA-Z0-9._-]+$/.test(model))
      throw new ApiError("ชื่อโมเดลไม่ถูกต้อง");
    const statements = [
      env.BOARD_DB.prepare(
        "INSERT INTO school_settings(key,value,updated_at) VALUES ('openai_model',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at"
      ).bind(model, Date.now()),
    ];
    if (value.apiKey) {
      const key = clean(value.apiKey, "API key", 16, 300);
      statements.push(
        env.BOARD_DB.prepare(
          "INSERT INTO school_settings(key,value,updated_at) VALUES ('openai_key',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at"
        ).bind(await seal(key, env), Date.now())
      );
    }
    await env.BOARD_DB.batch(statements);
    await audit(env, user, "ai_settings_saved");
    return reply({ success: true });
  }
  if (path === "/settings/test" && request.method === "POST") {
    requireAdmin(user);
    sameOrigin(request);
    await budget(env, `ai-test:${user.id}`, 5);
    await callGPT(env, "ตอบว่าเชื่อมต่อสำเร็จ", [
      {
        title: "ทดสอบการเชื่อมต่อ",
        section: "ส่วนที่ 1",
        text: "เชื่อมต่อสำเร็จ",
      },
    ], "connection_test");
    return reply({ success: true });
  }
  if (path === "/chat" && request.method === "POST") {
    sameOrigin(request);
    await budget(env, `chat:${user.id}`, 8);
    await budget(env, `chat-day:${user.id}`, 80, 86400000);
    const value = await bodyJson(request),
      question = clean(value.question, "คำถาม", 1, 2000),
      { data } = await curriculum(env);
    if (value.lessonId && !data.lessons.some((l) => l.id === value.lessonId))
      throw new ApiError("ไม่พบบทเรียน", 404);
    const notes = data.lessons
      .filter((l) => l.concepts?.length)
      .map((l) => ({
        id: `lesson-notes-${l.id}`,
        classroomId: "eco-m5",
        lessonId: l.id,
        name: `เนื้อหาบทเรียน: ${l.title}`,
        status: "ready",
        chunks: chunkText(
          l.concepts.map((c) => `${c.title}\n${c.body}`).join("\n\n")
        ),
      }));
    const sources = retrieve(
      [...data.documents.filter(doc => doc.type !== "IMAGE" || doc.extractionId), ...notes,
        ...data.lessons.flatMap(lesson=>(lesson.images || []).filter(image=>image.ocr?.ocrStatus === "ready").map(image=>({...image.ocr,id:image.extractionId,classroomId:"eco-m5",lessonId:lesson.id,name:`${lesson.title} · ${image.caption || "รูปประกอบบทเรียน"}`})))],
      question,
      "eco-m5",
      value.lessonId || null
    );
    const generated = sources.length
      ? await callGPT(env, question, sources)
      : {
          answer:
            "ยังไม่พบข้อมูลที่เพียงพอในเอกสารของครูสำหรับคำถามนี้ ลองระบุกรณีศึกษาหรือให้คุณครูเพิ่มหลักฐานประกอบ",
          model: null,
        };
    const now = Date.now();
    await env.BOARD_DB.batch([
      env.BOARD_DB.prepare(
        "INSERT INTO school_chat_messages(id,user_id,lesson_id,role,text,sources,created_at) VALUES (?,?,?,'user',?,'[]',?)"
      ).bind(crypto.randomUUID(), user.id, value.lessonId || "", question, now),
      env.BOARD_DB.prepare(
        "INSERT INTO school_chat_messages(id,user_id,lesson_id,role,text,sources,created_at) VALUES (?,?,?,'assistant',?,?,?)"
      ).bind(
        crypto.randomUUID(),
        user.id,
        value.lessonId || "",
        generated.answer,
        JSON.stringify(generated.sources ?? sources),
        now + 1
      ),
      env.BOARD_DB.prepare(
        "DELETE FROM school_chat_messages WHERE user_id=? AND id NOT IN(SELECT id FROM school_chat_messages WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 500)"
      ).bind(user.id, user.id),
    ]);
    return reply({ ...generated, sources: generated.sources ?? sources });
  }
  throw new ApiError("ไม่พบเส้นทาง", 404);
}
