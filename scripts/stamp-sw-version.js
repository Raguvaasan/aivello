/**
 * Stamps a build-derived id into build/sw.js, replacing the __BUILD_ID__ placeholder.
 *
 * Why: the service worker cache name used to be a hand-maintained 'aivello-v2'. If a
 * deploy went out without someone remembering to bump it, returning visitors kept the
 * cached index.html, which referenced hashed JS chunks that no longer existed on the
 * server - a white screen until a hard refresh.
 *
 * The id is a hash of the emitted asset filenames (Vite writes them to build/assets), so it changes when (and only when)
 * the build output changes.
 *
 * Runs via the postbuild npm hook.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const SW_PATH = path.join(BUILD_DIR, 'sw.js');
const PLACEHOLDER = '__BUILD_ID__';

if (!fs.existsSync(SW_PATH)) {
  console.error(`[stamp-sw-version] ${SW_PATH} not found - did the build run?`);
  process.exit(1);
}

function collectAssetNames(dir) {
  const names = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      names.push(...collectAssetNames(full));
    } else {
      names.push(path.relative(BUILD_DIR, full).replace(/\\/g, '/'));
    }
  }
  return names;
}

const staticDir = path.join(BUILD_DIR, 'assets');
const assetNames = fs.existsSync(staticDir) ? collectAssetNames(staticDir).sort() : [];

const buildId = crypto
  .createHash('sha256')
  .update(assetNames.join('\n'))
  .digest('hex')
  .slice(0, 12);

const sw = fs.readFileSync(SW_PATH, 'utf8');

if (!sw.includes(PLACEHOLDER)) {
  console.warn(
    `[stamp-sw-version] ${PLACEHOLDER} not found in build/sw.js - cache busting is NOT active.`
  );
  process.exit(0);
}

fs.writeFileSync(SW_PATH, sw.split(PLACEHOLDER).join(buildId));
console.log(`[stamp-sw-version] cache name -> aivello-${buildId} (${assetNames.length} assets)`);
