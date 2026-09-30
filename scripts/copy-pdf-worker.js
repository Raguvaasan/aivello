/**
 * Copies the pdf.js worker out of node_modules and into public/ so it is served
 * from our own origin.
 *
 * Why this exists: public/pdf.worker.min.js used to be a one-line shim that did
 * importScripts() against cdnjs at pdf.js 3.11.174, while package.json pins
 * pdfjs-dist 5.4.54. That was blocked by our Content-Security-Policy, was two
 * major versions out of sync with the library, and sent user PDFs through a
 * third-party origin in a tool that advertises client-side processing.
 *
 * Runs automatically via the prestart/prebuild npm hooks, so the copy can never
 * drift from the installed version.
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(
  __dirname,
  '..',
  'node_modules',
  'pdfjs-dist',
  'build',
  'pdf.worker.min.mjs'
);
const DEST_DIR = path.join(__dirname, '..', 'public');
const DEST = path.join(DEST_DIR, 'pdf.worker.min.mjs');

if (!fs.existsSync(SOURCE)) {
  console.error(
    `[copy-pdf-worker] Could not find ${SOURCE}\n` +
      `  Run "npm install" first. The PDF tools will not work without this file.`
  );
  process.exit(1);
}

fs.mkdirSync(DEST_DIR, { recursive: true });
fs.copyFileSync(SOURCE, DEST);

const { version } = require('pdfjs-dist/package.json');
const sizeKb = Math.round(fs.statSync(DEST).size / 1024);
console.log(`[copy-pdf-worker] pdf.js worker v${version} -> public/pdf.worker.min.mjs (${sizeKb} KB)`);
