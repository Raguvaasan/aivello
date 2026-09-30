# Aivello — Full Project Audit (Issues & Gaps)

**Date:** 2026-08-13
**Branch:** `main`
**Scope:** Security · Performance · UI/Theme · Functionality · Accessibility · SEO
**Baseline:** `.github/copilot-instructions.md` (the project's own stated requirements)

> **Status: remediated.** Passes 1–5 of the plan in §7 have been implemented.
> See **[§9 Remediation Log](#9-remediation-log)** for what changed, what the numbers
> are now, and the three items deliberately left open. **[§10](#10-second-pass--2026-09-30)**
> records the second pass (2026-09-30) that closed them. The findings below are kept as
> written at audit time so the before/after is legible.

---

## 0. What I did

1. Read `.github/copilot-instructions.md` and treated every stated requirement as an acceptance criterion.
2. Walked the whole tree — 114 files in `src/`, plus `api/`, `public/`, and all root config.
3. Ran the real toolchain instead of guessing:
   - `npx tsc --noEmit` → **passes, 0 errors**
   - `npx eslint src --ext .ts,.tsx` → **0 errors, 16 warnings**
   - `npm audit` → **49 vulnerabilities (3 critical, 22 high, 13 moderate, 11 low)**
   - Inspected the existing `build/` output for real chunk sizes and for leaked secrets.
4. Cross-checked CSP (`vercel.json` + `public/_headers`) against every outbound URL the app actually calls.
5. Counted `dark:` variant coverage per file to find real theme breakage rather than eyeballing it.

Sections 1–8 were written before any code changed, and are preserved as-is. Section 9
records the remediation that followed.

---

## 1. Verdict

The project is structurally sound — TypeScript is strict and clean, routing and lazy-loading are in place, the layout components are genuinely well themed. The problems are concentrated in four places:

| Area | State | Gap vs. the instructions doc |
|---|---|---|
| Secrets | **Broken** | A live paid API key ships in the client bundle |
| Dependencies | **Broken** | 49 vulns vs. the "11" the doc assumes; 3 critical |
| Firestore rules | **Missing entirely** | Doc requires user-data isolation rules; no rules file exists |
| Bundle size | **~7x over budget** | 2.9 MB JS vs. the doc's < 400 KB target |
| Theme (light/dark) | **Systemically broken** | Design-system primitives have no `dark:` variants at all |
| Rate limiting | **Cosmetic only** | localStorage-based, trivially bypassed |
| Accessibility | **Below target** | 106 `<label>` vs. 1 `htmlFor`; target is > 90 |

---

## 2. CRITICAL — fix before the next deploy

### C1. remove.bg API key is baked into the public JavaScript bundle

`.env.local` defines `REACT_APP_REMOVE_BG_API_KEY`. Create React App inlines **every** `REACT_APP_*` variable into the client bundle. I verified this against the actual build output:

```
Key length: 24
!!! LEAKED: remove.bg key value IS present in built client bundle
  build/static/js/main-4f064d56.9bb4b98f.js
  build/static/js/vendor-firebase-28de363c.97e4b9a5.js
```

Anyone who opens DevTools on the deployed site can extract this key and spend your remove.bg credits.

Note the variable is also **dead code** — nothing in `src/` reads it. The only consumer is [api/remove-bg.ts:10](api/remove-bg.ts#L10), which correctly uses the *unprefixed* server-side `REMOVE_BG_API_KEY`. So the leak buys nothing; it is pure exposure.

Making it worse, [.env.example](.env.example) still instructs every developer to do exactly this:

```
REACT_APP_REMOVE_BG_API_KEY=your_remove_bg_api_key_here
```

**Actions:** rotate the key at remove.bg immediately (assume it is compromised — the build artifact exists on disk and may have been deployed); delete the var from `.env.local`; correct `.env.example` to `REMOVE_BG_API_KEY` with a comment that it is server-only; rebuild.

### C2. `/api/remove-bg` is an unauthenticated open proxy

[api/remove-bg.ts](api/remove-bg.ts) checks the HTTP method and `Content-Length`, then forwards straight to remove.bg on your paid key. There is:

- no Firebase ID-token verification (the endpoint is reachable without any login, even though the UI sits behind `ProtectedRoute`)
- no origin/referer check
- no rate limiting or per-user quota

Anyone can `curl` this endpoint in a loop and drain the account. This is the single highest-cost risk in the project.

Secondary defect in the same file: Vercel's Node body parser caps request bodies at ~4.5 MB, so the `MAX_FILE_SIZE = 10 * 1024 * 1024` check at line 3 is unreachable — 5–10 MB uploads fail with a platform 413 and a confusing error instead of the friendly message at line 18.

### C3. No Firestore security rules in the repository

There is no `firestore.rules`, no `firebase.json`, no `firestore.indexes.json` anywhere in the tree. The instructions doc explicitly requires *"proper Firestore security rules for user data isolation."*

Three collections are written from the client — `users` ([src/utils/firestore.ts:7](src/utils/firestore.ts#L7)), `usage_history` ([src/utils/firestore.ts:45](src/utils/firestore.ts#L45)), and `usage_events` ([src/services/usageTracker.ts:38](src/services/usageTracker.ts#L38)).

If the console rules are in test mode (which the absence of any rules file makes likely), any authenticated user can read every other user's profile, email, photo URL, and full tool-usage history. Rules must live in the repo and be reviewable — right now their state is unknown and unversioned, which is itself the finding.

Related: [src/services/usageTracker.ts:89](src/services/usageTracker.ts#L89) `getToolUsageStats` queries across **all** users' events from the client. That query can only work if rules are wide open.

### C4. 49 npm vulnerabilities, 3 critical

The instructions doc says "currently 11 vulnerabilities." Reality is 4x that:

```
49 vulnerabilities (11 low, 13 moderate, 22 high, 3 critical)
```

Critical: `websocket-driver` (resource-limit bypass, message corruption). High: `ws` memory-exhaustion DoS, plus the `nth-check` / `postcss` / `webpack-dev-server` chain. Most trace to `react-scripts@5.0.1`, which is unmaintained — `npm audit fix --force` wants to downgrade it to `0.0.0`, which is not an option.

The real fix is the migration in §7, not `audit fix`. Note the dev-server-only vulns don't affect production users, but `nth-check`/`postcss` are build-chain and `ws` is reachable in dev.

---

## 3. HIGH — Theme: light/dark is genuinely broken

This is the area you specifically asked about. Two **opposite** failure modes coexist, and both are in the shared design system, so every screen that uses them is affected.

### T1. `ui/` primitives are hardcoded dark-only — unreadable in light mode

[src/components/ui/input.tsx:9](src/components/ui/input.tsx#L9) — no `dark:` anywhere:
```
bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400
```
[src/components/ui/button.tsx:14](src/components/ui/button.tsx#L14) — `outline` and `ghost` variants are `text-gray-300` / `border-gray-600` with no light equivalent.

In light mode: a dark grey input on a white page, and ghost buttons in near-invisible light grey on white. Fails WCAG AA contrast.

### T2. `Card`, `BaseTool`, `ToolLayout` are hardcoded light-only — glare in dark mode

[src/components/ui/card.tsx:6](src/components/ui/card.tsx#L6):
```
rounded-2xl shadow-md border border-gray-200 bg-white p-6
```
[src/components/common/BaseTool.tsx:21-23](src/components/common/BaseTool.tsx#L21-L23) — `bg-white`, `text-gray-900`, `text-gray-600`, no dark variants.
[src/components/common/ToolLayout.tsx:19-20](src/components/common/ToolLayout.tsx#L19-L20) — same.

In dark mode these render as a blinding white card inside the dark shell.

**T1 + T2 together are the worst case:** a `Card` (forced white) containing an `Input` (forced dark grey) — broken in *both* themes simultaneously. There is no theme in which the design system is correct.

### T3. Per-tool theme coverage is wildly inconsistent

`dark:` class count per tool file:

| Tool | `dark:` classes | Lines | State |
|---|---|---|---|
| `AIBusinessPlanGenerator.tsx` | **0** | 601 | Hardcoded dark glassmorphism (`bg-white/10`, `text-white`, `text-gray-300`) — invisible in light mode |
| `AISpeechToText.tsx` | 1 | 316 | Effectively unthemed |
| `GrammarChecker.tsx` | 2 | 121 | Effectively unthemed |
| `TextToSpeech.tsx` | 5 | 35 | Partial |
| `ImageCompressor.tsx` | 7 | 116 | Partial |
| `QrCodeGenerator.tsx` | 7 | 45 | Partial |
| `AIRelationshipCompatibility.tsx` | 55 | 753 | Good |
| `AIDreamInterpreter.tsx` | 52 | 624 | Good |

`AIBusinessPlanGenerator` is the headline case: 601 lines of white-on-translucent-white UI with zero light-mode support. In light mode it is literally unreadable.

### T4. Theme flash (FOUC) on every page load

[public/index.html](public/index.html) has **no** blocking script to apply the saved theme before paint. The `dark` class is only added inside a `useEffect` in [src/context/ThemeContext.tsx:44-46](src/context/ThemeContext.tsx#L44-L46), which runs after React mounts — i.e. after the first paint.

Every dark-mode user gets a white flash on every navigation and refresh. Also hurts CLS.

### T5. `theme-transition` fires on initial mount

[src/context/ThemeContext.tsx:52](src/context/ThemeContext.tsx#L52) adds `theme-transition` inside the same effect that runs on first render, and [src/index.css:55-61](src/index.css#L55-L61) applies `transition: ... !important` to `*`, `*:before`, `*:after`. On load, every element on the page animates its colors for 300 ms. It should only apply on an actual theme *change*.

### T6. `toggleDarkMode` silently destroys the "system" preference

[src/context/ThemeContext.tsx:74-76](src/context/ThemeContext.tsx#L74-L76) resolves `system` to a hard `light`/`dark`. The landing Navbar ([src/components/landing/Navbar.tsx:108](src/components/landing/Navbar.tsx#L108)) uses this toggle, so one click from the landing page permanently opts the user out of following their OS — with no way back except the app Header's three-way selector, which the landing page doesn't have.

### T7. Theme preference is written to Firestore but never read

[src/utils/firestore.ts:18](src/utils/firestore.ts#L18) seeds `preferences: { theme: 'light', ... }` on every new user. Nothing anywhere reads it, and `ThemeContext` is localStorage-only. Dead data, and no cross-device theme sync. Note the hardcoded `'light'` default also contradicts `ThemeContext`'s `'system'` default.

### T8. Conflicting `theme-color`

`index.html` line 30 sets `#7c3aed`; [src/components/common/SEOHelmet.tsx:92](src/components/common/SEOHelmet.tsx#L92) overwrites it with `#1d4ed8` on every route. The mobile browser chrome color changes as you navigate. `manifest.json` also uses `#7c3aed`.

---

## 4. HIGH — Functional bugs

### F1. Grammar Checker is dead in production (CSP blocks it)

[src/tools/GrammarChecker.tsx:12](src/tools/GrammarChecker.tsx#L12) calls `https://api.languagetool.org/v2/check`.

That host is **not** in `connect-src` in either [vercel.json:77](vercel.json#L77) or [public/_headers](public/_headers). The browser blocks the request outright. The tool works on localhost (no CSP) and fails silently once deployed — the classic reason a bug like this survives.

### F2. AdSense cannot render under the current CSP

`index.html:84` loads the AdSense script, and `script-src` permits `pagead2.googlesyndication.com`. But ads still won't display:

- **No `frame-src`** → falls back to `default-src 'self'` → every ad iframe is blocked.
- `img-src` omits `googlesyndication.com` / `doubleclick.net` → ad creatives blocked.
- `connect-src` omits `googleads.g.doubleclick.net` → ad requests blocked.

The monetization path is non-functional as configured.

### F3. Client-side rate limiting is decorative

[src/hooks/useToolPermissions.ts](src/hooks/useToolPermissions.ts):
- `checkToolAccess` (line 40) **always returns `true`**; the `user` from `useAuth()` at line 38 is destructured and never used (ESLint flags it).
- The 100/day quota lives in `localStorage` (lines 29-35). `localStorage.clear()` resets it. Two lines in the console defeat it.

Combined with C2, there is no enforceable limit on the paid remove.bg endpoint at any layer.

### F4. `SEOHelmet` leaks DOM nodes and re-runs every render

[src/components/common/SEOHelmet.tsx:134](src/components/common/SEOHelmet.tsx#L134) — the dependency array includes `article` and `structuredData`, which callers pass as inline object literals. New identity every render → the effect re-runs constantly.

Inside it, [lines 101-107](src/components/common/SEOHelmet.tsx#L101-L107) `appendChild` a fresh `article:tag` meta element on every run, and never remove them. Duplicate meta tags accumulate without bound.

Also: the `noindex` prop is declared at line 10 and **never used** — line 89 unconditionally writes `robots: index, follow`, even on `/login` and gated `/app/*` routes.

### F5. `npm run lint` fails, so `precommit` fails

`package.json` line 34 sets `--max-warnings 0`; ESLint reports 16 warnings. So `npm run lint` exits non-zero, and `precommit` (line 40) is permanently broken — meaning it isn't being run.

The warnings themselves are worth fixing: unused imports in `ToolLayout`, `Dashboard`, `performance.ts`, `useToolPermissions`; and three genuine `react-hooks/exhaustive-deps` ref-cleanup bugs in [src/tools/AISpeechToText.tsx:101-107](src/tools/AISpeechToText.tsx#L101-L107) — the mic stream / AudioContext / animation frame cleanup reads `.current` at teardown time, so **the microphone may not actually be released** when the component unmounts. That's a privacy-visible bug (the browser mic indicator stays on).

### F6. `api/` is outside all quality gates

[tsconfig.json:27-29](tsconfig.json#L27-L29) has `"include": ["src"]`, and the lint script only targets `src`. So `api/remove-bg.ts` is never type-checked or linted. `@vercel/node` isn't in `package.json` either — the type import resolves only because Vercel provides it at build time.

Minor: [tsconfig.json:22-25](tsconfig.json#L22-L25) declares `paths` with no `baseUrl`, and has a stray trailing comma. It currently works but is fragile.

---

## 5. HIGH — Performance

### P1. Bundle is ~7x over the stated budget

Doc target: **< 400 KB**. Actual `build/static/js`: **2.9 MB** (uncompressed).

Largest chunks:

```
409K  vendor-misc-031b1d88.js
328K  vendor-misc-d79de362.js
326K  vendor-misc-1d35eaf4.js
199K  vendor-misc-ddf28edf.js
183K  vendor-firebase-dba69e5b.js
167K  main-1b2f9b16.js
166K  vendor-react-456d2698.js
```

Note a single 409 KB chunk exceeds `maxSize: 250000` from [craco.config.js:17](craco.config.js#L17) — webpack can't split it further, which means one very large indivisible module is in there. Worth running `npm run build:analyze` to identify it.

CSS is **89 KB** in one file — high for a purged Tailwind build; worth checking that `content` globbing is actually pruning.

### P2. Firebase loads eagerly on the landing page

[src/config/firebase.ts](src/config/firebase.ts) initializes Auth **and** Firestore **and** Analytics **and** Performance at module scope, and `AuthProvider` wraps the entire app in [src/App.tsx:16](src/App.tsx#L16) — including `/`, `/terms`, `/privacy`, `/pricing`.

That's ~340 KB of Firebase on a marketing page that needs none of it. `getPerformance` and `getAnalytics` in particular should be dynamically imported after first paint.

### P3. `craco.config.js` splits are partly ineffective

The `pdf` and `nlp` cache groups use `chunks: 'async'` ([lines 33](craco.config.js#L33), [48](craco.config.js#L48)), but the `vendors` catch-all at line 58 uses `chunks: 'all'` with `reuseExistingChunk: true`. Because the async groups have higher priority they should win — but the presence of four separate 200–409 KB `vendor-misc` chunks suggests a lot is landing in the catch-all regardless. Needs verification with the analyzer.

### P4. Web Vitals collected but never reported

`web-vitals@2.1.4` is a dependency and `src/reportWebVitals.ts` exists, but [src/index.tsx](src/index.tsx) never calls it. Dead weight, and no CWV data — while the doc mandates FCP < 2s / LCP < 2.5s / FID < 100ms / CLS < 0.1 thresholds you currently cannot measure.

Also: no `<React.StrictMode>` wrapper in `index.tsx`.

### P5. Almost no image lazy-loading

8 `<img>` tags in `src/`, only **1** with `loading="lazy"` — against an explicit doc requirement. No WebP/AVIF, no `srcset` anywhere.

### P6. Service worker will serve stale HTML after deploys

[public/sw.js:9-15](public/sw.js#L9-L15) calls `skipWaiting()` on install and caches `/` in a manually-versioned `aivello-v2` cache. Since `CACHE_NAME` is bumped by hand, a deploy that forgets to bump it leaves users on cached HTML pointing at deleted hashed chunks — white screen until a hard refresh.

---

## 6. MEDIUM — Accessibility, SEO, quality

### A1. 106 labels, 1 `htmlFor`

`grep` counts: `<label` → **106**, `htmlFor` → **1**. Essentially every form control in every tool is unassociated with its label. Screen readers announce nothing useful; clicking labels doesn't focus inputs. This alone blocks the doc's "Accessibility > 90" target.

Also: 11 `aria-label`s across the whole app, and 8 `alt` attributes for 8 `<img>` (that part is fine).

Positive: [src/components/common/SkipToContent.tsx](src/components/common/SkipToContent.tsx) exists and `*:focus-visible` styling is defined in `index.css:80`.

### S1. Tool pages are login-gated but listed in the sitemap

All 29 tools live under `/app/*` behind `ProtectedRoute` ([src/routes/index.tsx:80](src/routes/index.tsx#L80)). `public/sitemap.xml` contains 45 URLs including those tool pages, and `robots.txt` explicitly `Allow: /app/`.

Googlebot follows those URLs, gets a client-rendered login redirect, and indexes nothing. The result is 30+ soft-404s and zero tool-page ranking — the entire SEO investment (`seoData.ts`, `SEOHelmet`, structured data) is neutralized.

This also directly contradicts the instructions doc's *"All tools are free to use without restrictions"* and the homepage's own *"No signup needed!"* meta description. **This is a product decision, not just a bug — worth confirming the intent before changing.**

### S2. `og:image` uses a relative path

`index.html:48` and `:60` use `%PUBLIC_URL%/og-image.png`, which builds to `/og-image.png`. Facebook, LinkedIn, and X require an absolute URL. Social previews will show no image. (`SEOHelmet` gets this right with an absolute default — the static HTML doesn't.)

### S3. `manifest.json` icon types are wrong

Two entries declare `"src": "logo.svg"` with `"type": "image/png"`. The type/extension mismatch plus the absence of real 192×192 and 512×512 PNGs means Chrome's install criteria may not be met — blocking the doc's PWA goal. No `screenshots` field either.

### Q1. Errors are swallowed silently in ~6 places

[AuthContext.tsx:100](src/context/AuthContext.tsx#L100) (logout), [usageTracker.ts:43,64,84,114](src/services/usageTracker.ts#L43) (four empty catches), [useToolPermissions.ts:25](src/hooks/useToolPermissions.ts#L25). Failures are invisible in production.

[ErrorBoundary.tsx:24-26](src/components/common/ErrorBoundary.tsx#L24-L26) has the Sentry integration stubbed out as a comment — so no production error tracking exists at all, against the doc's "Monitoring" requirement.

### Q2. Type-safety hole in `AuthContext`

[src/context/AuthContext.tsx:36](src/context/AuthContext.tsx#L36) types the `onAuthStateChanged` callback parameter as the app's own `User` type rather than Firebase's. That's an unchecked structural assumption papering over two different `User` shapes.

### Q3. Dead code and stale config

- Two tools fully implemented but commented out of both the router and the registry: `AICodeAssistant.tsx` (907 lines) and `AIResumeScanner.tsx` (430 lines) — [routes/index.tsx:38,44](src/routes/index.tsx#L38), [data/tools.ts:37,91](src/data/tools.ts#L37).
- `@types/react-helmet-async` in `devDependencies` but `react-helmet-async` is **not installed** — `SEOHelmet` is a hand-rolled DOM manipulator instead.
- Three 0-byte HTML files at the repo root: `aivello-logo-generator.html`, `favicon-generator.html`, `modern-logo-generator.html` — a direct violation of the doc's very first rule, *"No empty files should be committed."*
- `package.json` scripts reference `./scripts/setup-dev.sh` and use `rm -rf` — shell-only, broken on this Windows dev environment.

### Q4. Test coverage is near zero

Three test files (`errorHandling`, `logger`, `useToolPermissions`) against 114 source files. Two of the three have unused-import warnings, suggesting they're incomplete. No component tests, no tool tests.

### Q5. Header hygiene

`X-XSS-Protection: 1; mode=block` is deprecated and can itself introduce vulnerabilities in older browsers — modern guidance is `0` or omit. `script-src 'unsafe-inline'` substantially weakens the CSP's XSS protection; needs nonces or hashes to be meaningful.

---

## 7. Proposed fix plan

I recommend tackling this in five passes, in this order. Each is independently shippable.

### Pass 1 — Stop the bleeding (do this first, today)
1. Rotate the remove.bg key; remove `REACT_APP_REMOVE_BG_API_KEY` from `.env.local`; fix `.env.example`. **(C1)**
2. Add Firebase ID-token verification + per-user rate limiting to `api/remove-bg.ts`; fix the 4.5 MB body-limit mismatch. **(C2)**
3. Write `firestore.rules` + `firebase.json` with per-user isolation; commit them; remove or move the cross-user `getToolUsageStats` query server-side. **(C3)**
4. Add `api.languagetool.org` to `connect-src` in both `vercel.json` and `_headers`. **(F1)**

### Pass 2 — Theme correctness
5. Add the pre-paint theme script to `index.html`. **(T4)**
6. Rewrite `ui/input.tsx`, `ui/button.tsx`, `ui/card.tsx`, `BaseTool.tsx`, `ToolLayout.tsx` with proper light + dark variants — this fixes the largest surface for the least work. **(T1, T2)**
7. Fix `theme-transition` to fire only on change; fix `toggleDarkMode` to cycle through `system`. **(T5, T6)**
8. Sweep the low-coverage tools, starting with `AIBusinessPlanGenerator` (0 dark classes), `AISpeechToText`, `GrammarChecker`. **(T3)**
9. Reconcile `theme-color`; wire Firestore `preferences.theme` or drop it. **(T7, T8)**

### Pass 3 — Performance
10. Run `npm run build:analyze`, identify the 409 KB chunk, split it. **(P1, P3)**
11. Defer Firebase Analytics/Performance and lazy-init Firestore off the landing path. **(P2)**
12. Call `reportWebVitals`, add `StrictMode`, add `loading="lazy"` to images. **(P4, P5)**
13. Tie the SW cache name to the build hash. **(P6)**

### Pass 4 — Correctness & a11y
14. Fix `SEOHelmet` deps/leak and honor `noindex`. **(F4)**
15. Fix the `AISpeechToText` ref-cleanup bugs — the mic-release one is user-visible. **(F5)**
16. Add `htmlFor`/`id` pairs across the 106 labels. **(A1)**
17. Enforce real server-side quotas; make `checkToolAccess` mean something. **(F3)**
18. Clear the 16 ESLint warnings so `precommit` works; extend lint + tsc to cover `api/`. **(F5, F6)**

### Pass 5 — Dependencies & cleanup
19. Plan the `react-scripts` → Vite migration (the only real path out of the 49 vulns). **(C4)**
20. Fix `og:image` to absolute, resolve the sitemap/gating contradiction, fix manifest icons. **(S1, S2, S3)**
21. Delete the 3 empty HTML files, decide on the 2 commented-out tools, drop the unused `@types/react-helmet-async`. **(Q3)**
22. Wire up Sentry; replace silent catches with real logging. **(Q1)**

---

## 8. Two decisions I need from you

1. **Should the tools be public or login-gated?** The instructions doc, the homepage meta description, and `robots.txt` all say public — but the router gates everything behind `ProtectedRoute`. This drives §S1 and changes how much of the SEO work is salvageable. I did not assume an answer.

2. **`react-scripts` → Vite?** It's the only way to actually clear the 49 vulnerabilities and realistically hit the < 400 KB budget, but it's a multi-day migration touching `craco.config.js`, all `REACT_APP_*` env vars, and the test setup. The alternative is accepting the audit numbers and documenting the dev-only ones as non-exploitable in production.

---

*Findings verified against the working tree at commit `679b213`. Line references are accurate as of this audit.*

---

## 9. Remediation Log

Applied on 2026-08-13. 94 files touched. Every gate below is green:

| Gate | Before | After |
|---|---|---|
| `tsc --noEmit` | pass | **pass** |
| `eslint src api --max-warnings 0` | **fail** (16 warnings) | **pass** (0 warnings) |
| `npm test` | 13 tests, 2 suites hollow | **23 tests, 4 suites pass** |
| `npm run build` | pass | **pass** |
| npm vulnerabilities | 49 (3 critical, 22 high) | **41 (0 critical, 20 high)** |
| Initial JS payload | 2867 KB / 30 chunks | **1485 KB / 24 chunks** |
| Secret in client bundle | **yes** | **no** |
| Labels with `htmlFor` | 1 | **81** |

### 9.1 Security

- **C1 — Leaked remove.bg key.** Renamed `REACT_APP_REMOVE_BG_API_KEY` to `REMOVE_BG_API_KEY`
  in `.env.local` and `.env.example`, with a comment explaining why the prefix leaks.
  Verified against a fresh build: the key string no longer appears anywhere in `build/`.
  **You must still rotate the key** — the old value shipped and is compromised.
- **C2 — Open proxy.** `api/remove-bg.ts` rewritten with three layers: origin allowlist,
  Firebase ID-token verification (via Identity Toolkit REST — no `firebase-admin`, no
  service account), and a per-uid rate limit of 20/hour. Body parsing switched to a raw
  stream with a 4MB cap that matches Vercel's real limit instead of the unreachable 10MB
  check. The client (`apiService.removeBg`) now attaches the ID token; `BgRemover` routes
  through it instead of a bare `fetch`, and surfaces the server's error message.
- **C3 — Firestore rules.** Added `firestore.rules`, `firebase.json`, `firestore.indexes.json`.
  Default-deny, per-user isolation on `users`, `toolUsage`, `usage_events`, `usage_history`;
  usage collections are append-only. Removed `getToolUsageStats()` — an unused cross-user
  query that could only ever have worked under permissive rules. Added the two composite
  indexes the existing queries need (their absence was hidden by silent catches).
- **C4 — Dependencies.** `npm audit fix` cleared all 3 critical (`websocket-driver`) plus 8
  others. The remaining 41 are **all in build tooling** (`react-scripts`, `@craco/craco`,
  webpack plugins, `@vercel/node`) — none ship to users.
- **Q5 — Headers.** Dropped deprecated `X-XSS-Protection`; added `base-uri`, `form-action`,
  and `object-src 'none'`.

### 9.2 Functional bugs fixed

- **F1 — Grammar Checker was dead in production.** `api.languagetool.org` added to
  `connect-src`. Also fixed two real bugs in that tool: `data.matches` could be `undefined`
  (crashing `.map`), and the "No grammar errors found" panel rendered as soon as you typed,
  before any check had run.
- **PDF tools were dead in production too** — found during CSP work, not in the original
  audit. `public/pdf.worker.min.js` was a 90-byte shim doing `importScripts()` against
  cdnjs at pdf.js **3.11.174** while `pdfjs-dist` is **5.4.54**: blocked by CSP, two majors
  out of sync, and routing user PDFs through a third-party origin in a tool that advertises
  client-side processing. Replaced with `scripts/copy-pdf-worker.js`, which copies the real
  worker out of `node_modules` on `prestart`/`prebuild` so the version can never drift.
- **F2 — AdSense.** Added the missing `frame-src` (absent entirely, so every ad iframe was
  blocked by `default-src`) plus the googlesyndication/doubleclick `img-src` and
  `connect-src` entries.
- **Microphone was never released.** Worse than the lint warning suggested: `AISpeechToText`
  called `getUserMedia()` and **discarded the returned stream**, so the cleanup had nothing
  to stop and the browser's recording indicator stayed on until the page was closed. The
  stream is now stored and released. That component's `error` state was also computed but
  never rendered — every permission and hardware failure was invisible. Now displayed.
- **F4 — SEOHelmet.** Inline object props made the effect re-run on every render and append
  a fresh set of `article:tag` meta nodes without bound. Deps are now serialised keys, and
  created nodes are tagged and removed. `noindex` was declared but ignored — now honoured,
  and applied to `/login`, `/app/history` and `/app/profile`. It also stopped overwriting
  `theme-color` per route, which had been fighting `index.html` and changing the mobile
  browser chrome colour mid-navigation.
- **F3 — Quotas.** `checkToolAccess` returned a hardcoded `true` while destructuring an
  unused `user`; it now reflects the auth gate. The localStorage counter is kept but
  documented for what it actually is — a UX guard, not a security control — since real
  enforcement now lives in the API route.
- **Profile page** — the theme selector was decorative (no `value`, no `onChange`, and a
  hardcoded `selected` attribute), and "Account Created" was hardcoded to *"July 13, 2025"*
  for every user. The selector is now bound to `ThemeContext`; dates come from Firebase Auth
  metadata.
- Replaced 6 silent `catch {}` blocks with `logger` calls.

### 9.3 Theme

- **T4 — FOUC.** Added a pre-paint inline script in `index.html` that applies the stored
  theme before the stylesheet loads.
- **T1/T2 — Design system.** `Input`, `Textarea`, `Button`, `Card`, `BaseTool`, `ToolLayout`,
  `Loading` and `ErrorMessage` all rewritten with both light and dark values. This was the
  systemic fix: `Card` was light-only and `Input` dark-only, so a `Card` containing an
  `Input` was broken in *both* themes simultaneously.
- **T3 — Unthemed tools.** `AIBusinessPlanGenerator` went from **0 to 108** `dark:` variants
  (601 lines that rendered white-on-white in light mode). `AISpeechToText` and
  `GrammarChecker` fully themed. `Profile` converted from dark-only.
- **T5** — `theme-transition` no longer fires on first mount, so the page stops animating
  every element on load. **T6** — the toggle now cycles light → dark → system instead of
  permanently destroying the system preference. **T7** — `preferences.theme` was typed as
  the literal `'light'`, so it could never hold the user's actual choice; fixed, and the
  default is now `'system'`. **T8** — `theme-color` conflict resolved.

### 9.4 Performance

The headline finding here was **not** in the original audit — it surfaced when the post-fix
build still showed a 2.8MB initial payload:

> `src/data/tools.ts` statically imported **all 29 tool components** to populate a
> `component:` field that **nothing ever read**. That registry is imported by the Sidebar
> *and by the public landing page*, so every visitor downloaded every tool plus pdfjs, docx,
> jspdf, qrcode, compromise and sentiment — completely defeating the `React.lazy()` calls in
> `src/routes/index.tsx`. All 30 chunks were initial; zero were lazy.

Removing the field and its imports cut the initial payload **2867 KB to 1485 KB (−48%)**, and
the tools now load as genuine async chunks (30 to 56 emitted files). Verified by confirming
tool-specific strings no longer appear in any chunk referenced from `index.html`.

Also: Firebase Analytics and Performance moved behind a dynamic import (~340KB that the
landing page, which uses no Firebase, was paying for); `reportWebVitals` is finally *called*
and forwards to gtag; `React.StrictMode` added; `loading="lazy"` and
`referrerPolicy="no-referrer"` on remote images; and the service-worker cache name is now
stamped from a build hash by `scripts/stamp-sw-version.js`, replacing the hand-bumped
`aivello-v2` that would serve stale HTML after any forgotten bump.

### 9.5 Accessibility and quality

- **A1 — Labels.** 1 to **81** associated labels. Applied by codemod in two passes: the first
  attempt's regex backtracked across `</label>` boundaries and mispaired some labels, so it
  was fully reverted and redone with a tempered pattern, then verified by inspection.
  Read-only values on the Profile page moved from `<label>` (invalid without a control) to a
  proper `<dl>/<dt>/<dd>`.
- **F5/F6 — Gates.** All 16 ESLint warnings cleared, so `npm run lint` and `precommit` work
  again. `tsconfig.json` and the lint script now cover `api/`, which was outside both — that
  immediately surfaced that `@vercel/node` had never been installed (now added). Added the
  `baseUrl` that `paths` requires.
- **Tests.** Both existing suites were hollow: `logger.test` asserted nothing in its main
  case, and `useToolPermissions.test` **re-implemented the logic inside the test file** and
  asserted against its own copy — it would have passed with the hook deleted. Both rewritten
  against the real modules (13 to 23 tests). Root cause of the logger test's silence:
  `Object.defineProperty(process.env, ...)` is silently ignored under Node/Jest here, while
  plain assignment works. `config/environment.ts` also no longer throws at module scope under
  `NODE_ENV=test`, which had made any test touching Firebase impossible to run.
- Deleted the 3 empty root HTML files (rule #1 of the instructions doc). Fixed
  `manifest.json`, which declared `logo.svg` as `type: "image/png"`. Made `og:image`
  absolute. Replaced the shell-only `clean`/`setup`/`analyze` scripts that could not run on
  this Windows environment.

### 9.6 Deliberately NOT done — needs your decision

1. **Tool routes are still behind `ProtectedRoute`.** Removing the auth gate is a product and
   abuse-surface decision, not a bug fix, so it was left alone. It remains inconsistent with
   the instructions doc, the homepage's "No signup needed!" copy, and `robots.txt`. **The
   sitemap still lists 29 login-gated tool URLs**, which Google will treat as soft-404s.
   Correcting the sitemap depends on which way you decide, so both were left untouched.
2. **No Vite migration.** Multi-day, and it touches every `REACT_APP_*` variable and the test
   setup. It is still the only path to clearing the remaining 41 (dev-only) vulnerabilities
   and to the doc's <400KB target — 1485 KB is a large improvement but not the goal.
3. **Firebase Auth still loads on the landing page** (~270KB), because `AuthProvider` wraps
   the whole app in `App.tsx`. Deferring it means restructuring auth-state timing, which
   carries real regression risk; worth doing, but as its own change with its own testing.

Smaller known gaps: `og-image.png` is 1024×1024 (a 1200×630 version would render better in
link previews); the Profile notifications toggle is presentational and not yet wired to
Firestore; cross-device theme sync via `preferences.theme` is still unimplemented; and ~44
remaining `<label>` elements wrap controls nested inside wrapper `<div>`s, which need
case-by-case review rather than a codemod.

---

## 10. Second pass — 2026-09-30

Scope: every item §9.6 left open, a tool-by-tool functional audit of all 31 existing tools,
light/dark theme across every page, the `.github/copilot-instructions.md` requirements that
were still unmet, a new logo and brand palette, and 13 new tools.

### 10.1 Numbers

| Gate | 2026-08-13 (after §9) | 2026-09-30 |
|---|---|---|
| npm vulnerabilities | 41 (20 high) | **0** |
| Build tool | CRA 5 + craco | **Vite 8** (build ~25s) |
| Initial JS (landing) | 1485 KB | **375 KB raw / 115 KB gzip** (guideline: < 400 KB) |
| Tests | 23 (Jest) | **~600 (Vitest)**, incl. a render smoke test of every tool route |
| Tools | 29 (2 disabled) | **44** |
| Lighthouse mobile — landing / dashboard / tool | not measured | **92 / 92 / 89** |
| Lighthouse desktop | not measured | **99–100** |
| Lighthouse Accessibility / Best Practices / SEO | not measured | **100 / 100 / 100** |

Lighthouse was run locally against `vite preview` with Chrome's default mobile throttling.

### 10.2 Decisions taken (the two open questions in §8)

1. **Tools are public.** The instructions say "All tools are free to use without restrictions"
   and the homepage promised "No signup needed", so `ProtectedRoute` now wraps only
   `/app/history` and `/app/profile`. Background Remover (paid API) shows a sign-in card and the
   server still verifies an ID token. The sitemap is now generated from the registry at build
   time, so the soft-404 problem in §S1 is gone. To revert, wrap `AppLayout` in
   `ProtectedRoute` in `src/routes/index.tsx`.
2. **Migrated to Vite.** `REACT_APP_*` names kept via `envPrefix`, output stays in `build/`,
   Jest replaced by Vitest, ESLint 9 flat config (adds `jsx-a11y`). `@vercel/node` was removed
   (only its types were used) in favour of `api/_lib/http.ts`.

### 10.3 What changed, by area

**Security / privacy**
- `firestore.rules`: document-shape validation (key allowlists, enum actions, server
  timestamps), immutable profile fields, legacy `usage_events`/`usage_history` closed.
- `toolUsage` is metadata-only (tool, action, time). Previously raw input/output was stored.
- Image Compressor was uploading every compressed image to a Firestore `compressedImages`
  collection; Resume Builder read any resume by typing an email. Both removed.
- Password Generator now uses `crypto.getRandomValues` with rejection sampling.
- `api/shorten.ts`: http(s) only, SSRF guards (private/loopback/link-local, decimal/hex IPv4,
  IPv4-mapped IPv6), origin allowlist, per-IP rate limit. `api/remove-bg.ts`: per-IP limit on
  top of the per-user limit, content-type check, upstream timeout, never relays remove.bg's own
  401/403 as a user auth error.
- CSP/Permissions-Policy: `camera=(self)` for the QR scanner, actual hosts only, COOP
  `same-origin-allow-popups` for Firebase popups, `upgrade-insecure-requests`.
- Removed fabricated `aggregateRating` (4.8★ / 150 reviews) from structured data, the dead
  `SearchAction`, fake social proof ("10K+ users", "4.9/5"), and the fake paid plans.

**Performance**
- Firebase is never downloaded by anonymous visitors: auth loads on demand (session hint in
  localStorage for returning users), `initializeAuth` without the popup resolver avoids the
  ~130 KB auth iframe until someone clicks "Sign in", Firestore loads only for signed-in
  tracking/history. Firebase Analytics/Performance replaced by the existing gtag.
- gtag.js deferred to idle after load; AdSense deferred to first interaction (ownership is now
  verified with the `google-adsense-account` meta tag). These two were ~900 ms of main-thread
  time on mobile.
- App shell, dashboard and every non-landing page are lazy; framer-motion is off the landing
  path; Inter uses `display=optional` (removed a 0.19 CLS on desktop).
- Stale-chunk recovery after deploys (`vite:preloadError` + ErrorBoundary reload guard).

**Theme**
- Every page and tool was swept for single-theme colour classes. Login, Profile, History,
  Pricing, Terms, Privacy, Navbar, UserProfile, ProtectedRoute, ErrorPage and LoadingScreen
  were dark-only or light-only and are now both.
- New logo; Tailwind `purple`/`pink` scales remapped to the logo gradient (#8139F2 → #D4247F),
  so the whole UI follows the logo. `theme-color` metas per scheme. Focus-ring colour follows
  the brand in both themes. Cross-device theme sync via `users/{uid}.preferences.theme`.

**Functionality** (full per-tool notes are in the agents' reports; highlights)
- QR Code Scanner returned hard-coded fake results → real decoding (BarcodeDetector + jsQR).
- URL Shortener generated fake `aiv.to` links → real short links via `/api/shorten`.
- History page showed four hard-coded items for every user → real Firestore history.
- Study Notes quiz answered "D" for every question; Interview Prep always analysed question 1;
  Resume Scanner's section checks could never pass; Translator ignored MyMemory's 500-byte
  limit; Image Generator requested 4 images at once and failed silently; Speech to Text leaked
  a second mic stream on pause; Unit Converter had wrong factors (mile, pound, US volumes) and
  blank results ≥ 1000; three tools used the wrong `toolId`, so their SEO data never applied.
- Resume Builder: PDF export overlapped and mis-paginated; skill level ≥ 6 crashed the page.
  Invoice Generator: rounding, UTC date bug, print printed the whole app.

**Guidelines items implemented**
- User activity tracked in Firestore (`useToolTracking` in every tool).
- Breadcrumbs + BreadcrumbList structured data on every tool page.
- `prefers-reduced-motion` respected by all Framer Motion animations (`MotionConfig`).
- Centralised error logging (`utils/errorReporter.ts` → GA `exception` events).
- Bundle budget enforced in CI (`npm run check:bundle`), Node 20/22 matrix, audit gate.
- No empty files; no `any` in shared code; labels associated (enforced by `jsx-a11y`).

### 10.4 Still open

1. **Rotate the remove.bg key** if it has not been done since §9.1 — the old value shipped in a
   public bundle.
2. **Deploy the Firestore rules and indexes** (`firebase deploy --only firestore:rules,firestore:indexes`);
   the app code now writes server timestamps that the new rules require.
3. Old `toolUsage` documents written before this change may still contain raw input/output.
   Rules forbid client deletes, so clean them up with an admin script if needed.
4. jsPDF's built-in fonts cannot render non-Latin text (Tamil, ₹); the Resume/Invoice PDFs
   replace unsupported characters and warn. Embedding a Unicode font would fix it.
5. `script-src 'unsafe-inline'` remains (theme bootstrap, gtag queue, AdSense).
