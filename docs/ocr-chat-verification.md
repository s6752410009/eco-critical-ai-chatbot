# OCR and conversation update

Image and PDF uploads are stored privately and processed by server-side OpenAI calls. The default is gpt-6-luna. Only completed OCR enters retrieval. Failed extraction remains retryable; it is never presented as indexed content. PDF parsing checks actual page count (maximum 20, 5 MB); page identifiers survive retrieval and citation rendering. Answers require an exact quote from a retrieved source and a valid source index. Original downloads require school authorization.

The conversation UI uses blue outgoing bubbles, gray replies, an auto-growing single-row composer, and a modal source reader (bottom sheet on mobile). Existing question, cancellation, retry, document preview, and original-download actions remain connected.

## Verification

- ESLint and production build passed.
- 45 Node tests passed, including auth, authorization, OCR validation, incomplete provider responses, and fabricated citation rejection.
- Local Cloudflare Worker/D1 browser regression passed teacher/student routes, account approval, roles, lessons, uploads, progress, discussions, and 13 viewport sizes.
- Live OpenAI integration passed Thai image, two-page text PDF, and two-page scanned PDF uploads; a separate approved student obtained the expected measurement, exact source quote, page number, and protected original file. Unrelated questions returned no invented sources.
- Live-provider QA uses the exact compiled Worker handler with a Node SQLite adapter because outbound OpenAI calls stalled in local workerd. It does not claim an authenticated production OCR test. No QA accounts or materials were written to production.
- Screenshots captured at 1440×900 and 390×844 and visually inspected; artifacts are excluded from Git. Accessibility checks caught and prompted correction of muted disclosure text.

## Operational limits

OCR can misread difficult scans. Students can inspect the quoted text and original page. API quota, provider availability, PDF complexity, and configured upload/rate limits still apply. Add per-class cost reporting and OCR usage alerts as the next operational improvement.
