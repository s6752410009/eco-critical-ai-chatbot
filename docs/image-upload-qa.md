# Classroom image upload and usability verification

6 November 2026

- Added teacher lesson images (up to eight, captions and removal) and image documents linked to lessons. JPG, PNG and WebP input up to 10 MB is resized in the browser to at most 1600px and 500 KB, then stored separately from curriculum in D1.
- Authenticated image delivery; students cannot upload or view uncommitted images. Invalid formats, mismatching signatures and nonexistent curriculum references are rejected. SVG is not accepted.
- Students can open saved images and their full-size versions. Images are visual learning materials; OCR and image-grounded Gemini answers are not implemented.
- Fixed clipped sticky editor header/footer and narrow upload control; member detail/reset confirmation now opens a bounded native dialog rather than appearing beneath a long roster.

Validation:
- 41 server/unit tests pass; scoped ESLint and production build pass.
- Isolated production Worker/D1 with real Chrome: teacher creates lesson, uploads photograph and captions, uploads TXT and image document, another student's account loads both files, persists progress, board replies/moderation and role/session checks pass.
- Teacher/admin routes: dashboard, classrooms, lessons, knowledge, questions, cases, discussions, members, AI settings, account, guide. Student routes: dashboard, classrooms, lessons, chat, progress, cases, discussions, account, guide. All render/no-horizontal-overflow checks and screenshots at 1440x900 and 390x844.
- Additional responsive checks at 13 viewport sizes (320–1920px, including landscape). Editor save/close buttons must be completely inside viewport.
- Click checks include member details and reset cancellation, classroom edit/save, document preview/reindex/removal, case search/filter/open, quiz interaction, approval and role changes, and logout.
- Screenshots captured under ignored artifacts/classroom; selected desktop/mobile editor, reader, knowledge, account, chat, roster detail and catalog screenshots visually inspected.

Limits: browser viewport emulation, not a physical iOS/Android device lab. No production QA account/data was created; live Gemini not called. Full OCR/PDF/DOCX ingestion is outside this release. Unreferenced uploaded draft images still consume storage; retention/garbage collection is a follow-up.
