# Validation — 5 November 2026 (Asia/Bangkok)

## Executed

- Scoped ESLint and React Hook checks: pass, no errors/warnings.
- Node regression suite: 18 pass. Includes real workspace-model creation with mocked persistence, role middleware denial for students, server file allowlist, failed processing/embedding, pending-status honesty, exact upload-to-embedding handoff, demo document provenance, class/lesson scoping, missing evidence, and demo persistence.
- Native server syntax checks: workspace model, workspace endpoints and upload middleware pass.
- Browser end-to-end: 10 flows pass against the running app with **no API interception**. Includes two classrooms, four topics, prompt preparation, source details, refusal, two lesson quizzes, PM slider, waste sorting, create/edit classroom, lesson creation, TXT upload, preview/reindex, explicit unsupported-PDF error, newly uploaded content retrieval, cross-class isolation in demo, deletion and responsive student/teacher views at 390/1024/1440px.
- React/Vite production build succeeds. The upstream build retains its large-chunk and dependency optimization warnings; they are not claimed resolved by this redesign.
- Final static production demo: build passed; all 10 browser flows passed against its compiled assets. Environment canary absent from both server and static client bundles. See [browser report](browser-qa.json).

## Scope of evidence

Browser retrieval and role-switch tests are **demo behavior**, not production security tests. Server policy tests use isolated dependency doubles; they do not replace tests against an authenticated, deployed server. The live adapter uses the existing upstream API but no Gemini response was invoked or claimed verified.

## Not verified / prerequisites

- Live Gemini: no API key was provided, therefore no live inference, model accuracy or paid API call was tested.
- Full upstream server/collector runtime: local install encountered disk exhaustion and was removed; Docker Engine is not running and Docker Compose v2 is unavailable on this host. Docker build/launch was not executed; Compose syntax was not validated by Compose here.
- Complete upstream lint requires server dependencies, which are not installed. The new UI has an independent scoped lint configuration and passes it.
- Visual lesson metadata, upload-to-lesson mapping, student progress and question overview are local demo data, not live server tables. Live RAG currently scopes to workspace, not individual lesson.
- Multi-school tenancy, manager isolation, actual student access-integration, OCR, rate limits, backup recovery and live data-retention acceptance remain production rollout work.

## Demo persistence

Storage key: `eco-critical-demo-v2`. Saved data is local to the browser and origin, may be cleared by the browser, and is not suitable for personal/student data. TXT/MD upload size is bounded to 1 MB. Actual processing is text extraction + section chunking + exact Thai word matching; no model or embedding is represented as having run.

## Dashboard redesign and CI revision

The owner selected Mentingo UI source, then requested cool-white surfaces and Meta/Instagram-like system typography. The dashboard ports the pinned MIT course-card composition and retains the existing lessons, progress, retrieval and backend. Source details are in `third_party/mentingo/README.md`.

Playwright captures and layout checks cover 1440×900 and 390×844, loaded course photographs, continuation visibility, no horizontal overflow, an initially unscrolled chat, and the desktop composer inside the first viewport. The actual captures were visually inspected, including local-retrieval source details. A production run regenerates these files before publication.

The requested GitHub Actions replacement is prepared in `.github/workflows/eco-critical-ui.yml`, with upstream vendor jobs archived as reference. Publishing/activation depends on GitHub workflow authorization. See [CI details](CI.md); local tests do not imply a successful hosted Actions run.
