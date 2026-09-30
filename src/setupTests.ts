// Adds jest-dom matchers (toBeInTheDocument, toHaveTextContent, ...) to Vitest's expect.
import '@testing-library/jest-dom/vitest';

// jsdom does not implement these browser APIs; components feature-detect some of
// them, but ThemeProvider and a few tools read them on mount.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

if (!window.scrollTo || window.scrollTo.toString().includes('Not implemented')) {
  window.scrollTo = () => undefined;
}
Element.prototype.scrollTo = Element.prototype.scrollTo || (() => undefined);
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => undefined);

if (!('IntersectionObserver' in window)) {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: IntersectionObserverStub });
}

if (!('ResizeObserver' in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'ResizeObserver', { writable: true, value: ResizeObserverStub });
}

if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock';
  URL.revokeObjectURL = () => undefined;
}
