import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiSearch, FiRefreshCw, FiArrowRight, FiAlertTriangle } from 'react-icons/fi';
import { SEOHelmet } from '../../components/common/SEOHelmet';
import { seoData } from '../../data/seoData';
import { IconWrapper } from '../../components/common/IconWrapper';
import { useAuth } from '../../context/AuthContext';
import { tools } from '../../data/tools';
import type { ToolAction, ToolUsageEntry } from '../../utils/toolUsage';

const ACTION_LABELS: Record<ToolAction, string> = {
  use: 'Used',
  generate: 'Generated',
  convert: 'Converted',
  analyze: 'Analyzed',
  download: 'Downloaded',
  copy: 'Copied',
};

const toolById = new Map(tools.map((tool) => [tool.id, tool]));

const relativeTime = (date: Date, now = Date.now()): string => {
  const seconds = Math.round((date.getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(seconds, 'second');
};

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; items: ToolUsageEntry[] };

/**
 * The signed-in user's tool usage, read from the Firestore `toolUsage` collection.
 *
 * This page used to render four hardcoded example items ("Generated React Component,
 * 2 hours ago") for every user, with view/delete buttons that did nothing.
 */
const History: React.FC = () => {
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [query, setQuery] = useState('');
  const searchId = useId();

  const load = useCallback(async () => {
    if (!user) return;
    setState({ status: 'loading' });
    try {
      const { getUserToolHistory } = await import('../../utils/toolUsage');
      setState({ status: 'ready', items: await getUserToolHistory(user.uid, 100) });
    } catch {
      setState({ status: 'error' });
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => {
    if (state.status !== 'ready') return [];
    const q = query.trim().toLowerCase();
    if (!q) return state.items;
    return state.items.filter(
      (item) => item.toolName.toLowerCase().includes(q) || ACTION_LABELS[item.action]?.toLowerCase().includes(q)
    );
  }, [state, query]);

  const summary = useMemo(() => {
    if (state.status !== 'ready') return null;
    const counts = new Map<string, number>();
    for (const item of state.items) counts.set(item.toolId, (counts.get(item.toolId) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      total: state.items.length,
      distinctTools: counts.size,
      favourite: top ? toolById.get(top[0])?.name ?? top[0] : null,
    };
  }, [state]);

  return (
    <>
      <SEOHelmet
        title={seoData.pages.history.title}
        description={seoData.pages.history.description}
        keywords={seoData.pages.history.keywords}
        url="https://aivello.vercel.app/app/history"
        noindex
      />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-3">
            Usage History
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            The tools you have used recently. Only the tool and time are stored — never what you typed or uploaded.
          </p>
        </div>

        {summary && summary.total > 0 && (
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              ['Recent actions', String(summary.total)],
              ['Different tools', String(summary.distinctTools)],
              ['Most used', summary.favourite ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 text-center">
                <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="mt-1 text-xl font-bold text-gray-900 dark:text-white truncate">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <label htmlFor={searchId} className="sr-only">
              Search your history
            </label>
            <IconWrapper icon={FiSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by tool or action..."
              className="w-full bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 rounded-2xl pl-12 pr-4 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={state.status === 'loading'}
            aria-label="Refresh history"
            className="shrink-0 px-4 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/20 disabled:opacity-50 transition-colors"
          >
            <IconWrapper icon={FiRefreshCw} className={`w-5 h-5 ${state.status === 'loading' ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div aria-live="polite">
          {state.status === 'loading' && (
            <ul className="space-y-3" aria-label="Loading history">
              {[0, 1, 2].map((i) => (
                <li key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
              ))}
            </ul>
          )}

          {state.status === 'error' && (
            <div role="alert" className="flex flex-col items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-8 text-center">
              <IconWrapper icon={FiAlertTriangle} className="w-8 h-8 text-red-600 dark:text-red-400" />
              <p className="font-semibold text-red-800 dark:text-red-200">Couldn't load your history.</p>
              <p className="text-sm text-red-700 dark:text-red-300">Check your connection and try again.</p>
            </div>
          )}

          {state.status === 'ready' && items.length > 0 && (
            <ul className="space-y-3">
              {items.map((item) => {
                const tool = toolById.get(item.toolId);
                return (
                  <li key={item.id}>
                    <Link
                      to={tool?.path ?? '/app'}
                      className="group flex items-center gap-4 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors"
                    >
                      <span className="w-12 h-12 shrink-0 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-2xl" aria-hidden="true">
                        {tool?.icon ?? '🛠️'}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-gray-900 dark:text-white truncate">{tool?.name ?? item.toolName}</span>
                        <span className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                            {ACTION_LABELS[item.action] ?? 'Used'}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <IconWrapper icon={FiClock} className="w-3 h-3" />
                            <time dateTime={item.timestamp.toISOString()} title={item.timestamp.toLocaleString()}>
                              {relativeTime(item.timestamp)}
                            </time>
                          </span>
                        </span>
                      </span>
                      <IconWrapper icon={FiArrowRight} className="w-4 h-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-300 group-hover:translate-x-0.5 transition" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {state.status === 'ready' && items.length === 0 && (
            <div className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center">
              <div className="bg-gray-100 dark:bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <IconWrapper icon={FiClock} className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {query ? 'No matching activity' : 'No history yet'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                {query
                  ? 'Try a different search.'
                  : 'Your tool usage will appear here once you generate, convert or download something.'}
              </p>
              {!query && (
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90"
                >
                  Explore tools <IconWrapper icon={FiArrowRight} className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default History;
