# Production Operations Runbook

Current Vercel project: `pan-vich1/orange-cat-task-tracking`  
Production URL: `https://orange-cat-task-tracking.vercel.app`  
Current Web Analytics preview: `https://orange-cat-task-tracking-j2m73chzj-pan-vich1.vercel.app`

Supabase Auth Site URL points to the production URL. Redirects allow the production host, `https://*-pan-vich1.vercel.app/**`, and `http://localhost:3000/**`.

## Release gate

1. Run `npm ci`, `npm run test`, `npm run lint`, `npm run typecheck`, and `npx next build --webpack`.
2. Verify `/login` and a protected Project URL at 375, 768, 1024, and 1440 px.
3. Run authenticated Admin, Member, and Guest UAT. Confirm Guest mutations fail through both UI and direct data requests.
4. Start the disposable local stack with `npx supabase start`, then run `npm run test:db` before applying migrations. The RLS fixtures run inside a transaction and roll back after the suite.
5. Run `npm run test:e2e` for Chromium/WebKit and `npm run test:e2e:all` where the environment supports Firefox. Authenticated tests read credentials from `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`; disposable mutation coverage additionally requires `E2E_PROJECT_ID` and `E2E_ALLOW_MUTATIONS=true`.
6. Review the Vercel preview deployment, environment variable names, and Supabase project ref. Never copy secret values into tickets or logs.
7. Enable Vercel Web Analytics and Speed Insights for the selected project, then verify their randomized collection routes after redeploying.
8. In Supabase Auth settings, enable leaked-password protection when the selected plan supports it; record the setting without recording any credentials.
9. Confirm the deployed response includes HSTS, `nosniff`, frame denial, the strict referrer policy, and the restricted Permissions Policy before promotion.

## Monitoring and incident response

- Monitor Vercel runtime errors, failed Server Actions, latency, and Core Web Vitals.
- Monitor Supabase Auth, PostgREST, and database health. Redact cookies, JWTs, email addresses, task titles, and descriptions from incident notes.
- Review Supabase Security/Performance Advisors before each release. The three public SECURITY DEFINER RPCs are intentionally executable by `authenticated` and enforce `auth.uid()` plus role checks internally; investigate any additional finding.
- For an incident, stop promotion, record the affected release and route, then reproduce against Preview without production data.

## Pilot metrics (30 days)

- Weekly active authenticated users and project page views from privacy-preserving Vercel Web Analytics.
- p75 LCP/INP/CLS by project route from Speed Insights; investigate when p75 LCP exceeds 2.5 seconds.
- Counts for allowlisted `task_created`, `subtask_created`, `task_status_changed`, `task_dates_changed`, `view_changed`, and `task_deleted` events. Event payloads must never include title, description, email, task/project/workspace ID, cookie, or token.
- Failed Server Actions/5xx responses from Vercel Runtime Logs and Auth/PostgREST/database health from Supabase. Assign one owner to review weekly.

## Rollback

1. Roll back the Vercel deployment to the last verified production deployment.
2. Do not reverse a database migration until its data impact is understood. Prefer a forward-fix migration.
3. If a database restore is required, pause writes, confirm the recovery point with the owner, restore through Supabase, and rerun the RLS/UAT suites before reopening access.

## Backup expectations

- Confirm the Supabase plan's backup/PITR policy before launch and document the retention window outside the repository.
- Export no production data into developer machines for testing.

## Verification record — 1 October 2026

Scope: non-mutating verification against the current source, a local production server, the production deployment, and the latest preview URL. No authenticated credentials, task mutations, database fixtures, redeployment, plan changes, or secret values were used.

| Check | Result | Evidence |
|---|---|---|
| Dependency install | Pass | `npm ci` installed 391 packages from the lockfile; npm reported that ESLint 9.39.5 is no longer supported. |
| Regression tests | Pass | `npm run test`: 9 passed, 0 failed. |
| Lint | Pass | `npm run lint`: exit code 0. |
| Type check | Pass | `npm run typecheck`: exit code 0. |
| Production build | Pass | `npx next build --webpack`: Next.js 16.3.6 compiled successfully and reported `Proxy (Middleware)`. |
| Local unauthenticated E2E | Pass with authenticated skips | Chromium and WebKit login-gate test passed at 375, 768, 1024, and 1440 px. The four authenticated tests were skipped because credentials and mutation opt-in were not provided. |
| Local Firefox E2E | Runtime blocked | Playwright Firefox exited before the test with `Could not find profile folder`; this is an environment/runtime failure, not an application assertion failure. |
| Production unauthenticated E2E | Pass | Chromium and WebKit login-gate test passed against `https://orange-cat-task-tracking.vercel.app`. |
| Preview unauthenticated E2E | Blocked | Both browsers reached Vercel Deployment Protection and displayed `Log in to Vercel` before the application. No protection bypass was attempted. |
| Production security headers | Pass | `/login` returned HSTS, `nosniff`, `DENY` framing, `strict-origin-when-cross-origin`, and the restricted Permissions Policy. |
| Client bundle secret-name scan | Pass | `.next/static` contained none of `VERCEL_OIDC_TOKEN`, `SUPABASE_SERVICE_ROLE`, `SERVICE_ROLE_KEY`, or `service_role_key`. No secret values were read or logged. |
| Production dependency audit | Pass | `npm audit --omit=dev`: 0 vulnerabilities. |

Release sign-off remains incomplete. Outstanding gates are authenticated Admin/Member/Guest UAT, authenticated cross-view and mutation coverage, formal local/staging pgTAP execution, Firefox on a supported runtime plus Edge/manual compatibility, preview access or an approved protection bypass, backup/PITR owner confirmation, and field-performance evidence.
