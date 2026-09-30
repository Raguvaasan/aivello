import React, { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiStar, FiArrowRight } from 'react-icons/fi';
import { tools, categories as categoryOrder } from '../../data/tools';
import { IconWrapper } from '../../components/common/IconWrapper';
import { SEOHelmet } from '../../components/common/SEOHelmet';
import type { Tool } from '../../types';

const FEATURED_IDS = ['pdf-to-word', 'resume-builder', 'grammar-checker', 'image-compressor', 'qr-generator', 'ai-text-summarizer'];

const ToolCard: React.FC<{ tool: Tool; featured?: boolean }> = ({ tool, featured }) => (
  <Link
    to={tool.path}
    className="group flex h-full flex-col bg-white/80 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-5 hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
  >
    <span className="flex items-center gap-3 mb-3">
      <span
        className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-600/20 dark:to-pink-600/20 flex items-center justify-center text-2xl"
        aria-hidden="true"
      >
        {tool.icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors truncate">
          {tool.name}
        </span>
        <span className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {featured && (
            <span className="inline-flex items-center gap-1">
              <IconWrapper icon={FiStar} className="w-3 h-3 text-yellow-500" /> Popular
            </span>
          )}
          {tool.isNew && (
            <span className="px-1.5 py-0.5 rounded-md bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300 font-semibold">
              New
            </span>
          )}
          {!featured && !tool.isNew && tool.category}
        </span>
      </span>
      <IconWrapper
        icon={FiArrowRight}
        className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
      />
    </span>
    <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">{tool.description}</span>
  </Link>
);

export const AppHome: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const searchId = useId();

  // Registry order, limited to categories that actually have tools.
  const categories = useMemo(
    () => categoryOrder.filter((cat) => cat === 'All' || tools.some((tool) => tool.category === cat)),
    []
  );
  const featured = useMemo(
    () => FEATURED_IDS.map((id) => tools.find((tool) => tool.id === id)).filter((tool): tool is Tool => Boolean(tool)),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter(
      (tool) =>
        (category === 'All' || tool.category === category) &&
        (!q ||
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.category.toLowerCase().includes(q))
    );
  }, [query, category]);

  const isFiltering = query.trim() !== '' || category !== 'All';

  return (
    <>
      <SEOHelmet
        title={`All ${tools.length} Free Tools - Aivello`}
        description="Browse every free Aivello tool: PDF, image, writing, developer, design and AI tools. No signup needed."
        url="https://aivello.vercel.app/app"
      />

      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 md:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-3">
            Welcome to Aivello
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {tools.length} free tools for documents, images, writing, code and more. No signup needed.
          </p>
        </header>

        <div className="max-w-2xl mx-auto mb-5 relative">
          <label htmlFor={searchId} className="sr-only">
            Search tools
          </label>
          <IconWrapper icon={FiSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tools.length} tools...`}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-1 px-1 justify-start md:flex-wrap md:justify-center" role="group" aria-label="Filter by category">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={`shrink-0 min-h-[40px] px-4 rounded-full text-sm font-medium border transition-colors ${
                category === cat
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent'
                  : 'bg-white dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isFiltering ? (
          <section aria-live="polite">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {filtered.length} {filtered.length === 1 ? 'tool' : 'tools'}
              {category !== 'All' && <span className="text-gray-500 dark:text-gray-400 font-normal"> in {category}</span>}
            </h2>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            ) : (
              <p className="text-center py-16 text-gray-600 dark:text-gray-400">No tools match your search. Try another word.</p>
            )}
          </section>
        ) : (
          <>
            <section className="mb-12" aria-labelledby="popular-heading">
              <h2 id="popular-heading" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-5">
                Popular tools
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} featured />
                ))}
              </div>
            </section>

            {categories.slice(1).map((cat) => {
              const inCategory = tools.filter((tool) => tool.category === cat);
              const headingId = `category-${cat.toLowerCase().replace(/\W+/g, '-')}`;
              return (
                <section key={cat} className="mb-10" aria-labelledby={headingId}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 id={headingId} className="text-xl font-bold text-gray-900 dark:text-white">
                      {cat}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/40 text-xs text-gray-600 dark:text-gray-400">
                      {inCategory.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inCategory.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>
    </>
  );
};
