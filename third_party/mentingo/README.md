# Mentingo native UI integration

Upstream: https://github.com/Selleo/mentingo
Pinned revision: `1490a8d56119cb78b2a5a781dfdfdaacf05cded9`
MIT, copyright (c) 2024 Selleo. Original LICENSE retained here and in `frontend/src/mentingo/`.

The original `apps/web/app` source tree is imported into `frontend/src/mentingo/` in the existing React/Vite app. Upstream test files are excluded. `UPSTREAM.json` records provenance. This replaces the earlier hand-adapted card/hero implementation; those legacy files are not the active student dashboard.

Directly rendered upstream components include ModernCoursesView, HeroBanner, ModernCourseCard, ModernCourseCarousel, LessonPage, LessonContent, LessonSidebar, NavigationMenuButton, PageWrapper, Table, Button, Input, Textarea, Icon and Tooltip. Teacher management uses these native primitives with the existing classroom, lesson and document handlers.

`frontend/src/mentingo-bridge/` supplies the existing Eco classroom/lesson/progress data through the upstream hook contracts and maps Remix links to existing React Router URLs. Query/client, i18n and permission adapters serve the explicitly labelled local demo. Optional marketplace, trailers, remote enrollment and time tracking are disabled because this product does not implement those capabilities. This is frontend reuse, not a migration to the Mentingo backend. Existing Express/collector/Gemini paths remain separate.

Native source patches: tooltip trigger uses asChild to avoid nested buttons; breadcrumb separators are siblings rather than nested list items; lesson heading levels and previous/next accessible names are corrected; empty progress tracks have a visible background; tooltip portals stay inside the scoped native style root. Native shared constants/utilities are copied into `mentingo-shared` and bridge modules.

The original Tailwind configuration is `frontend/mentingo.tailwind.config.ts`. `scripts/build-mentingo-styles.mjs` compiles scoped native styles before either production build; external font imports are removed. `native-brand.css` provides blue/white Eco branding, platform fonts, existing activity styling and mobile teacher table adaptation. Original source layout and interactions remain the basis of the catalog.

Environmental photographs have separate licensing in `frontend/public/classroom/photos.json`. Platform fonts are used; no proprietary Meta font is redistributed. Earlier reference snapshots and hashes remain under `apps/` and SOURCE.json for traceability.
