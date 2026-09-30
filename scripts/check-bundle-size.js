/**
 * Enforces the bundle budget from .github/copilot-instructions.md.
 *
 * Measures the JavaScript a first-time visitor downloads before the landing page is
 * interactive: every <script type="module"> and <link rel="modulepreload"> referenced
 * from build/index.html. Lazy chunks (tools, auth, Firestore) are not counted - they
 * are only fetched when a page needs them.
 *
 * The budget is checked against gzip size, which is what users actually download
 * (Vercel serves Brotli, which is smaller still).
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const BUDGET_GZIP_KB = 130; // initial JS, gzip
const BUDGET_RAW_KB = 400; // initial JS, uncompressed (the < 400KB target in the project guidelines)
const MAX_CHUNK_GZIP_KB = 250; // any single lazy chunk

const html = fs.readFileSync(path.join(BUILD_DIR, 'index.html'), 'utf8');
const initial = new Set(
  [...html.matchAll(/<(?:script[^>]+src|link[^>]+rel="modulepreload"[^>]+href)="\/?(assets\/[^"]+\.js)"/g)].map((m) => m[1])
);

const sizeOf = (rel) => {
  const buf = fs.readFileSync(path.join(BUILD_DIR, rel));
  return { raw: buf.length / 1024, gzip: zlib.gzipSync(buf, { level: 9 }).length / 1024 };
};

let rawTotal = 0;
let gzipTotal = 0;
console.log('Initial JavaScript:');
for (const rel of initial) {
  const { raw, gzip } = sizeOf(rel);
  rawTotal += raw;
  gzipTotal += gzip;
  console.log(`  ${rel.padEnd(48)} ${raw.toFixed(1).padStart(8)} KB  (${gzip.toFixed(1)} KB gzip)`);
}
console.log(`  ${'TOTAL'.padEnd(48)} ${rawTotal.toFixed(1).padStart(8)} KB  (${gzipTotal.toFixed(1)} KB gzip)`);

const assets = fs.readdirSync(path.join(BUILD_DIR, 'assets')).filter((f) => f.endsWith('.js'));
const oversized = assets
  .map((f) => ({ f, ...sizeOf(path.join('assets', f)) }))
  .filter((c) => c.gzip > MAX_CHUNK_GZIP_KB);

let failed = false;
if (gzipTotal > BUDGET_GZIP_KB) {
  console.error(`\n✖ Initial JS ${gzipTotal.toFixed(1)} KB gzip exceeds budget of ${BUDGET_GZIP_KB} KB`);
  failed = true;
}
if (rawTotal > BUDGET_RAW_KB) {
  console.error(`✖ Initial JS ${rawTotal.toFixed(1)} KB exceeds budget of ${BUDGET_RAW_KB} KB`);
  failed = true;
}
for (const c of oversized) {
  console.error(`✖ Chunk ${c.f} is ${c.gzip.toFixed(1)} KB gzip (max ${MAX_CHUNK_GZIP_KB} KB)`);
  failed = true;
}

console.log(`\n${assets.length} JS chunks emitted.`);
if (failed) process.exit(1);
console.log('✔ Bundle within budget');
