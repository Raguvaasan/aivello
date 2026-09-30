import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAnalyticsContext } from '../context/AnalyticsProvider';
import type { ToolAction } from '../utils/toolUsage';

/**
 * Records that the visitor actually used a tool (not merely opened it).
 *
 * Call the returned function once per completed action - a summary generated, a file
 * converted, a palette copied. Signed-in users get a Firestore `toolUsage` record that
 * powers the History page; everyone gets an anonymous analytics event.
 *
 * It never stores tool input or output, and it never throws: tracking must not be able
 * to break the tool it is attached to.
 *
 * @example
 *   const track = useToolTracking('word-counter', 'Word Counter');
 *   const onCopy = () => { navigator.clipboard.writeText(text); track('copy'); };
 */
export const useToolTracking = (toolId: string, toolName: string) => {
  const { user } = useAuth();
  const { trackEvent } = useAnalyticsContext();

  return useCallback(
    (action: ToolAction = 'use', durationMs?: number) => {
      trackEvent('tool_used', { tool_id: toolId, tool_name: toolName, action });
      if (user) {
        // Loaded on demand: toolUsage pulls in the Firestore SDK, which anonymous
        // visitors never need.
        void import('../utils/toolUsage')
          .then(({ trackToolUsage }) => trackToolUsage(user.uid, toolId, toolName, action, durationMs))
          .catch(() => undefined);
      }
    },
    [user, toolId, toolName, trackEvent]
  );
};

export type TrackToolUsage = ReturnType<typeof useToolTracking>;
