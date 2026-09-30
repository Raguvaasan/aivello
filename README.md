# Aivello — Free AI-Powered Tools

Aivello is a React 19 + TypeScript web app with **44 free tools** for documents, images, writing, code, design and everyday work. Every tool is free, needs no signup, and most run entirely in the browser, so your files never leave your device.

**Live:** https://aivello.vercel.app

## Tools

| Category | Tools |
|---|---|
| Document | PDF to Word, PDF Merge & Split, AI Resume Builder |
| Media | Image Compressor, Image Converter & Resizer, Background Remover*, YouTube Thumbnail |
| Writing | Grammar Checker, Word Counter, Read Time Estimator, AI Text Summarizer, Case Converter, Lorem Ipsum Generator, Text Diff Checker |
| Developer | AI Code Assistant, JSON Formatter, Base64 Converter, UUID Generator, Regex Tester, Timestamp Converter |
| Design | Color Palette Generator, Color Contrast Checker, AI Image Generator |
| Security | Password Generator, Hash Generator |
| Utility | QR Code Generator, QR Code Scanner, Unit Converter, Age & Date Calculator |
| AI / Career / Education / Content | Business Plan, Personality Analyzer, Dream Interpreter, Relationship Compatibility, Story Generator, Resume Scanner, Interview Prep, Study Notes, Video Script, Speech to Text |
| Communication / Audio / Productivity / Marketing | AI Email Writer, Text to Speech, Language Translator, URL Shortener |

\* Background Remover uses the paid remove.bg API, so it requires a free account and is limited to 20 images per hour.

Tools that send data to a third party: Grammar Checker (LanguageTool), Language Translator (MyMemory), AI Image Generator (Pollinations), URL Shortener (is.gd, via our server), Background Remover (remove.bg, via our server). Everything else runs locally.

## Quick start

**Prerequisites:** Node.js **20.19+** (Vite 8 requirement), npm, a Firebase project.

```bash
git clone https://github.com/Raguvaasan/aivello.git
cd aivello
npm install
cp .env.example .env.local   # then fill in your Firebase web config
npm run dev                  # http://localhost:3000
```

The serverless functions in `api/` (background removal, URL shortener) only run under `vercel dev`; with plain `npm run dev` those two tools show an error, everything else works.

### Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication → Google** and **GitHub** providers, and add your domains to *Authorized domains*.
3. Create a **Firestore** database, then deploy the rules and indexes from this repo:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `npm start` | Vite dev server on port 3000 |
| `npm run build` | Production build to `build/` (+ sitemap, stamped service worker) |
| `npm run preview` | Serve the production build locally on port 4173 |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Tests with a coverage report in `coverage/` |
| `npm run lint` | ESLint (TypeScript, React hooks, jsx-a11y) with zero warnings allowed |
| `npm run type-check` | `tsc` for the app and for `api/` |
| `npm run check:bundle` | Fails if initial JS exceeds the budget (run after `build`) |
| `npm run verify` | Everything CI runs: type-check, lint, test, build, bundle budget |

## Architecture

- **Build:** Vite 8 + `@vitejs/plugin-react`. Environment variables keep the `REACT_APP_` prefix (see `envPrefix` in `vite.config.mts`). Only prefixed variables reach the browser.
- **Routing:** `src/routes/index.tsx`. Every tool is a lazily loaded route under `/app/<id>`; `src/data/tools.ts` is the metadata registry (sidebar, dashboard, sitemap). A test enforces that the two stay in sync.
- **Auth:** Firebase Auth (Google/GitHub), loaded on demand: anonymous visitors to the landing page never download the auth SDK. Only `/app/history` and `/app/profile` require sign-in.
- **Data:** Firestore `users/{uid}` (profile + theme preference) and `toolUsage` (tool id, action and timestamp only — never tool input or output). `firestore.rules` enforces per-user isolation and the exact document shape.
- **Serverless:** `api/remove-bg.ts` (ID-token verified, rate limited) and `api/shorten.ts` (URL validation, SSRF guards, rate limited). Shared helpers in `api/_lib/`.
- **Theme:** Tailwind `darkMode: 'class'`, light / dark / system, applied before first paint by an inline script in `index.html`. Brand colours come from the logo gradient (`tailwind.config.js`).
- **PWA:** `public/sw.js` (cache name stamped per build), `public/manifest.json`, maskable icons.
- **Monitoring:** errors are reported to Google Analytics as `exception` events via `src/utils/errorReporter.ts`; Core Web Vitals (LCP, INP, CLS, FCP, TTFB) are sent as events.

## Adding a tool

1. Create `src/tools/MyTool.tsx` wrapped in `<ToolWrapper toolId="my-tool" …>`. Put pure logic in `src/utils/tools/` and test it in `src/__tests__/tools/`.
2. Call `useToolTracking('my-tool', 'My Tool')` once per completed action.
3. Add the registry entry in `src/data/tools.ts` and the lazy route in `src/routes/index.tsx`.
4. Support both themes (every colour needs a `dark:` pair) and associate every label with its control.
5. Run `npm run verify`.

## Deployment

Vercel reads `vercel.json` (framework `vite`, output `build/`, SPA rewrite, security headers and CSP). Set the `REACT_APP_FIREBASE_*` variables and the server-only `REMOVE_BG_API_KEY` in *Project Settings → Environment Variables*. `public/_headers` mirrors the headers for Netlify / Cloudflare Pages.

## Contributing & security

See [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) and [.github/SECURITY.md](.github/SECURITY.md). Never prefix a secret with `REACT_APP_` or `VITE_`.

## License

MIT — see [LICENSE](LICENSE).
