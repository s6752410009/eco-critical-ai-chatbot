# Eco-Critical native Mentingo UI

The latest client direction is to use the actual Selleo/Mentingo frontend source in the existing React application. Both student and teacher screens now render imported native components. The native photographic catalog replaces the rejected custom dashboard. Teacher management uses native tables and forms rather than oversized empty classroom cards.

Identity: fresh blue actions, cool-white/slate surfaces, restrained forest brand accent, platform sans typography with Thai fallback. No cream theme, emoji illustrations, synthetic SVG environmental banners or redistributed proprietary Meta fonts. Local real photographs identify the four environmental topics. Existing waste/air activities use meaningful colored icons and state-change feedback. Reduced-motion preferences disable animation.

Mobile: navigation becomes an accessible drawer, header actions remain visible down to 320px, native student content stacks, and teacher table rows reflow with accessible icon actions. No existing classroom/lesson/document action is intentionally removed on mobile. Thirteen viewport sizes including landscape are checked automatically; physical iOS/Android devices have not been tested.

## Evidence

Production build screenshots are captured at 1440×900 and 390×844 and inspected: student catalog, lesson, teacher overview and teacher knowledge base. Axe checks those eight screens; a separate matrix checks 143 screen/viewport combinations plus reduced motion. See [UI audit](UI_AUDIT.md), [desktop](screenshots/desktop.png), [mobile](screenshots/mobile.png), and JSON evidence beside this file.

The public Cloudflare deployment is the browser-local demo. Teacher uploads, progress and retrieval are scoped to that browser. The retained server adapter is not deployed with the static demo, and no live Gemini call is claimed.
