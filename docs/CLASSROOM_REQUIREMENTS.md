# Eco-Critical AI Chatbot — requirements

Confirmed 5 November 2026 (Asia/Bangkok).

- React web application, built from an established open source GitHub project.
- Audience: Thai upper-secondary students and teachers.
- Subject: environmental awareness, specifically environmental pollution.
- Teachers upload lesson documents; students review lessons and ask the AI questions.
- Answers must primarily use teacher-uploaded material, with source citations. If evidence is missing, say so rather than invent an answer.
- Gemini API is the selected provider; API keys remain on the server.
- Simple green-and-blue theme; light, readable, warm and trustworthy.
- Product name: **Eco-Critical AI Chatbot**.
- Use impeccable design guidelines and publish source to GitHub.

## Scope of this adaptation

AnythingLLM workspaces represent classrooms/courses. Native document parsing, embeddings, vector search, streamed chat, citations, account management and workspace membership are retained. A Thai classroom dashboard provides course search, creation, lesson upload and resource inspection. New workspaces default to query mode and an environmental-education system prompt.

## Access model

Use multi-user mode before student rollout. Admin = school operator, manager = trusted teacher, default = student. Upstream managers can access all workspaces: this deployment model is for one trusted teaching team, **not independent schools or mutually isolated teachers**. Students only access assigned workspaces. Creating classes, uploading, changing prompts and membership remain server-authorized operations. Single-user mode is for local setup only.

## Acceptance

- Teachers can create a course; query mode and Thai refusal are applied on the server.
- Upload processing and embedding must succeed before the UI says a document is ready.
- Students can browse their assigned courses and enter the native RAG chat.
- Network failures show retry instructions, not an empty-success state.
- Out-of-source questions are refused by query retrieval; prompt instructions discourage unsupported claims and document prompt injection. This is not a guarantee against all hallucination or adversarial prompts.
- Layout works at 360px and desktop; keyboard access and reduced motion are supported.

## Remaining production prerequisites

Configure Gemini credentials and select an available chat model, run collector + server, enable multi-user mode, assign students, install HTTPS and backups, then conduct live Thai retrieval/citation and access-isolation acceptance tests with approved teaching documents. Scanned PDFs require OCR verification. No public deployment or live-model accuracy is implied by a successful frontend build.

## Expanded brief and release modes

See CLIENT_BRIEF.md for the user's later full brief. This supersedes the initial hero layout. P0 now includes illustrated topic dashboard, contextual visual lessons, AI chat and distinct teacher/student navigation. P1 adds local demo classroom/lesson authoring and upload-to-lesson relationships. P2 includes three working education activities and genuine browser progress. The public demo is explicitly extractive and browser-local. The live upstream RAG backend is retained; durable visual lesson metadata and progress still require backend implementation before production. See README and VALIDATION for the complete mode boundary.
