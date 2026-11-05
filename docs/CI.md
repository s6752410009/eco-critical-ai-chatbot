# Eco-Critical UI CI

The requested replacement is `.github/workflows/eco-critical-ui.yml`. The original vendor workflows are preserved under `docs/upstream-workflows/` and are no longer active workflow definitions.

Triggers: pushes to `codex/eco-critical-source` or `main`, pull requests and manual dispatch. Node 24; locked npm install using the existing lockfile; scoped lint; 18 classroom regression cases; server and static client production builds; server-secret canary checks in both client outputs; Chromium installation; ten browser flows against compiled assets; 1440×900 and 390×844 student/teacher captures with axe, plus 13 responsive viewport sizes. Screenshots and JSON reports are retained as a run artifact for 14 days, including failures where available.

Actions are pinned to official commit SHAs. Job permissions are `contents: read`, concurrent runs for the same ref are cancelled, and the job has a 20-minute timeout. No deploy, registry push, privileged runner, live Gemini request or repository secret is used.

## Publishing status

Workflow source is prepared and its commands are validated locally. Publishing a workflow requires `workflow` authorization on the account used for GitHub writes. The existing CLI credential can push application source but previously lacked that scope; the connected GitHub app has read-only access to this repository. No alternate stored account is used to bypass that restriction. Actions remain disabled until the new workflow can be published and the owner grants the required GitHub authorization.


The normal OAuth refresh for workflow scope returned `Markrock342` while the repository's active CLI writer is `s6752410009`; GitHub rejected the mismatched refresh. The original writer is retained. The workflow is ready locally, but the correct repository account must authorize `workflow` before it can be published.
