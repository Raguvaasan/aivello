import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMoon, FiSun, FiMonitor, FiMenu, FiX, FiArrowRight, FiChevronDown } from 'react-icons/fi';
import { tools } from '../../data/tools';
import { useTheme } from '../../context/ThemeContext';
import { IconWrapper } from '../common/IconWrapper';
import { AivelloLogo } from '../common/AivelloLogo';

const popularToolIds = ['pdf-to-word', 'resume-builder', 'grammar-checker', 'qr-generator', 'image-compressor', 'bg-remover'];
const popularTools = popularToolIds
  .map((id) => tools.find((tool) => tool.id === id))
  .filter((tool): tool is (typeof tools)[number] => Boolean(tool));

const themeMeta = {
  light: { icon: FiSun, next: 'dark' },
  dark: { icon: FiMoon, next: 'system' },
  system: { icon: FiMonitor, next: 'light' },
} as const;

const navLink =
  'text-gray-700 hover:text-purple-700 dark:text-gray-300 dark:hover:text-white transition-colors font-medium rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const meta = themeMeta[theme];
  const label = `Theme: ${theme}. Switch to ${meta.next}`;
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2.5 rounded-xl text-gray-700 hover:text-purple-700 hover:bg-purple-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
      aria-label={label}
      title={label}
    >
      <IconWrapper icon={meta.icon} className="h-5 w-5" />
    </button>
  );
};

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed w-full z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/70 dark:border-white/10"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link
              to="/"
              className="flex items-center rounded-lg text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
              aria-label="Aivello home"
            >
              <AivelloLogo height={36} title="" />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="/#features" className={navLink}>
                Features
              </a>

              {/* Opens on hover and on keyboard focus (focus-within). */}
              <div className="relative group">
                <Link to="/app" className={`${navLink} flex items-center gap-1`} aria-haspopup="true">
                  Tools
                  <IconWrapper icon={FiChevronDown} className="w-4 h-4 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
                </Link>
                <div className="absolute top-full right-0 w-80 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
                  <div className="py-4 bg-white dark:bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl">
                    <p className="px-4 mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Popular tools
                    </p>
                    <ul className="grid grid-cols-2 gap-1 px-2">
                      {popularTools.map((tool) => (
                        <li key={tool.id}>
                          <Link
                            to={tool.path}
                            className="flex items-center gap-2 p-2.5 text-gray-700 hover:text-purple-700 hover:bg-purple-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5 rounded-xl transition-colors"
                          >
                            <span className="text-lg" aria-hidden="true">{tool.icon}</span>
                            <span className="text-sm font-medium truncate">{tool.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-gray-200 dark:border-white/10 mt-3 pt-3 px-4">
                      <Link
                        to="/app"
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                      >
                        View all {tools.length} tools <IconWrapper icon={FiArrowRight} className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <Link to="/pricing" className={navLink}>
                Pricing
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <Link
                to="/app"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
              >
                Launch App
              </Link>
            </div>

            <div className="md:hidden flex items-center gap-1">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                className="p-2.5 rounded-xl text-gray-700 hover:bg-purple-50 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="landing-mobile-menu"
              >
                <IconWrapper icon={isMobileMenuOpen ? FiX : FiMenu} className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
          <div
            id="landing-mobile-menu"
            className="motion-safe:animate-[fadeDown_150ms_ease-out] fixed inset-x-0 top-16 sm:top-20 z-40 bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-b border-gray-200 dark:border-white/10 shadow-lg md:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto"
          >
            <div className="container mx-auto px-4 py-5 space-y-4">
              <a href="/#features" onClick={() => setIsMobileMenuOpen(false)} className={`block py-2 ${navLink}`}>
                Features
              </a>
              <Link to="/pricing" className={`block py-2 ${navLink}`}>
                Pricing
              </Link>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Popular tools</p>
                <ul className="grid grid-cols-1 gap-1">
                  {popularTools.slice(0, 4).map((tool) => (
                    <li key={tool.id}>
                      <Link
                        to={tool.path}
                        className="flex items-center gap-3 p-3 text-gray-700 hover:bg-purple-50 dark:text-gray-300 dark:hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <span className="text-lg" aria-hidden="true">{tool.icon}</span>
                        <span>
                          <span className="block text-sm font-medium">{tool.name}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">{tool.category}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                <Link
                  to="/app"
                  className="block text-center w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/25"
                >
                  Launch App
                </Link>
              </div>
            </div>
          </div>
        )}
    </>
  );
};
