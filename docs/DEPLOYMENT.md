# Cloudflare demo deployment

URL: https://eco-critical-ai-chatbot.demo-agent-jum.workers.dev/demo
Worker: eco-critical-ai-chatbot
Version: 1425db4f-3f83-4733-a01e-cf7fd0b8e7cb
Published: 5 November 2026
Configuration: ../wrangler.jsonc

The existing React application is compiled into frontend/dist-demo and published as Cloudflare Workers static assets with SPA fallback. No server bindings, Gemini secrets, collector or Express backend are deployed. Demo state is local to each browser. The role switch is a preview control, not authentication.

The public URL is exercised using Playwright without API interception: ten flows covering student topics, activities/progress, teacher create/edit/upload/preview, scoped retrieval and deletion. Separate public screenshots inspect student and teacher UI at 1440×900 and 390×844 with axe checks. Evidence: cloudflare-browser-qa.json and cloudflare-visual-qa.json. Full 13-viewport responsive checks run on the identical compiled assets locally.

To publish a later reviewed build: npm --prefix frontend run build:demo, node scripts/run-classroom-qa.mjs, then wrangler deploy --config wrangler.jsonc using the authorized account.
