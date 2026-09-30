import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiGrid, FiLock, FiMoon } from 'react-icons/fi';
import { tools } from '../../data/tools';
import { IconWrapper } from '../common/IconWrapper';

/** Rounded-down tool count ("30+"), so the copy stays true as tools are added. */
const toolCountLabel = tools.length >= 10 ? `${Math.floor(tools.length / 5) * 5}+` : String(tools.length);

const highlights = [
  { icon: FiGrid, label: `${toolCountLabel} free tools` },
  { icon: FiCheckCircle, label: 'No signup' },
  { icon: FiLock, label: 'Runs in your browser' },
  { icon: FiMoon, label: 'Light & dark mode' },
] as const;

// All four process everything locally, which the caption below relies on.
const previewToolIds = ['pdf-to-word', 'image-compressor', 'resume-builder', 'qr-generator'];
const previewTools = previewToolIds
  .map((id) => tools.find((tool) => tool.id === id))
  .filter((tool): tool is (typeof tools)[number] => Boolean(tool));

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950';

/**
 * Above-the-fold hero. This is the LCP section, so it is deliberately plain: no
 * framer-motion, no entrance animation on the headline, and only two decorative
 * blobs that animate only when the user has not asked for reduced motion.
 */
export const Hero: React.FC = () => {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50 via-white to-white dark:from-purple-950/40 dark:via-gray-950 dark:to-gray-950" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-300/40 blur-3xl dark:bg-purple-600/20 motion-safe:animate-blob" />
        <div className="absolute top-8 -right-24 h-72 w-72 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-600/15 motion-safe:animate-blob animation-delay-2000" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-2 text-sm font-medium text-purple-700 dark:border-purple-400/30 dark:bg-white/5 dark:text-purple-300">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600" />
              {toolCountLabel} tools &middot; Free forever
            </p>

            <h1
              id="hero-heading"
              className="mb-6 text-4xl font-black leading-[1.1] tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl"
            >
              Free AI &amp; productivity tools{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
                right in your browser
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300 sm:text-xl lg:mx-0">
              Convert PDFs, compress images, build a resume, check grammar and more. No account needed, and most
              tools process your files on your device, so they never leave it.
            </p>

            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
              <Link
                to="/app"
                className={`group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:-translate-y-0.5 hover:shadow-purple-500/40 ${focusRing}`}
              >
                Browse all tools
                <IconWrapper icon={FiArrowRight} className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#popular-tools"
                className={`inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-gray-300 bg-white/80 px-8 py-3 font-semibold text-gray-900 transition-colors hover:border-purple-300 hover:text-purple-700 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-purple-400/50 dark:hover:text-purple-200 ${focusRing}`}
              >
                See popular tools
              </a>
            </div>

            <ul className="mx-auto mt-10 grid max-w-md grid-cols-2 gap-x-4 gap-y-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center sm:gap-x-6 lg:justify-start">
              {highlights.map(({ icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <IconWrapper icon={icon} className="h-4 w-4 shrink-0 text-purple-700 dark:text-purple-300" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Desktop-only preview of real tools; mobile gets the full grid further down. */}
          <div className="hidden lg:block">
            <div className="mx-auto max-w-md rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-2xl shadow-purple-500/10 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Try one now
              </p>
              <ul className="space-y-2">
                {previewTools.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      to={tool.path}
                      className={`group flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-purple-50 dark:hover:bg-white/5 ${focusRing}`}
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-xl dark:bg-purple-500/15"
                      >
                        {tool.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-gray-900 group-hover:text-purple-700 dark:text-white dark:group-hover:text-purple-200">
                          {tool.name}
                        </span>
                        <span className="block truncate text-sm text-gray-500 dark:text-gray-400">{tool.description}</span>
                      </span>
                      <IconWrapper
                        icon={FiArrowRight}
                        className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-purple-700 dark:group-hover:text-purple-300"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex items-center gap-2 border-t border-gray-200 pt-4 text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">
                <IconWrapper icon={FiLock} className="h-4 w-4 shrink-0 text-purple-700 dark:text-purple-300" />
                These run entirely in your browser, so your files stay on your device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
