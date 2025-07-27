import { useState, useCallback } from 'react';

interface UseLoadingState {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
}

export const useLoadingState = (initialState = false): UseLoadingState => {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(async <T,>(promise: Promise<T>): Promise<T> => {
    try {
      startLoading();
      const result = await promise;
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
};
