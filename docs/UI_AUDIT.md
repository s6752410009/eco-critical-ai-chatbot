# Current school UI audit — 6 November 2026

Reviewed the actual rendered page and captured screenshots, not only source code. Current evidence is in [VALIDATION](VALIDATION.md) and [school-app-qa.json](school-app-qa.json).

The five largest issues in the rejected screen were a plain blue visual plane, slogan-like Thai copy, oversized text relative to the form, no photographic identity, and a layout that did not translate clearly to mobile.

Implemented a real locally served meadow photograph with licensed attribution, a short “ภูมิศาสตร์ เรื่องใกล้ตัว” headline, a compact sign-in form, green actions and a cropped photo strip for narrow screens. Retained the owner-requested platform sans typography, native Mentingo components and existing account functionality. No proprietary Meta font is redistributed.

Further inspection found a wrapped account label in the narrow desktop rail and school upload feedback incorrectly describing browser-only storage. Both were corrected and the compiled app was retested. School discussion ownership copy now correctly refers to the account. The existing chat stop control aborts the client request; this is not a guarantee that a remote provider cancels billing after receiving a request.

Current checks: 9 browser flows, 13 viewport sizes and zero axe violations in 9 snapshots; screenshots include desktop 1440×900 and mobile 390×844. Remaining limitations are physical-device verification, real Gemini responses, large upstream code chunks and the pending authenticated Cloudflare release. No invented quantitative visual-quality score is assigned.

---

## Historical prototype audit (superseded)

# UI audit — native Mentingo integration

Date: 5 November 2026. Scope: student and teacher browser demo. Audit/fix pass uses imported source, not screenshots as mockups. Scores are engineering judgments, not certification.

| Dimension | Score / 4 | Evidence and limitation |
|---|---:|---|
| Accessibility | 3 | Eight axe WCAG A/AA screen checks; heading/nested-control/contrast fixes. Automated checks do not establish full WCAG compliance. |
| Performance | 2 | Local photos, system fonts, lazy source modules. Original large JavaScript chunks remain; no field performance or 60fps claim. |
| Theme/system consistency | 3 | Native tokens and primitives across both roles; legacy token collision fixed. Existing activities require an adaptation layer. |
| Responsive | 4 | 13 viewports, 320–1920px, portrait/landscape, 143 screen checks plus reduced motion. Browser emulation only; real device checks remain. |
| Anti-patterns/usability | 3 | Original source catalog/navigation, photographic topics, compact teacher tables, explicit demo/source context. Full classroom usability study remains. |

Total: **15/20**. No P0 identified in the tested demo scope.

## Findings addressed

1. **P1 — source mismatch:** earlier custom card/hero ports did not meet the request to use Mentingo. Imported original app source; actual catalog, lesson page and native controls now render directly. See third_party/mentingo/README.md.
2. **P1 — teacher visual inconsistency:** large empty cards and old typography persisted outside student dashboard. Replaced classroom, lesson and document lists with native tables/forms and shared brand root. Existing CRUD/upload handlers retained.
3. **P1 — invalid semantics:** nested tooltip buttons, nested breadcrumb list items, duplicate top heading. Corrected native source semantics and accessible navigation names.
4. **P1 — contrast/token collision:** legacy --muted conflicted with native HSL tokens; secondary teacher text/status contrast failed axe. Renamed legacy token and strengthened foreground colors.
5. **P2 — mobile actions:** desktop tables concealed relevant actions in narrow views. Reflowed rows, retained accessible action names and touch-sized buttons, tightened header without removing AI access.
6. **P2 — flat activity feedback:** colored bin icons replace plain rectangles; feedback animates only on state changes; reduced-motion disables transitions. No animation frame-rate certification.

## Remaining work

- **P2 performance:** reduce the inherited application bundle with measured route-level splitting; profile real low-end phones before setting a performance budget.
- **P2 verification:** test Safari/iOS and Android hardware, keyboard navigation and screen readers with students/teachers. Emulation and axe are partial evidence.
- **P2 release process:** publish the prepared CI workflow only after the repository writer grants workflow scope. Local passing checks are not hosted CI.

## Useful behavior retained

Local TXT upload/index/reindex/remove, per-class and lesson retrieval boundaries, visible retrieved passages, student preview, quizzes and actual saved progress are exercised by ten browser flows and 18 regression cases. No backend authorization or live Gemini accuracy is inferred from demo screenshots.
