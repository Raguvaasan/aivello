import React from 'react';
import { Link } from 'react-router-dom';
import { tools } from '../../data/tools';

export const AppHome: React.FC = () => {
  const categories = Array.from(new Set(tools.map(tool => tool.category)));

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
        Welcome to Aivello
      </h1>

      {categories.map(category => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools
              .filter(tool => tool.category === category)
              .map(tool => (
                <Link
                  key={tool.id}
                  to={tool.path}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{tool.icon}</span>
                    <h3 className="font-medium text-gray-800 dark:text-white">
                      {tool.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tool.description}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
