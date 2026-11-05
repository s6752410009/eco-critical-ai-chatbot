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

## GitHub workflow publishing

The app source and local test evidence can be published using the active account. GitHub rejected workflow-file updates because that account lacks workflow scope. Automatic approval review also rejected extracting a credential from another account to address that restriction. No credential was extracted. Publishing therefore uses a normal source-only branch preserving all upstream history and unchanged workflow files. The full classroom CI recipe is included as a non-active example for an authorized owner to enable later.
