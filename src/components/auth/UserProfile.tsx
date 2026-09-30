import React, { useRef, useState, useEffect, useId } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLogIn, FiUser, FiClock, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { IconWrapper } from '../common/IconWrapper';

export const UserProfile: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (loading) {
    return <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Link
        to="/login"
        state={{ from: location }}
        className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold shadow hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 transition"
      >
        <IconWrapper icon={FiLogIn} className="w-4 h-4" />
        <span>Sign in</span>
      </Link>
    );
  }

  const name = user.displayName || user.email || 'Account';
  const initial = (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase();

  const go = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  const itemClass =
    'w-full flex items-center gap-3 text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 focus:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700/70 transition-colors';

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 min-h-[40px] rounded-full pl-1 pr-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 transition"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={`Account menu for ${name}`}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
            loading="lazy"
            /* Google/GitHub avatar CDNs reject requests that carry a referrer. */
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-semibold">
            {initial}
          </span>
        )}
        <span className="hidden md:block max-w-[10rem] truncate text-sm font-medium text-gray-800 dark:text-gray-100">
          {name}
        </span>
        <IconWrapper
          icon={FiChevronDown}
          className={`hidden md:block w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-56 py-2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="px-4 pb-2 mb-1 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.displayName || 'Signed in'}</p>
            {user.email && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>}
          </div>
          <button type="button" role="menuitem" className={itemClass} onClick={() => go('/app/profile')}>
            <IconWrapper icon={FiUser} className="w-4 h-4" /> Profile settings
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={() => go('/app/history')}>
            <IconWrapper icon={FiClock} className="w-4 h-4" /> Usage history
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${itemClass} !text-red-600 dark:!text-red-400`}
            onClick={handleLogout}
          >
            <IconWrapper icon={FiLogOut} className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};
