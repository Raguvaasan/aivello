import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHelmet } from '../common/SEOHelmet';

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  statusCode = 404,
  title = 'Page Not Found',
  message = 'Sorry, the page you are looking for does not exist.'
}) => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHelmet
        title={`${statusCode} - ${title} | Aivello`}
        description={message}
        noindex={true}
      />
      <div className="min-h-screen flex items-center justify-center px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
        <div className="max-w-max mx-auto">
          <main className="sm:flex">
            <p className="text-4xl font-extrabold text-primary sm:text-5xl">
              {statusCode}
            </p>
            <div className="sm:ml-6">
              <div className="sm:border-l sm:border-gray-200 sm:pl-6">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-5xl">
                  {title}
                </h1>
                <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
                  {message}
                </p>
              </div>
              <div className="mt-8 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Go back home
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Go back
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
