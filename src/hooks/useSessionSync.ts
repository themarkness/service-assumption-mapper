import { useEffect } from 'react';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useStore } from '../store/useStore';
import { saveCurrentSession } from '../utils/storage';
import type { Project, Assumption } from '../types';

/**
 * Subscribes to Firestore real-time updates for a session and its assumptions.
 * Updates the Zustand store whenever data changes in Firestore.
 */
export function useSessionSync(sessionId: string | undefined): void {
  const setSessionData = useStore((state) => state.setSessionData);

  useEffect(() => {
    if (!sessionId) return;

    // Persist session ID locally so the user can return after refresh
    saveCurrentSession(sessionId);

    // Listen to the session document
    const sessionUnsub = onSnapshot(
      doc(db, 'sessions', sessionId),
      (snap) => {
        if (snap.exists()) {
          setSessionData({ project: snap.data() as Project });
        }
      }
    );

    // Listen to the assumptions subcollection
    const assumptionsUnsub = onSnapshot(
      collection(db, 'sessions', sessionId, 'assumptions'),
      (snap) => {
        const assumptions = snap.docs.map((d) => d.data() as Assumption);
        setSessionData({ assumptions });
      }
    );

    return () => {
      sessionUnsub();
      assumptionsUnsub();
    };
  }, [sessionId, setSessionData]);
}
