import React, { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import AnalyticsProvider from '../context/AnalyticsProvider';
import { toolRoutes } from '../routes';
import { tools } from '../data/tools';

// Tools are public, so they must render for a signed-out visitor without touching
// Firebase. The auth context is replaced with a signed-out stub.
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    initialized: true,
    ensureAuth: () => undefined,
    signInWithGoogle: vi.fn(),
    signInWithGithub: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('every tool route renders for a signed-out visitor', () => {
  for (const tool of tools) {
    it(`${tool.id}`, async () => {
      const Tool = toolRoutes[tool.id];
      expect(Tool, `no route for ${tool.id}`).toBeDefined();

      const errors: unknown[] = [];
      const onError = (event: ErrorEvent) => errors.push(event.error);
      window.addEventListener('error', onError);

      render(
        <MemoryRouter initialEntries={[tool.path]}>
          <ThemeProvider>
            <AnalyticsProvider>
              <Suspense fallback={<div>loading</div>}>
                <Tool />
              </Suspense>
            </AnalyticsProvider>
          </ThemeProvider>
        </MemoryRouter>
      );

      // ToolWrapper renders the breadcrumb once the lazy chunk has resolved.
      const crumb = await screen.findByRole('navigation', { name: 'Breadcrumb' }, { timeout: 15000 });
      expect(crumb).toHaveTextContent(tool.name);
      expect(document.title.toLowerCase()).toContain('aivello');

      window.removeEventListener('error', onError);
      cleanup();
      expect(errors).toEqual([]);
    }, 30000);
  }
});
