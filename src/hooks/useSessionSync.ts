import { useEffect } from 'react';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useStore } from '../store/useStore';
import { saveCurrentSession } from '../utils/storage';
import { saveSession } from '../utils/firestoreStorage';
import type { Project, Assumption } from '../types';

/**
 * Subscribes to Firestore real-time updates for a session and its assumptions.
 * Updates the Zustand store whenever data changes in Firestore.
 */
export function useSessionSync(sessionId: string | undefined): void {
  const setSessionData = useStore((state) => state.setSessionData);
  const setSessionError = useStore((state) => state.setSessionError);

  useEffect(() => {
    if (!sessionId) return;

    // Persist session ID locally so the user can return after refresh
    saveCurrentSession(sessionId);

    // One-shot recovery flag — avoid retrying indefinitely if the save keeps failing
    let recoveryAttempted = false;

    // Listen to the session document
    const sessionUnsub = onSnapshot(
      doc(db, 'sessions', sessionId),
      (snap) => {
        if (snap.exists()) {
          setSessionData({ project: snap.data() as Project });
        } else if (!recoveryAttempted) {
          recoveryAttempted = true;
          // Document missing — if we're the creator with local state, try to re-save
          // (the initial fire-and-forget save may have failed silently)
          const localProject = useStore
            .getState()
            .projects.find((p) => p.id === sessionId);
          if (localProject) {
            saveSession(localProject).catch((err: Error) => {
              console.error('Session re-save failed:', err);
              setSessionError('Session sync failed: ' + err.message);
            });
          }
        }
      },
      (error) => {
        // Firestore permission or network error — surface immediately
        console.error('Session load error:', error);
        setSessionError('Could not load session: ' + error.message);
      }
    );

    // Listen to the assumptions subcollection
    const assumptionsUnsub = onSnapshot(
      collection(db, 'sessions', sessionId, 'assumptions'),
      (snap) => {
        const assumptions = snap.docs.map((d) => d.data() as Assumption);
        setSessionData({ assumptions });
      },
      (error) => {
        console.error('Assumptions load error:', error);
      }
    );

    return () => {
      sessionUnsub();
      assumptionsUnsub();
    };
  }, [sessionId, setSessionData, setSessionError]);
}
