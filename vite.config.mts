/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { tools } from './src/data/tools.ts';

const SITE_URL = 'https://aivello.vercel.app';

/**
 * Emits build/sitemap.xml from the tool registry, so the sitemap can never drift from
 * the routes again (the hand-written one listed login-gated pages and missed tools).
 */
const sitemapPlugin = (): Plugin => ({
  name: 'aivello-sitemap',
  apply: 'build',
  generateBundle() {
    const today = new Date().toISOString().slice(0, 10);
    const pages: [string, string, string][] = [
      ['/', 'weekly', '1.0'],
      ['/app', 'weekly', '0.9'],
      ['/pricing', 'monthly', '0.5'],
      ['/privacy', 'yearly', '0.3'],
      ['/terms', 'yearly', '0.3'],
      ...tools.map((tool): [string, string, string] => [tool.path, 'monthly', '0.8']),
    ];
    const body = pages
      .map(
        ([path, freq, priority]) =>
          `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <lastmod>${today}</lastmod>\n` +
          `    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
      )
      .join('\n');
    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source:
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    });
  },
});

/**
 * Vite replaced Create React App (react-scripts + craco) in 2026-09.
 *
 * - `envPrefix` keeps the existing REACT_APP_* variable names, so the Vercel dashboard
 *   and every developer's .env.local keep working unchanged. Only prefixed variables
 *   reach the client bundle; server secrets (REMOVE_BG_API_KEY) must stay unprefixed.
 * - Output goes to `build/` (not Vite's default `dist/`) to match vercel.json and the
 *   service-worker stamping script.
 */
export default defineConfig({
  plugins: [react(), sitemapPlugin()],
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    port: 3000,
    open: false,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: 'build',
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              // Needed on every page; one long-cached chunk beats several small ones.
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts'],
    css: false,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html'],
      include: ['src/**/*.{ts,tsx}', 'api/**/*.ts'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/__tests__/**', 'src/setupTests.ts', 'src/vite-env.d.ts'],
    },
  },
});
