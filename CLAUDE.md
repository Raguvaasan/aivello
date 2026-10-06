# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Aivello is a React 19 + TypeScript (strict) single-page app of ~44 free browser tools, deployed on Vercel (https://aivello.vercel.app). Vite 8 build, Vitest + React Testing Library, Tailwind 3, Firebase Auth + Firestore, and two Vercel serverless functions in `api/`. Requires Node >= 22.13.

## Commands

```bash
npm run dev            # Vite dev server on http://localhost:3000 (predev copies the pdf.js worker into public/)
npm run build          # Output to build/ (not dist/); also emits sitemap.xml and stamps the SW cache name
npm run preview        # Serve build/ on :4173
npm test               # vitest run (whole suite)
npx vitest run src/__tests__/tools/hash.test.ts   # one file
npx vitest run -t "tool registry"                 # by test name
npm run lint           # eslint src api --max-warnings 0 (any warning fails)
npm run type-check     # tsc for the app (tsconfig.json) AND for api/ (tsconfig.api.json)
npm run check:bundle   # initial-JS budget check; run after build
npm run verify         # type-check + lint + test + build + check:bundle (what CI runs)
```

- `api/*` functions only run under `vercel dev`. With `npm run dev`, Background Remover and URL Shortener fail; every other tool works.
- `src/__tests__/toolRoutes.smoke.test.tsx` renders every tool route (up to 30s each) and is the slow part of the suite. Run single files while iterating.
- CI (`.github/workflows/ci.yml`, Node 22 and 24) builds with placeholder Firebase env vars, so the build must not depend on real credentials. It also runs `npm audit --omit=dev --audit-level=high`.

## Architecture

### A tool = registry entry + lazy route + component

- `src/data/tools.ts` is the metadata registry (id, `/app/<id>` path, name, description, emoji icon, category). The Sidebar, dashboard and landing page read it, and so does `vite.config.mts`, which generates `sitemap.xml` from it. **It must never import tool components**: it sits in the initial bundle, so an import would pull every tool's heavy dependencies into first load.
- `src/routes/index.tsx`: `toolRoutes` maps each id to a `React.lazy` component, mounted as children of `/app`. New routes go below the `NEW-TOOLS` marker.
- `src/__tests__/toolRegistry.test.ts` checks that registry ids and `toolRoutes` keys match exactly, that `path === /app/<id>`, and that every category is listed in `categories`. The smoke test checks that each tool renders signed out, shows a `Breadcrumb` nav containing its registry name, and sets a document title that contains "aivello".
- A tool component (`src/tools/X.tsx`, default export) wraps its content in `<ToolWrapper toolId toolName toolDescription toolCategory>`, which provides SEO meta, structured data and the breadcrumb. When the registry has the tool, its name and category override the props. Per-tool SEO overrides are optional in `src/data/toolSeoData.ts`. They live in their own file, separate from `seoData.ts` (which the landing page imports eagerly), so they stay in the lazy tool chunks.
- Keep logic out of components. Tool-specific modules go in `src/tools/lib/`; generic helpers go in `src/utils/tools/`. Keep them pure (no DOM, no network). Tests live in `src/__tests__/tools/`, with a few colocated in `src/tools/lib/`.
- The "AI" tools are client-side heuristics and templates: frequency-based extractive summarization, `compromise`/`sentiment` NLP, and template composers. They make no LLM API calls. Only these tools reach third parties: Grammar Checker (LanguageTool), Language Translator (MyMemory), AI Image Generator (Pollinations), URL Shortener (`/api/shorten` → is.gd) and Background Remover (`/api/remove-bg` → remove.bg). Any new external origin must be added to the CSP in `vercel.json` and mirrored in `public/_headers`.

Checklist for adding a tool (README/CONTRIBUTING):
1. Create the component with `ToolWrapper`.
2. Call `useToolTracking` for completed actions.
3. Add the registry entry.
4. Add the lazy route.
5. Give every colour class a `dark:` pair.
6. Associate every label with its control.
7. Run `npm run verify`.

### Bundle discipline: the landing page loads no Firebase

`scripts/check-bundle-size.js` sets the budget: initial JS at most 400 KB raw / 130 KB gzip, and any single lazy chunk at most 250 KB gzip. These rules keep it there:

- Only the landing page, `RootLayout` and small shell components are eager. `AppLayout`, the pages and all tools are lazy. React and the router share one `react-vendor` chunk (`vite.config.mts`).
- Import `src/config/firebase.ts` only dynamically. `AuthContext.loadAuth()` loads it together with `firebase/auth` when `ensureAuth()` runs (Login, ProtectedRoute, BgRemover), or at startup when the `aivello_has_session` localStorage hint is set. `useToolTracking` dynamically imports `utils/toolUsage` (Firestore).
- `src/constants/limits.ts` exists so its values can be imported without pulling in Firebase (`services/apiService.ts` imports `config/firebase`).
- A static import of firebase, pdfjs, docx, jspdf and similar libraries from eager code (registry, layout, landing, contexts) breaks the budget.
- The same goes for `react-hot-toast`. `App.tsx` lazy-loads `<Toaster>`, and `AuthContext` imports `toast` dynamically. Tools may import it statically, because they are lazy.
- React 19.3 alone is ~205 KB of the initial JS, which leaves little headroom. When the budget fails, move code that isn't needed for first paint into a lazy chunk; don't raise the budget.

### Auth and data

- **Tools are public by design** ("free, no signup"). Only `/app/history` and `/app/profile` sit behind `ProtectedRoute`. Background Remover requires sign-in because `api/remove-bg.ts` verifies a Firebase ID token before spending paid remove.bg quota. There are no paid plans; the Pricing page says "free forever". Don't gate tools or add paid tiers.
- Firestore holds two collections:
  - `users/{uid}`: profile plus `preferences.theme`.
  - `toolUsage`: userId, toolId, toolName, action, server timestamp, and optional durationMs.

  `firestore.rules` enforces owner isolation and an exact key allowlist, and denies everything else. A shape change means updating `firestore.rules` and `src/types/firestore.ts`. Deploy rules with `firebase deploy --only firestore:rules,firestore:indexes`. The History query needs the composite index in `firestore.indexes.json`.
- `useToolTracking(toolId, toolName)` returns `track(action?, durationMs?)`. Call it once per completed action (`ToolAction` in `utils/toolUsage.ts`: use, generate, convert, analyze, download, copy), never on mount. Every visitor sends a GA event; signed-in users also get a Firestore record. **It never stores tool input or output**, and it never throws.
- Component tests mock `../context/AuthContext` with a signed-out stub. Follow the pattern in the smoke test.

### Environment variables

- `envPrefix: ['VITE_', 'REACT_APP_']` keeps the Create React App-era `REACT_APP_*` names. Read them via `import.meta.env` through `src/config/environment.ts`. Every prefixed variable is shipped to the browser.
- Server secrets (`REMOVE_BG_API_KEY`, `FIREBASE_API_KEY`) must stay unprefixed and are read only in `api/`.
- Missing Firebase config does not crash the app: it logs in dev, and `isFirebaseConfigured` is exported for checks.

### Serverless (`api/`)

- `api/` has its own tsconfig (`tsconfig.api.json`, Node types) and its own ESLint block.
- Shared helpers live in `api/_lib/http.ts` (a leading-underscore folder is not deployed as a route):
  - local `ApiRequest`/`ApiResponse` types. Don't re-add `@vercel/node`; it was removed for its vulnerable dependencies.
  - `isAllowedOrigin`, `clientIp`, and an in-memory `createRateLimiter`.
- `api/shorten.ts` validates URLs and guards against SSRF. `api/remove-bg.ts` checks the ID token and rate limits. Browser calls go through `src/services/apiService.ts`, which shows the `{ error }` message from the API response.

### Theme

- Tailwind uses `darkMode: 'class'`. `ThemeContext` handles light, dark and system, stored in localStorage under `theme`. An inline script in `index.html` applies the theme before first paint; keep it in sync with `ThemeContext`. For signed-in users the theme syncs across devices through `users/{uid}.preferences.theme` (`REMOTE_THEME_EVENT`).
- `tailwind.config.js` overrides the `purple`/`pink` scales with the logo gradient (purple-600 #8139F2 → pink-600 #D4247F), and `primary` = purple. Shared CSS variables (`--color-border`, toast colours) are in `src/index.css`.

### Build-time and runtime plumbing

- `scripts/copy-pdf-worker.js` runs before dev, start and build. It copies the pdf.js worker from node_modules to `public/pdf.worker.min.mjs` so it is served same-origin, as the CSP requires. Don't point pdf.js at a CDN.
- `scripts/stamp-sw-version.js` runs after build. It replaces `__BUILD_ID__` in `build/sw.js` with a hash of the asset names, so keep that placeholder in `public/sw.js`. The service worker is registered only in production.
- `src/utils/errorReporter.ts` installs global error handlers and reports errors to GA as `exception` events. After a deploy it reloads the page once on stale-chunk errors (`vite:preloadError`). Core Web Vitals go to GA from `src/index.tsx`.
- GA (gtag) and AdSense are loaded late by inline scripts in `index.html` to protect Total Blocking Time (TBT).

### Dependencies

- `package.json` `overrides` force patched transitive versions: `@grpc/grpc-js` (firebase still pins `~1.9`) and `postcss-selector-parser` (Tailwind 3 pins `^6`; the generated CSS was verified byte-identical). Recheck both before removing them.
- `npm audit` still reports high-severity `braces`/`micromatch`/`chokidar`/`fast-glob` via Tailwind 3. These are build-time only, and `braces` has no patched release. **Never run `npm audit fix --force`**: it "fixes" this by installing Tailwind 4, which is a separate migration. CI only gates on `npm audit --omit=dev --audit-level=high`.
- Blocked majors:
  - eslint 10 (`eslint-plugin-jsx-a11y` peer range stops at 9).
  - TypeScript 6+/7 (`typescript-eslint` requires `<6.1`).
  - Tailwind 4 (migration).
- pdf.js 6 removed `PDFDocumentProxy.destroy()` and the `isEvalSupported` option. Tear down through the loading task (`task.destroy()`).

### Lint rules that bite

`--max-warnings 0` turns these into failures:
- `no-console` (warn and error are allowed). Use `src/utils/logger.ts` instead.
- `react-hooks/exhaustive-deps`.
- `@typescript-eslint/no-explicit-any`.
- Unused variables or arguments that are not `_`-prefixed.
- The jsx-a11y recommended set.

## Project guidelines (from `.github/copilot-instructions.md`)

- Lighthouse: Performance > 85 (mobile and desktop); Accessibility, Best Practices and SEO > 90. Core Web Vitals: FCP < 2s, LCP < 2.5s, CLS < 0.1.
- Mobile-first, touch targets of at least 44px, respect `prefers-reduced-motion`, keep UI-feedback animations (Framer Motion) under 300ms.
- Process files client-side where possible. Validate file type and size with `validateFile` in `src/utils/tools/fileUtils.ts` and the limits in `src/constants/limits.ts`.
- Strict TypeScript, avoid `any`, never commit empty files.
- Keep `npm audit --omit=dev` at zero high or critical issues.
