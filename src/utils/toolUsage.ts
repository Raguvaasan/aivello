import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp, Timestamp, type FieldValue } from 'firebase/firestore';
import { db } from '../config/firebase';
import { logger } from './logger';

/**
 * What the user did with a tool. Kept to a small fixed set so the Firestore rules can
 * validate it and the History page can label it.
 */
export type ToolAction = 'use' | 'generate' | 'convert' | 'analyze' | 'download' | 'copy';

export const TOOL_ACTIONS: readonly ToolAction[] = ['use', 'generate', 'convert', 'analyze', 'download', 'copy'];

/**
 * A single usage record in the `toolUsage` collection.
 *
 * Deliberately metadata-only. Earlier versions stored the raw tool input and output,
 * which meant generated passwords, resumes, dream journals and personality answers
 * were written to the database. Nothing needs that content, so it is no longer kept.
 */
export interface ToolUsageRecord {
  userId: string;
  toolId: string;
  toolName: string;
  action: ToolAction;
  timestamp: Timestamp;
  durationMs?: number;
}

/** Shape written by the client; the server fills in the timestamp (checked in firestore.rules). */
type ToolUsageWrite = Omit<ToolUsageRecord, 'timestamp'> & { timestamp: FieldValue };

export interface ToolUsageEntry extends Omit<ToolUsageRecord, 'timestamp'> {
  id: string;
  timestamp: Date;
}

export const trackToolUsage = async (
  userId: string,
  toolId: string,
  toolName: string,
  action: ToolAction = 'use',
  durationMs?: number
): Promise<void> => {
  try {
    const record: ToolUsageWrite = {
      userId,
      toolId: toolId.slice(0, 64),
      toolName: toolName.slice(0, 80),
      action,
      timestamp: serverTimestamp(),
      ...(typeof durationMs === 'number' && Number.isFinite(durationMs)
        ? { durationMs: Math.max(0, Math.round(durationMs)) }
        : {}),
    };

    await addDoc(collection(db, 'toolUsage'), record);
  } catch (error) {
    // Non-critical: usage tracking failure shouldn't break the tool
    logger.error('Failed to track tool usage', error);
  }
};

export const getUserToolHistory = async (userId: string, maxResults = 50): Promise<ToolUsageEntry[]> => {
  try {
    const q = query(
      collection(db, 'toolUsage'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data() as Partial<ToolUsageRecord>;
      return {
        id: doc.id,
        userId: data.userId ?? userId,
        toolId: data.toolId ?? 'unknown',
        toolName: data.toolName ?? 'Unknown tool',
        action: data.action ?? 'use',
        durationMs: data.durationMs,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(0),
      };
    });
  } catch (error) {
    // Most likely cause of a failure here is a missing composite index
    // (userId + timestamp desc) - see firestore.indexes.json.
    logger.error('Failed to load tool history', error);
    throw error;
  }
};
