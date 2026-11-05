# Mentingo UI source

Upstream: https://github.com/Selleo/mentingo

Pinned commit: `1490a8d56119cb78b2a5a781dfdfdaacf05cded9`

License: MIT, copyright (c) 2024 Selleo. The complete upstream notice is preserved in `LICENSE`. `SOURCE.json` records the original paths and SHA-256 hashes. Files below `apps/` are unmodified reference snapshots, not another runnable project or a second backend.

## Used in the existing Eco-Critical React application

- `ModernCourseCard.tsx` → `frontend/src/pages/Classroom/MentingoCourseCard.jsx`: adapted the image/media layer, contrast overlay, overlaid title, duration/lesson metadata, progress indicator and memoized component. Remix navigation and generated backend contracts are replaced with the existing app's lesson callbacks. Video trailers and hover-only essential content are omitted because the existing lessons have no trailers and must work on touch/keyboard.
- `HeroBanner.tsx`: cover-image and action composition adapted to the existing compact continuation card; the upstream 70vh marketing-sized banner is not imported.
- `NavigationMenuButton.tsx`: compact icon-navigation treatment, with labels retained as accessible names and native tooltips.
- Continue-learning widget and progress utilities: source references for resume/progress composition. Existing Eco progress and storage remain authoritative.

Brand changes: Eco-Critical name, cool-white/slate canvas, forest action color and sky context accents, the native social-app sans stack. The MIT source attribution stays in the repository rather than adding vendor language to the student UI.

Environmental cover photographs and their separate Unsplash license are recorded in `frontend/public/classroom/photos.json`. The dashboard uses device fonts; it does not redistribute Instagram Sans or Meta-owned font files.
