# Student dashboard — Mentingo adaptation

The owner selected [Selleo/Mentingo](https://github.com/Selleo/mentingo) as the concrete source and rejected the earlier warm, earthy dashboard. Implementation stays in the existing React/Vite project and keeps the current backend unchanged.

The five problems addressed: welcome text dominated the working surface; continuation was visually weak; topic rows lacked useful media; progress was hard to scan; the tutor was below the main content.

The revised dashboard uses Mentingo's media-led catalog composition and adapted card code, a compact continuation surface, four environmental image covers, an accessible navigation rail, and the existing functioning tutor beside lessons. On phones the top-level AI action opens the existing chat screen; the inline tutor is also available below the courses. The primary actions and topic titles remain visible in the first viewport. Palette: white/cool gray/slate, forest actions, sky context accents. No cream canvas or earthy card fills. Typography: the native social-app sans stack.

Source, exact revision, adaptations and MIT attribution: [third_party/mentingo](../third_party/mentingo/README.md). No claim is made that the complete Mentingo LMS or its backend has been migrated.

## Visual verification

`node scripts/capture-classroom-dashboard.mjs` opens the actual app with Playwright/Chrome, fresh storage and no API interception. It captures 1440×900 and 390×844 viewports plus full-page evidence and a real local-retrieval citation interaction. It verifies loaded cover assets, all four modules, no horizontal overflow, continuation visibility, an initially unscrolled empty chat, and the desktop composer inside the first viewport.

The compiled-app runner invokes the same capture after the existing ten browser regression flows. Screenshots below are copied from that final production run and inspected visually, not generated mockups.

- [Desktop](screenshots/desktop.png)
- [Mobile](screenshots/mobile.png)
- [Citation interaction](screenshots/dashboard-citation.png)

The demo is explicitly local extractive retrieval. Gemini inference is not part of this visual verification.
