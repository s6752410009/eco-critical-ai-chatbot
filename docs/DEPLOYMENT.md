# Cloudflare release status — 6 November 2026

Primary hostname: **https://eco-critical.pages.dev**. Project: `eco-critical`. Release configuration: `cloudflare/pages/wrangler.jsonc`.

## Production release

Published revision 6f6d0df on 6 November 2026 (Asia/Bangkok). Pages deployment 9210ff5c serves https://eco-critical.pages.dev. Production has both approved authentication secrets and D1 migrations 0001 through 0004. Registration permits 120 requests per IP per hour. Login permits 120 requests per IP and 12 per username per ten minutes.

Production Chrome checks opened login on desktop and registration on mobile. Anonymous access to school data and the board returned 401. The two legacy Workers redirect web traffic to Pages and return 410 on old API paths. The nine full classroom flows used isolated local accounts.

## Owner setup

Owner instructions are in the gitignored `.classroom-local/admin-setup.txt`. First login needs the private setup code, then a new password before any administration. Set Gemini in the admin UI and use its real connection test; no live model validation has occurred yet.

GitHub workflow publication is separately pending correct-account `workflow` authorization; see [CI](CI.md).
