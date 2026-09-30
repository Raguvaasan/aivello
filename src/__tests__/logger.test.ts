import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * logger reads import.meta.env.DEV once at module load, so each case stubs the env,
 * resets the module registry and re-imports it.
 */
const loadLogger = async (dev: boolean) => {
  vi.stubEnv('DEV', dev);
  vi.stubEnv('PROD', !dev);
  vi.resetModules();
  return (await import('../utils/logger')).logger;
};

describe('logger', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('exposes log, warn, error and info', async () => {
    const logger = await loadLogger(true);
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.info).toBe('function');
  });

  it('writes to the console in development', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = await loadLogger(true);

    logger.log('test message', 42);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('test message', 42);
  });

  it('stays silent in production', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const logger = await loadLogger(false);

    logger.log('should not appear');
    logger.warn('should not appear');
    logger.info('should not appear');
    logger.error('should not appear', new Error('x'));

    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('forwards errors to analytics in production', async () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const logger = await loadLogger(false);

    logger.error('Upload failed', new Error('boom'));

    expect(gtag).toHaveBeenCalledWith('event', 'exception', {
      description: '[Upload failed] Error: boom',
      fatal: false,
    });
    delete window.gtag;
  });

  it('routes warn and error to their own console methods in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const logger = await loadLogger(true);

    logger.warn('careful');
    logger.error('broken');

    expect(warn).toHaveBeenCalledWith('careful');
    expect(error).toHaveBeenCalledWith('broken', undefined);
  });
});
