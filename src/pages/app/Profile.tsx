import React, { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUser, FiSettings, FiActivity, FiShield, FiMail, FiCalendar, FiLogOut, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme, Theme } from '../../context/ThemeContext';
import { SEOHelmet } from '../../components/common/SEOHelmet';
import { seoData } from '../../data/seoData';
import { IconWrapper } from '../../components/common/IconWrapper';
import { tools } from '../../data/tools';
import type { ToolUsageEntry } from '../../utils/toolUsage';
import { logger } from '../../utils/logger';

/** Firebase Auth exposes these as RFC-1123 date strings; render them in the user's locale. */
const formatAuthDate = (value?: string | null): string => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unknown'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const providerLabel = (providerId?: string): string => {
  switch (providerId) {
    case 'google.com':
      return 'Google';
    case 'github.com':
      return 'GitHub';
    default:
      return 'Unknown';
  }
};

const toolById = new Map(tools.map((tool) => [tool.id, tool]));

const card = 'bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6';
const field = 'bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-white/5 p-4 rounded-xl';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const themeId = useId();
  const [recent, setRecent] = useState<ToolUsageEntry[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    import('../../utils/toolUsage')
      .then(({ getUserToolHistory }) => getUserToolHistory(user.uid, 5))
      .then((items) => {
        if (!cancelled) setRecent(items);
      })
      .catch(() => {
        if (!cancelled) setRecent([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  /**
   * Applies the theme locally and saves it to users/{uid}.preferences.theme, which is
   * applied automatically the next time this account signs in on another device.
   */
  const handleThemeChange = async (next: Theme) => {
    setTheme(next);
    if (!user) return;
    try {
      const { updateUserPreferences } = await import('../../utils/firestore');
      await updateUserPreferences(user.uid, { theme: next });
    } catch (error) {
      logger.error('Failed to save theme preference', error);
      toast.error('Theme changed on this device, but could not be synced to your account.');
    }
  };

  const initial = (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <>
      <SEOHelmet
        title={seoData.pages.profile.title}
        description={seoData.pages.profile.description}
        keywords={seoData.pages.profile.keywords}
        url="https://aivello.vercel.app/app/profile"
        noindex
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <section className={`${card} flex flex-col sm:flex-row items-center sm:items-start gap-6`}>
          <div className="relative shrink-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                width={96}
                height={96}
                className="w-24 h-24 rounded-2xl border-2 border-purple-500/30 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-3xl text-white font-bold">
                {initial}
              </div>
            )}
            <span
              className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 w-8 h-8 rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <IconWrapper icon={FiUser} className="w-4 h-4 text-white" />
            </span>
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-700 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-2 break-words">
              {user?.displayName || 'Your profile'}
            </h1>
            {user?.email && (
              <p className="flex items-center justify-center sm:justify-start gap-2 text-gray-600 dark:text-gray-300 break-all">
                <IconWrapper icon={FiMail} className="w-4 h-4 shrink-0" />
                <span>{user.email}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-300 dark:bg-red-500/10 dark:hover:bg-red-500/20 font-medium transition-colors"
          >
            <IconWrapper icon={FiLogOut} className="w-4 h-4" /> Sign out
          </button>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <section className={card} aria-labelledby="account-details-heading">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-purple-100 dark:bg-purple-500/20 p-3 rounded-xl">
                <IconWrapper icon={FiShield} className="w-6 h-6 text-purple-700 dark:text-purple-300" />
              </span>
              <h2 id="account-details-heading" className="text-xl font-semibold text-gray-900 dark:text-white">
                Account details
              </h2>
            </div>

            <dl className="space-y-4">
              <div className={field}>
                <dt className="flex items-center gap-2 mb-1 text-sm text-gray-500 dark:text-gray-400">
                  <IconWrapper icon={FiCalendar} className="w-4 h-4" /> Account created
                </dt>
                <dd className="text-gray-900 dark:text-white font-medium">{formatAuthDate(user?.metadata?.creationTime)}</dd>
              </div>
              <div className={field}>
                <dt className="flex items-center gap-2 mb-1 text-sm text-gray-500 dark:text-gray-400">
                  <IconWrapper icon={FiActivity} className="w-4 h-4" /> Last sign-in
                </dt>
                <dd className="text-gray-900 dark:text-white font-medium">{formatAuthDate(user?.metadata?.lastSignInTime)}</dd>
              </div>
              <div className={field}>
                <dt className="flex items-center gap-2 mb-1 text-sm text-gray-500 dark:text-gray-400">
                  <IconWrapper icon={FiShield} className="w-4 h-4" /> Sign-in provider
                </dt>
                <dd className="text-gray-900 dark:text-white font-medium">{providerLabel(user?.providerData?.[0]?.providerId)}</dd>
              </div>
            </dl>
          </section>

          <section className={card} aria-labelledby="preferences-heading">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-purple-100 dark:bg-purple-500/20 p-3 rounded-xl">
                <IconWrapper icon={FiSettings} className="w-6 h-6 text-purple-700 dark:text-purple-300" />
              </span>
              <h2 id="preferences-heading" className="text-xl font-semibold text-gray-900 dark:text-white">
                Preferences
              </h2>
            </div>

            <div className={field}>
              <label htmlFor={themeId} className="block text-sm text-gray-500 dark:text-gray-400 mb-3">
                Theme
              </label>
              <select
                id={themeId}
                value={theme}
                onChange={(e) => void handleThemeChange(e.target.value as Theme)}
                className="w-full rounded-xl px-4 py-3 bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option className="bg-white dark:bg-gray-800" value="light">Light</option>
                <option className="bg-white dark:bg-gray-800" value="dark">Dark</option>
                <option className="bg-white dark:bg-gray-800" value="system">System (follow device)</option>
              </select>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Saved to your account and applied when you sign in on another device.
              </p>
            </div>
          </section>
        </div>

        <section className={card} aria-labelledby="recent-activity-heading">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <span className="bg-purple-100 dark:bg-purple-500/20 p-3 rounded-xl">
                <IconWrapper icon={FiActivity} className="w-6 h-6 text-purple-700 dark:text-purple-300" />
              </span>
              <h2 id="recent-activity-heading" className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent activity
              </h2>
            </div>
            <Link
              to="/app/history"
              className="inline-flex items-center gap-1 text-sm font-medium text-purple-700 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200"
            >
              View all <IconWrapper icon={FiArrowRight} className="w-4 h-4" />
            </Link>
          </div>

          {recent === null ? (
            <div className="h-16 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" role="status" aria-label="Loading recent activity" />
          ) : recent.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400 py-6">No activity yet. Your tool usage will appear here.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-white/10">
              {recent.map((item) => {
                const tool = toolById.get(item.toolId);
                return (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <span className="text-xl" aria-hidden="true">{tool?.icon ?? '🛠️'}</span>
                    <span className="flex-1 min-w-0 truncate text-gray-900 dark:text-white">{tool?.name ?? item.toolName}</span>
                    <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={item.timestamp.toISOString()}>
                      {item.timestamp.toLocaleDateString()}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
};
