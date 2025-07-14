import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
      // Force navigation to landing page
      window.location.href = '/';
    } catch (error) {
      
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
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

  if (!user) {
    return null;
  }

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-full"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-red">
            {user.displayName?.[0] || user.email?.[0] || 'U'}
          </div>
        )}
        <span className="text-red-700 hover:text-red transition">
          {user.displayName || user.email}
        </span>
      </button>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-50 w-48 py-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700"
          style={{
            top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 8 : 0,
            left: buttonRef.current ? buttonRef.current.getBoundingClientRect().right - 192 : 0,
          }}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu"
        >
          <button
            onClick={() => {
              navigate('/app/profile');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition focus:outline-none focus:bg-gray-700"
            role="menuitem"
          >
            Profile Settings
          </button>
          <button
            onClick={() => {
              navigate('/app/history');
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition focus:outline-none focus:bg-gray-700"
            role="menuitem"
          >
            Usage History
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition focus:outline-none focus:bg-gray-700"
            role="menuitem"
          >
            Sign Out
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
