import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiGift, FiShield, FiSmartphone, FiZap } from 'react-icons/fi';
import { IconWrapper } from '../common/IconWrapper';
import { tools, categories } from '../../data/tools';

type ToolEntry = (typeof tools)[number];

/** Tools that need a (free) account, shown with a badge so nothing is a surprise. */
const ACCOUNT_REQUIRED = new Set(['bg-remover']);

const popularToolIds = [
  'pdf-to-word',
  'image-compressor',
  'resume-builder',
  'grammar-checker',
  'qr-generator',
  'ai-image-generator',
  'language-translator',
  'bg-remover',
];
const popularTools = popularToolIds
  .map((id) => tools.find((tool) => tool.id === id))
  .filter((tool): tool is ToolEntry => Boolean(tool));

const TOOLS_PER_CATEGORY = 3;
const toolsByCategory = categories
  .filter((category) => category !== 'All')
  .map((category) => ({ category, items: tools.filter((tool) => tool.category === category) }))
  .filter(({ items }) => items.length > 0);

const features = [
  {
    icon: FiGift,
    title: 'Free, no signup',
    description: 'Every tool is free to use. No account, no trial and no credit card.',
  },
  {
    icon: FiShield,
    title: 'Private by design',
    description: 'Most tools run entirely in your browser, so your files never leave your device.',
  },
  {
    icon: FiZap,
    title: 'Fast and lightweight',
    description: 'Each tool loads on demand and starts instantly. No uploads or queues for browser-based tools.',
  },
  {
    icon: FiSmartphone,
    title: 'Works everywhere',
    description: 'Built for phones, tablets and desktops, with light and dark mode.',
  },
] as const;

const card = 'rounded-2xl border border-gray-200 bg-white/80 dark:border-white/10 dark:bg-white/5';
const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950';

const SectionHeading: React.FC<{ id: string; title: React.ReactNode; subtitle: string }> = ({ id, title, subtitle }) => (
  <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
    <h2 id={id} className="mb-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
      {title}
    </h2>
    <p className="text-lg text-gray-600 dark:text-gray-300">{subtitle}</p>
  </div>
);

const AccountBadge: React.FC = () => (
  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
    Free account
  </span>
);

const gradientText =
  'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400';

export const Features: React.FC = () => {
  return (
    <>
      <section id="features" aria-labelledby="features-heading" className="scroll-mt-24 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <SectionHeading
            id="features-heading"
            title={
              <>
                Why <span className={gradientText}>Aivello</span>?
              </>
            }
            subtitle="Everyday tools that respect your time and your privacy."
          />

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <li key={feature.title} className={`${card} p-6`}>
                <div
                  aria-hidden="true"
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white"
                >
                  <IconWrapper icon={feature.icon} className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-300">{feature.description}</p>
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-gray-600 dark:text-gray-300">
            Optional: sign in with Google or GitHub to keep a history of the tools you use and to unlock the
            Background Remover.{' '}
            <Link
              to="/pricing"
              className="font-medium text-purple-700 underline underline-offset-2 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200"
            >
              Compare
            </Link>
          </p>
        </div>
      </section>

      <section
        id="popular-tools"
        aria-labelledby="popular-tools-heading"
        className="scroll-mt-24 bg-gray-50 py-16 dark:bg-white/[0.02] sm:py-24"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <SectionHeading
            id="popular-tools-heading"
            title={
              <>
                Popular <span className={gradientText}>tools</span>
              </>
            }
            subtitle="Start with the tools people use most."
          />

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popularTools.map((tool) => (
              <li key={tool.id}>
                <Link
                  to={tool.path}
                  className={`group flex h-full flex-col ${card} p-5 transition-all hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 dark:hover:border-purple-400/40 ${focusRing}`}
                >
                  <span className="mb-3 flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-xl dark:bg-purple-500/15"
                    >
                      {tool.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-gray-900 group-hover:text-purple-700 dark:text-white dark:group-hover:text-purple-200">
                        {tool.name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                          {tool.category}
                        </span>
                        {ACCOUNT_REQUIRED.has(tool.id) && <AccountBadge />}
                      </span>
                    </span>
                  </span>
                  <span className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{tool.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="categories" aria-labelledby="categories-heading" className="scroll-mt-24 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <SectionHeading
            id="categories-heading"
            title={
              <>
                Browse by <span className={gradientText}>category</span>
              </>
            }
            subtitle={`${tools.length} tools across ${toolsByCategory.length} categories, all free.`}
          />

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {toolsByCategory.map(({ category, items }) => (
              <li key={category} className={`${card} p-5`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{category}</h3>
                  <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
                    {items.length} {items.length === 1 ? 'tool' : 'tools'}
                  </span>
                </div>
                <ul className="mt-2">
                  {items.slice(0, TOOLS_PER_CATEGORY).map((tool) => (
                    <li key={tool.id}>
                      <Link
                        to={tool.path}
                        className={`-mx-2 flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white ${focusRing}`}
                      >
                        <span aria-hidden="true">{tool.icon}</span>
                        <span className="truncate">{tool.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {items.length > TOOLS_PER_CATEGORY && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    +{items.length - TOOLS_PER_CATEGORY} more in the app
                  </p>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-16 rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-10 text-center text-white sm:px-12 sm:py-14">
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl">Ready when you are</h2>
            <p className="mx-auto mb-8 max-w-xl text-white">
              Pick a tool and get started. No account, no download, no cost.
            </p>
            <Link
              to="/app"
              className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3 font-semibold text-purple-700 shadow-lg transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-600"
            >
              Explore all {tools.length} tools
              <IconWrapper icon={FiArrowRight} className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
