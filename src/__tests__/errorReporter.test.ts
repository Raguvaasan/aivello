import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetErrorReporterForTests,
  describeError,
  isChunkLoadError,
  reloadForNewVersion,
  reportError,
} from '../utils/errorReporter';

describe('errorReporter', () => {
  const gtag = vi.fn();

  beforeEach(() => {
    __resetErrorReporterForTests();
    gtag.mockReset();
    window.gtag = gtag;
    vi.stubEnv('PROD', true);
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.gtag;
  });

  it('describes errors, strings and objects', () => {
    expect(describeError(new TypeError('bad'))).toBe('TypeError: bad');
    expect(describeError('plain')).toBe('plain');
    expect(describeError({ code: 1 })).toBe('{"code":1}');
  });

  it('recognises chunk load failures from all major browsers', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: /assets/x.js'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true);
    expect(isChunkLoadError(new Error('Something else'))).toBe(false);
  });

  it('sends a truncated exception event', () => {
    reportError(new Error('x'.repeat(500)), 'Ctx');
    expect(gtag).toHaveBeenCalledTimes(1);
    const [, name, params] = gtag.mock.calls[0];
    expect(name).toBe('exception');
    expect(params.description.length).toBeLessThanOrEqual(150);
    expect(params.description.startsWith('[Ctx] Error: xxx')).toBe(true);
  });

  it('de-duplicates identical errors and caps reports per session', () => {
    reportError(new Error('same'));
    reportError(new Error('same'));
    expect(gtag).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 50; i++) reportError(new Error(`unique ${i}`));
    expect(gtag.mock.calls.length).toBeLessThanOrEqual(20);
  });

  it('does nothing outside production', () => {
    vi.stubEnv('PROD', false);
    reportError(new Error('dev only'));
    expect(gtag).not.toHaveBeenCalled();
  });

  it('only reloads once per minute for a stale chunk', () => {
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, reload } });

    expect(reloadForNewVersion()).toBe(true);
    expect(reloadForNewVersion()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });
});
