import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { trackToolUsage } from '../utils/toolUsage';
import { useAnalytics } from '../hooks/useAnalytics';

interface UseToolResult<T> {
  isLoading: boolean;
  error: Error | null;
  processInput: (input: any) => Promise<T>;
}

export const useTool = <T,>(
  toolId: string,
  toolName: string,
  processFunction: (input: any) => Promise<T>
): UseToolResult<T> => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  const processInput = useCallback(async (input: any) => {
    setIsLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      // Process the input
      const result = await processFunction(input);

      // Track usage in Firestore and Analytics
      if (user) {
        await trackToolUsage(
          user,
          toolId,
          toolName,
          JSON.stringify(input),
          JSON.stringify(result),
          Date.now() - startTime
        );

        trackEvent('tool_used', {
          toolId,
          toolName,
          duration: Date.now() - startTime
        });
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, toolId, toolName, processFunction, trackEvent]);

  return { isLoading, error, processInput };
};
