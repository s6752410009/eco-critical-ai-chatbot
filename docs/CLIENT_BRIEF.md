
You are a Senior Product Designer, UI/UX Engineer, and Senior Full-Stack Developer.

PROJECT: Eco-Critical AI Chatbot
TARGET: Thai upper-secondary students (ม.4–ม.6) and teachers.
GOAL: Transform the EXISTING project into a beautiful, highly interactive, demo-ready educational web application.

IMPORTANT:
You must IMPLEMENT the design and functionality in the existing codebase, not merely describe it, produce mockups, or write a design proposal.

FIRST:
1. Inspect the existing Next.js project, component structure, routes, and dependencies.
2. Preserve useful working features and application data.
3. Completely redesign weak visual areas and navigation.
4. Do not create a separate disconnected project.
5. Ensure the finished application can run and build successfully.

==================================================
1. CRITICAL DESIGN PROBLEM
==================================================

The current interface looks like a generic AI-generated landing page.

Problems:
- Too much text.
- Huge empty spaces.
- A large generic hero section.
- Lessons presented as boring text rows.
- Very little visual learning.
- AI chat is not a prominent experience.
- Weak distinction between teacher and student interfaces.
- The product looks more like a brochure than a functioning learning platform.

DO NOT reproduce the existing layout.

The new application must feel like a polished, contemporary educational product.

Design references in terms of product quality:
- Duolingo: approachable and interactive learning.
- Brilliant.org: visually guided learning.
- Notion: clean structure and readable content.
- Linear: premium UI polish and subtle interactions.

Do not copy any brand's visual identity.

Core design philosophy:
"Less text. More interactive learning."

Prioritize visual hierarchy, informative cards, illustrations, educational diagrams, interactions, and clear actions.

==================================================
2. VISUAL DESIGN SYSTEM
==================================================

Brand: Eco-Critical AI Chatbot

Style:
Modern Environmental EdTech
Premium but friendly
Minimal, colorful, and visually engaging
Suitable for high-school students, not childish
Thai-first interface

COLOR PALETTE:
Primary Forest Green: #205840
Deep Green: #173D32
Fresh Green: #62AF86
Soft Mint: #E5F3E9
Sky Blue: #69B5DB
Pale Blue: #E7F5FC
Warm White: #FAFCF9
Border: #DCE8DF
Primary Text: #20382E
Secondary Text: #728377

Use green to represent nature and blue to represent air/water.

Avoid:
- Excessive gradients
- Purple AI aesthetics
- Huge glassmorphism panels
- Generic gradient blobs
- Giant decorative hero illustrations
- Excessively rounded everything
- Dense walls of instructional text
- Tiny Thai text
- Overused statistics dashboards

Typography:
Use Sarabun or Noto Sans Thai for Thai interface.
Use modern, balanced heading typography.
Body text minimum 14–16px.
Strong heading hierarchy.

Use consistent spacing with an 8px spacing system.
Cards should have subtle borders and restrained shadows.
Buttons need clear hover, active, focus, and disabled states.

Use Lucide icons and carefully designed SVG diagrams or original illustrations.

==================================================
3. REBUILD THE PRODUCT NAVIGATION
==================================================

Create a real app shell.

Desktop:
- Compact sidebar around 220–240px
- Top navigation with breadcrumbs
- Main content area
- Optional context panel only where useful

Student navigation:
- ภาพรวม
- ห้องเรียนของฉัน
- บทเรียน
- ถาม AI
- ความก้าวหน้า

Teacher navigation:
- ภาพรวม
- จัดการห้องเรียน
- เนื้อหาบทเรียน
- AI Knowledge Base
- คำถามนักเรียน

Clearly distinguish teacher and student experiences.

Provide a simple demo role switcher if needed.

Mobile:
- Responsive app layout
- Compact header
- Bottom navigation for students
- No horizontal overflow
- Comfortable touch targets

==================================================
4. STUDENT DASHBOARD — MOST IMPORTANT
==================================================

Build a completely new student dashboard.

DO NOT use a giant text-heavy hero section.

Instead, create this composition:

A. TOP WELCOME AREA

Compact welcome area:
"วันนี้อยากเรียนรู้อะไรเกี่ยวกับสิ่งแวดล้อม?"

One short supporting sentence maximum.

Display two clear actions:
- เรียนต่อ
- ถาม AI

Add a small attractive nature-themed SVG illustration, not a giant decorative image.

B. LEARNING TOPICS

Large visual topic cards.

Topic 1:
มลพิษทางอากาศ
Visual: city skyline, atmosphere, PM2.5 visualization
Accent: light green

Topic 2:
มลพิษทางน้ำ
Visual: water ecosystem, pollution indicators
Accent: sky blue

Topic 3:
ขยะและไมโครพลาสติก
Visual: plastic waste and environmental impact
Accent: teal

Topic 4:
ภาวะโลกร้อน
Visual: earth temperature and climate changes
Accent: warm green/orange

Each card should contain:
- Strong visual illustration or diagram
- Short title
- One-sentence description maximum
- Number of lessons
- Progress indicator
- Clear "เริ่มเรียน" action

Use a responsive 2-column card layout on desktop.

Cards must feel like real educational modules, not blog article previews.

C. CONTINUE LEARNING

A visually distinct horizontal card:
"เรียนต่อจากครั้งล่าสุด"

Include:
- Lesson thumbnail
- Lesson title
- Current progress
- Resume button

D. ASK AI

Create a visually exciting AI entry panel.

Title:
"สงสัยเรื่องสิ่งแวดล้อม? ถาม Eco AI ได้เลย"

Show 3 clickable suggested questions:
- PM2.5 ส่งผลต่อร่างกายอย่างไร?
- ทำไมน้ำเสียถึงกระทบระบบนิเวศ?
- ไมโครพลาสติกเข้าสู่ห่วงโซ่อาหารได้อย่างไร?

Clicking a question must open the AI chat with the prompt prepared.

==================================================
5. INTERACTIVE LESSON EXPERIENCE
==================================================

This is the heart of the educational application.

Create an actual lesson reading interface with:

LEFT OR MAIN:
- Lesson title and chapter
- Visual educational content
- Diagrams and highlighted concepts
- Clearly structured sections
- Examples and learning activities

RIGHT:
A persistent contextual AI Tutor panel on desktop.

On mobile:
AI Tutor becomes a bottom sheet or separate chat view.

Example lesson:
"มลพิษทางอากาศกับชีวิตของเรา"

Include:
- Illustration showing sources of air pollution
- Interactive PM2.5 concept visualization
- Human health impact diagram
- Short explanations
- 2–3 comprehension questions
- Next lesson control

Use original SVG illustrations and CSS-driven diagrams when possible.

Make educational explanations accessible to high-school students.

DO NOT write an entire wall of paragraphs.

Use:
- Visual comparison cards
- Timelines
- Diagrams
- Callouts
- Expandable explanations
- Interactive questions
- Step-by-step learning components

==================================================
6. AI CHATBOT — PRIMARY FEATURE
==================================================

The client specifically requires:

AI must answer questions primarily using documents and learning materials uploaded by the teacher.

Architecture:
Google Gemini API + Retrieval Augmented Generation (RAG).

The chat must NOT behave like an unrestricted generic chatbot.

Create a beautiful ChatGPT-style educational assistant interface, customized for Eco-Critical.

Required UI:

- AI assistant identity: Eco AI
- Student conversation bubbles
- Streaming or visible loading state
- Suggested question chips
- Contextual lesson awareness
- Source references
- Document citations
- Clickable source details
- Clear empty state
- Error and retry states

When a student asks a question:
1. Identify the active classroom or lesson.
2. Retrieve the most relevant teacher-uploaded content.
3. Provide retrieved context to Gemini.
4. Generate a clear answer appropriate for ม.ปลาย.
5. Ground the answer in retrieved materials.
6. Display the source title and relevant page/section when available.

If relevant information is missing:
Clearly tell the student that the uploaded materials do not contain enough information.

Do not invent citations.
Do not claim a document was verified unless retrieval actually occurred.

Avoid unnecessarily long AI answers.

Prefer concise explanations, bullet points, examples, and follow-up questions.

Include a visual Sources panel.

Example answer display:

"PM2.5 คือฝุ่นละอองขนาดเล็กกว่า 2.5 ไมโครเมตร..."

Source:
บทเรียนที่ 1 — มลพิษทางอากาศ
หน้า 3

Provide functional click behavior for references.

==================================================
7. TEACHER DASHBOARD
==================================================

Teachers must be able to manage actual instructional content.

Build these areas:

A. CLASSROOM MANAGEMENT
- Create classroom
- Edit classroom name
- View classrooms
- Open classroom details
- View lessons in a classroom

B. LESSON CONTENT MANAGEMENT
- Add lesson
- Edit lesson title
- Add educational description
- Upload learning materials
- Organize content by topic

C. AI KNOWLEDGE BASE
This is very important.

Display:
- Uploaded documents
- File type
- Processing/indexing status
- Linked classroom
- Linked lesson
- Actions: View / Remove / Reprocess if supported

Supported initial file types:
PDF, TXT, Markdown.

DOCX may be supported if a reliable parser exists.

When a teacher uploads a document:
- Extract its text
- Chunk the content
- Generate embeddings
- Store searchable chunks
- Associate chunks with classroom and lesson
- Retrieve only authorized content

If the existing backend already implements this, integrate with it.

If a complete RAG backend cannot be finished, create a clearly labeled Demo Mode with realistic sample documents and retrieval behavior. Do not pretend a simulated answer is a live Gemini response.

D. TEACHER CONTENT PREVIEW
Teachers can preview what students will see.

==================================================
8. INTERACTIVE LEARNING COMPONENTS
==================================================

Add at least three functional interactive education components:

1. PM2.5 Exploration
An interactive slider showing conceptual changes in pollution concentration and related educational descriptions.
Label illustrative values clearly; do not misrepresent them as live sensor readings.

2. Waste Sorting Activity
Students select a waste item and identify its category.
Provide immediate feedback.

3. Lesson Knowledge Check
A short multiple-choice quiz that checks student understanding.
Show correct-answer explanations.

These components should feel like part of the lesson, not unrelated decorative widgets.

==================================================
9. DEMO CONTENT
==================================================

Use realistic Thai educational content.

Demo topics:
- มลพิษทางอากาศ
- มลพิษทางน้ำ
- ขยะพลาสติก
- ภาวะโลกร้อน

Prepare at least:
- 2 sample classrooms
- 4 topic cards
- 2 complete sample lessons
- 1 sample teacher document
- Suggested AI questions
- 1 classroom learning workflow

Do not fill the interface with meaningless placeholder text.

Demo data must be consistently labeled if simulated.

==================================================
10. TECHNOLOGY
==================================================

Use the existing project stack when possible.

Preferred:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React
- Supabase for Auth, Database and Storage
- Google Gemini API
- RAG architecture with pgvector or existing supported retrieval layer

Follow current conventions in the repository.

Do not unnecessarily install huge libraries.
Do not expose API keys to the browser.

Use server-side API routes for Gemini interactions.

Ensure classroom content is access-controlled.

==================================================
11. QUALITY REQUIREMENTS
==================================================

Every visible primary button must work.

No dead navigation links.
No fake upload success.
No infinite loading animations.
No fake AI claims.
No placeholder Lorem Ipsum.
No generic stock landing page.
No emoji used as primary product icons.

The design must be visually polished at:
- 1440px desktop
- 1024px tablet
- 390px mobile

Use smooth micro-interactions.

Meet basic accessibility standards:
- Keyboard navigation
- Visible focus states
- Sufficient color contrast
- Semantic HTML
- Proper loading feedback

==================================================
12. IMPLEMENTATION PRIORITIES
==================================================

This is an urgent client demo.

Prioritize in this order:

P0:
- Complete visual redesign
- Student dashboard
- Visual topic cards
- Lesson interface
- AI chat experience
- Fully working navigation
- Responsive layout

P1:
- Teacher dashboard
- Classroom management
- Document upload UI
- Functional sample document retrieval
- Suggested AI questions and citations

P2:
- Interactive education widgets
- Progress tracking
- Additional visual refinements

Do not sacrifice P0 quality to create many unfinished P2 features.

==================================================
13. FINAL ACCEPTANCE
==================================================

When finished, the application should demonstrate:

TEACHER FLOW:
Teacher signs in → creates classroom → uploads educational document → connects the document to a lesson → previews the content.

STUDENT FLOW:
Student enters classroom → selects environmental topic → studies visual lesson → asks the AI about lesson content → receives a grounded answer with a source reference.

The client should understand the entire product within 60 seconds of opening it.

The finished UI must look like a genuine educational SaaS product, not a generic AI-generated marketing website.

Build it now.

After implementation:
1. Run lint/type checks where configured.
2. Run production build.
3. Fix errors.
4. Test all primary routes.
5. Report implemented features, actual AI/RAG status, and remaining limitations.

Do not stop at planning.
Make the actual code changes.
