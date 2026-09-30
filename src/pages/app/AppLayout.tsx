import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { tools } from '../../data/tools';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';

export const AppLayout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Auth is NOT started here: tools are public, so an anonymous visitor never downloads
  // the Firebase SDK. Returning users are restored by AuthProvider's session hint;
  // Login, ProtectedRoute and account-only tools start auth when they need it.

  // Close the mobile drawer after navigating (including browser back/forward), and
  // start the new page at the top: <main> is the scroll container here, so the
  // router's window-level ScrollRestoration does not reach it.
  useEffect(() => {
    setIsSidebarOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    // Every Framer Motion animation inside the app respects the OS "reduce motion" setting.
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 text-gray-900 dark:text-white">
      <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex h-[calc(100dvh-4rem)] relative">
        <Sidebar
          tools={tools}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <main ref={mainRef} id="main-content" tabIndex={-1} className="flex-1 min-w-0 overflow-y-auto relative focus:outline-none">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
    </MotionConfig>
  );
};
