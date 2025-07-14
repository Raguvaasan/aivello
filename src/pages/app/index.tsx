import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { tools } from '../../data/tools';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';

export const AppLayout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { themeClasses } = useTheme();

  return (
    <div className={`min-h-screen ${themeClasses}`}>
      <Header
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar
          tools={tools}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
