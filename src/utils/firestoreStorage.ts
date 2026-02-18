import {
  doc,
  collection,
  setDoc,
  getDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Project, Assumption } from '../types';

// Sessions (≡ Projects) — top-level collection
export async function saveSession(session: Project): Promise<void> {
  await setDoc(doc(db, 'sessions', session.id), session);
}

export async function getSession(sessionId: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, 'sessions', sessionId));
  return snap.exists() ? (snap.data() as Project) : null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  // Delete all assumptions first
  const assumptionsSnap = await getDocs(
    collection(db, 'sessions', sessionId, 'assumptions')
  );
  await Promise.all(assumptionsSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'sessions', sessionId));
}

// Assumptions — subcollection of a session
export async function saveAssumption(
  sessionId: string,
  assumption: Assumption
): Promise<void> {
  await setDoc(
    doc(db, 'sessions', sessionId, 'assumptions', assumption.id),
    assumption
  );
}

export async function deleteAssumption(
  sessionId: string,
  assumptionId: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'sessions', sessionId, 'assumptions', assumptionId)
  );
}

export async function getAssumptions(sessionId: string): Promise<Assumption[]> {
  const snap = await getDocs(
    collection(db, 'sessions', sessionId, 'assumptions')
  );
  return snap.docs.map((d) => d.data() as Assumption);
}
