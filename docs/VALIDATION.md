# Validation — 6 November 2026, Asia/Bangkok

This record describes the **current authenticated school build**, tested locally. Earlier browser-demo reports remain historical and are not evidence of production account authorization.

## Executed checks

- Scoped classroom/bridge ESLint and React Hooks checks: pass.
- Node suite: **40 passed**, including owner bootstrap/forced password change, pending-account denial, server-enforced teacher/admin roles, session revocation, CSRF origin checks, encrypted Gemini settings, private forum moderation, optimistic curriculum revision, protected document reading, server-scored quizzes, reading-only completion and stable completion timestamps.
- React/Vite **8.3.6** builds: both the retained upstream server frontend and the static Pages client plus bundled Worker compile successfully.
- Client secret-canary scanner: absent in both generated outputs. This is a check for the designated marker, not a claim that every possible secret was scanned.
- Same-origin local development proxy: `/api/school/auth/me` returns JSON; an invalid local login produces the intended 401 rather than a proxy/Origin error. `npm run dev` starts React + local Worker/D1 together.
- **Nine integrated browser flows passed** against the compiled app and a fresh local Workerd/D1 instance, without API interception: register/pending, admin approval, persisted progress across independent browser contexts, authored lesson/TXT readable by the student including reading-only completion, shared forum/moderation, restricted settings and explicit missing Gemini key, 13 viewport sizes, teacher/admin role grants and old-session revocation, logout.
- Nine accessibility screenshot cases: **zero axe violations** for the selected WCAG 2 A/AA and WCAG 2.1 AA tags. No browser page errors. This automated result is not WCAG certification.
- Desktop 1440×900 and mobile 390×844 screenshots were captured and actually inspected. The desktop account rail label and misleading browser-only upload notification found in inspection were fixed; a second compiled run passed and its screenshots were inspected.
- Responsive layout checks: 320, 360, 375, 390, 414, 430, 640 landscape, 768, 820, 1024, 1280, 1440 and 1920 pixels. No page overflow or off-screen topbar controls in the tested screens. This does not assert every possible device/browser size was tested.
- Dependency audit at this checkpoint: **0 critical, 0 high, 9 moderate**. Remaining findings include upstream routing/rendering and build-tool dependencies; the repository is not described as vulnerability-free.

Evidence: [authenticated browser JSON](school-app-qa.json), [desktop login](screenshots/school-login-desktop.png), [mobile login](screenshots/school-login-mobile.png), [student mobile](screenshots/school-student-mobile.png), [member management](screenshots/school-members-desktop.png), [document reader](screenshots/school-materials-mobile.png).

## Limits and pending release checks

- Production release 9210ff5c serves the authenticated app. Desktop login, mobile registration and anonymous API denial were verified on the public hostname.
- No test administrator was seeded remotely; full browser fixtures use a temporary local database, random secrets and local accounts only.
- No real Gemini key was provided. Missing-key handling, encryption and permissions are tested; actual inference, answer accuracy and paid requests are not verified.
- Docker/collector runtime and physical iOS/Android devices were not tested. Pages does not deploy the retained Express/collector stack.
- TXT/Markdown only on Pages; no claim of PDF/DOCX/OCR support there. No SMTP email recovery, multi-school tenancy or vector search.
- Hosted GitHub Actions has not run; correct-account workflow authorization remains pending.
