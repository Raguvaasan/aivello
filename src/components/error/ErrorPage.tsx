import React, { useEffect } from 'react';
import { isRouteErrorResponse, Link, useNavigate, useRouteError } from 'react-router-dom';
import { SEOHelmet } from '../common/SEOHelmet';
import { isChunkLoadError, reloadForNewVersion, reportError } from '../../utils/errorReporter';

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
}

/**
 * Router `errorElement`. Also usable directly with explicit props.
 *
 * Previously it always rendered "404 Page Not Found" - including for crashes inside
 * a tool - and styled itself with `bg-primary`/`text-primary`, which do not exist in
 * the Tailwind config (primary is a scale), so its buttons rendered unstyled.
 */
export const ErrorPage: React.FC<ErrorPageProps> = (props) => {
  const routeError = useRouteError();
  const navigate = useNavigate();

  const isResponse = isRouteErrorResponse(routeError);
  const statusCode = props.statusCode ?? (isResponse ? routeError.status : routeError ? 500 : 404);
  const title =
    props.title ?? (statusCode === 404 ? 'Page not found' : 'Something went wrong');
  const message =
    props.message ??
    (statusCode === 404
      ? 'Sorry, the page you are looking for does not exist.'
      : 'An unexpected error occurred while loading this page. Please try again.');

  useEffect(() => {
    if (!routeError || isResponse) return;
    if (isChunkLoadError(routeError) && reloadForNewVersion()) return;
    reportError(routeError, 'RouteError', true);
  }, [routeError, isResponse]);

  return (
    <>
      <SEOHelmet title={`${statusCode} - ${title} | Aivello`} description={message} noindex />
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-lg text-center sm:text-left sm:flex sm:items-start sm:gap-6">
          <p className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {statusCode}
          </p>
          <div className="mt-4 sm:mt-0 sm:border-l sm:border-gray-200 dark:sm:border-gray-700 sm:pl-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">{title}</h1>
            <p className="mt-2 text-base text-gray-600 dark:text-gray-400">{message}</p>
            <div className="mt-8 flex flex-wrap justify-center sm:justify-start gap-3">
              <Link
                to="/"
                className="inline-flex items-center min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                Go back home
              </Link>
              {statusCode !== 404 ? (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 dark:text-purple-200 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  Try again
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 dark:text-purple-200 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  Go back
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
