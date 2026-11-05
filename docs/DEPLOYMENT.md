# Cloudflare release status — 6 November 2026

Primary hostname: **https://eco-critical.pages.dev**. Project: `eco-critical`. Release configuration: `cloudflare/pages/wrangler.jsonc`.

## Current status

The authenticated school release is built and tested locally. It is **not published yet**: automatic approval review rejected transferring generated APP_SECRET and BOOTSTRAP_CODE into Cloudflare Pages until the owner explicitly approves that secret transfer. The pending approval is specific to those two generated application secrets. Do not route around it, deploy broken authentication, or claim that the previous public deployment includes this release.

Remote D1 `eco-critical-discussions` exists and migrations 0001–0003 plus the locked owner bootstrap were applied. Migration 0004 (separate completion timestamps) is still pending remotely. No QA administrator has been created in production. The initial owner password has not been changed by tests.

Local full-flow QA uses a fresh temporary D1 with random test credentials. No remote fixture SQL, live Gemini request or student data is used.

## Release sequence after approval

1. Run lint, Node regression tests, the production build and isolated browser QA. Keep artifacts with the matching source revision.
2. Check `wrangler whoami` for the authorized account. From `cloudflare/pages/`, use the repository-local `../../frontend/node_modules/.bin/wrangler`; Pages commands read the config in the current directory, not a custom `--config` path.
3. Apply pending D1 migrations remotely. Only the owner bootstrap SQL is eligible for initial production setup; **never** apply QA fixtures remotely.
4. Upload the two generated secrets using the approved private file, without printing their contents. Do not regenerate APP_SECRET.
5. Deploy `../../frontend/dist-demo` to project `eco-critical`, production branch `codex/eco-critical-source`.
6. Replace the two legacy Workers with `cloudflare/legacy/redirect.mjs`: old web links redirect to `/app` on Pages; old API routes return 410. The older alias currently exposes the previous board API, so retirement must happen before accepting private production discussions.
7. Verify public photo/login/register rendering, anonymous API denial and restricted owner bootstrap without changing the owner's password or creating a production QA admin. Record the deployment ID here.

Legacy names: `eco-critical-ai-chatbot.demo-agent-jum.workers.dev` and `eco-critical.demo-agent-jum.workers.dev`. Their older deployment records are historical, not the current release evidence. Do not delete D1 when retiring these Worker handlers.

## Owner setup

Owner instructions are in the gitignored `.classroom-local/admin-setup.txt`. First login needs the private setup code, then a new password before any administration. Set Gemini in the admin UI and use its real connection test; no live model validation has occurred yet.

GitHub workflow publication is separately pending correct-account `workflow` authorization; see [CI](CI.md).
