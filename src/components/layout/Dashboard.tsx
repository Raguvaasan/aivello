import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { tools } from '../../data/tools';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Dashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { darkMode } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
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

        <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
          <div className="max-w-3xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};