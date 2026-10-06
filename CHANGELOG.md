# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- pdfjs-dist 5.4 → 6.4.299 (GHSA-hq66-cqwq-w95j: arbitrary JavaScript execution when opening a malicious PDF
  in 5.6.83–6.2.107; PDF to Word and Resume Scanner open user PDFs).
- `overrides` for `@grpc/grpc-js` ^1.14.5 (GHSA-m9gg-hp2v-232j, GHSA-f596-whhp-79r4) and
  `postcss-selector-parser` ^7.1.6 (GHSA-rj75-hqrm-r3gf); lockfile refresh patches dompurify, source-map-js,
  fast-glob and postcss-nested. `npm audit --omit=dev`: 0 vulnerabilities.

### Changed
- firebase 11 → 12, framer-motion 12 → 14, web-vitals 5 → 6, react-qrcode-logo 3 → 4; React 19.3, React Router
  7.18.4, Vite 8.3.3, Tailwind 3.4.19 and other minor/patch updates.
- Node.js 22.13+ required (Vitest 5 and pdfjs-dist 6); CI matrix is now Node 22 and 24.
- Initial JS kept under the 400 KB budget despite React 19.3's larger runtime: per-tool SEO data moved to
  `src/data/toolSeoData.ts` (lazy tool chunks) and the toaster is loaded on demand.

### Removed
- Unused dependencies: `@firebase/auth`, `@loadable/component`, `compromise`, `compromise-numbers`, `sentiment`,
  `@testing-library/user-event`.
- Stale `docs/` folder (pre-Vite guides and already-remediated audit/fix reports; `docs/SECURITY.md`
  duplicated `.github/SECURITY.md`).
- `tools/*.html` logo/icon generators, which still produced the old blue logo.
- Unused `src/App.css` (Create React App boilerplate) and `src/components/ui/card.tsx`.

## [1.0.0] - 2026-09-30

### Added
- **13 new tools** (all client-side): PDF Merge & Split, Image Converter & Resizer, Color Contrast Checker,
  Age & Date Calculator, Lorem Ipsum Generator, Case Converter, JSON Formatter & Validator, Base64
  Encoder/Decoder, Hash Generator, UUID Generator, Text Diff Checker, Regex Tester, Timestamp Converter.
- Re-enabled AI Code Assistant and AI Resume Scanner.
- New logo (violet-to-pink `A✦` mark), favicons, PWA/maskable icons, 1200×630 social card; the Tailwind
  `purple`/`pink` scales now match the logo gradient.
- Real usage history: tools record metadata-only `toolUsage` events (tool, action, time); History and
  Profile pages read them. Cross-device theme sync via `users/{uid}.preferences.theme`.
- `api/shorten.ts` (is.gd proxy with URL validation, SSRF guards, rate limiting) and shared `api/_lib` helpers.
- Breadcrumbs + BreadcrumbList structured data on every tool page; sitemap generated from the tool registry.
- Centralised error reporting (GA `exception` events), stale-chunk auto-reload after deploys, Core Web
  Vitals reporting (now INP instead of FID).
- Dashboard search and category filters; CSS-only landing navigation; bundle budget check in CI.
- Test suite: ~600 Vitest tests, including a smoke test that renders every tool route signed-out.

### Changed
- **Build tooling: Create React App + craco → Vite 8**, Jest → Vitest, ESLint 9 flat config with jsx-a11y.
  `REACT_APP_*` variable names are unchanged.
- **Tools are public** (no login required), as the project guidelines state. Only History and Profile need
  sign-in; Background Remover asks for sign-in because it spends a paid API quota.
- Firebase Auth is loaded on demand; the landing page no longer downloads any Firebase code. Firebase
  Analytics/Performance replaced by the existing gtag.js.
- Initial JavaScript: ~1.5 MB → under 400 KB.
- Pricing page now states the truth: everything is free.
- Firestore rules validate document shape; unused `usage_events` / `usage_history` collections closed.

### Fixed
- Light/dark theme issues across the app shell, login, profile, history, landing, pricing, legal pages and tools.
- QR Code Scanner returned hard-coded fake results; URL Shortener produced fake links; Image Compressor
  uploaded images to Firestore; Password Generator used `Math.random`; several tools had wrong tool ids.
- Removed fabricated ratings from structured data (Google policy) and fake social proof.

### Security
- npm vulnerabilities: 52 → 0.
- CSP/Permissions-Policy updated for camera (QR scanner) and the actual third-party hosts in use.

## [0.x] - earlier

### Added
- Professional project structure reorganization
- Comprehensive GitHub workflows and templates
- Security policy and contributing guidelines
- Development scripts for setup and analysis
- Enhanced documentation structure
- **Modern AI-powered sitemap with 20+ tools** 🔥
- Enhanced landing page metadata and structured data
- Comprehensive robots.txt with modern SEO practices
- Category-based tool organization in sitemap
- All new AI tools added to search engine indexing
- **🎨 Revolutionary Landing Page Design 2025** ✨
  - Modern gradient mesh backgrounds with animated blobs
  - Glassmorphism UI elements and cards
  - Advanced micro-interactions and hover effects
  - Floating tool cards with 3D animations
  - Social proof indicators and user statistics
  - Modern navigation with mega-menu dropdown
  - Mobile-first responsive design improvements
  - Enhanced footer with social links and status indicators

### Changed
- Moved documentation to `docs/` directory
- Moved development tools to `tools/` directory
- Updated README with new project structure
- Enhanced package.json scripts
- **Modernized sitemap.xml with current trends and all available tools**
- **Updated sitemap priorities based on tool popularity and AI focus**
- Improved SEO meta descriptions and titles for better search ranking
- **🚀 Complete Landing Page Transformation**
  - Hero section with modern gradient text and trending badges
  - Features section with enhanced stats and tool showcases
  - Navigation bar with advanced dropdown menus
  - Background patterns and visual effects
  - Typography using modern font weights and gradients
  - Button designs with advanced hover states
  - Color scheme updated to purple/pink gradient themes

### UI/UX Improvements
- **Modern Animation System**: Added blob animations, floating effects, and shimmer transitions
- **Glassmorphism Design**: Implemented backdrop blur effects and translucent cards
- **Enhanced Typography**: Gradient text effects and improved font hierarchy
- **Advanced Interactions**: Hover states, scale transforms, and micro-animations
- **Mobile Experience**: Improved responsive design and touch interactions
- **Visual Hierarchy**: Better content organization and user flow
- **Brand Consistency**: Updated color palette and design tokens

### Technical Enhancements
- Added modern CSS animations and keyframes
- Implemented advanced Framer Motion animations
- Enhanced component structure and reusability
- Improved accessibility with better focus states
- Optimized performance with lazy loading animations

### SEO Improvements
- Added image metadata to sitemap for better visual search
- Implemented structured data markup for tools
- Enhanced changefreq settings for dynamic content
- Added category landing pages for better organization
- Optimized tool descriptions for search engines

### Security
- Fixed API key exposure issues
- Added Content Security Policy
- Enhanced security headers configuration
- Removed vulnerable dependencies (TensorFlow.js)

## [1.0.0] - 2025-01-18

### Added
- Initial release of Aivello platform
- 10+ AI-powered tools
- Firebase authentication
- Dark/light theme support
- Progressive Web App capabilities
- Mobile-responsive design
- SEO optimization

### Tools Included
- Grammar Checker
- PDF to Word Converter
- QR Code Generator
- Text to Speech
- Background Remover
- Image Compressor
- Resume Builder
- Read Time Estimator
- Word Counter
- YouTube Thumbnail Generator

### Security
- Environment variable protection
- Firebase security rules
- Input validation and sanitization
- HTTPS enforcement
- Secure file handling

### Performance
- Code splitting implementation
- Lazy loading for components
- Bundle size optimization
- Service worker for caching
- Error boundaries

---

## Types of Changes
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes
