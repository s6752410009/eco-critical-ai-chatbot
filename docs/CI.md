# Eco-Critical checks and GitHub Actions

The runnable recipe is [classroom-ci.example.yml](classroom-ci.example.yml). It uses Node 24, the npm lockfile, scoped lint, the Node regression/security suite, both frontend artifacts, server-secret canary checks, and compiled-app browser QA on a fresh temporary Worker/D1. No production credential, deployment, remote D1 fixture or live Gemini call is part of CI.

Browser QA covers registration and pending approval, roster/approval, persisted quiz progress, teacher-authored text and uploads readable by another account, reading-only completion, shared discussion and moderation, restricted settings, role changes/session revocation, logout, accessibility snapshots and 13 viewport sizes. Generated screenshots and JSON are retained for 14 days.

Official Actions are pinned to commit SHAs. Permissions are `contents: read`; concurrent obsolete runs are cancelled. The job has a 20-minute timeout.

## Hosted workflow status

Application source can be pushed with the current GitHub account; workflow publication needs that account's `workflow` authorization. A previous OAuth refresh returned a different account and was rejected. No alternate credential is used to bypass that restriction. Actions remain disabled; **no hosted successful run is claimed**.

The `.github/workflows/` replacement and original vendor-workflow archives remain local pending that authorization. Do not stage or push those changes as part of ordinary application-source commits. The example under `docs/` is the reviewable intended job.
