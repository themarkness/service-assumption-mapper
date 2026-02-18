import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionSync } from './useSessionSync';
import { useStore } from '../store/useStore';

// Mock Firestore so tests don't need a real Firebase project.
// Note: vi.mock factories are hoisted, so we cannot reference variables declared
// below — use inline vi.fn() calls and capture references via mockImplementation.
vi.mock('../utils/firebase', () => ({
  db: {},
}));

const unsubscribeMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
  collection: vi.fn((_db: unknown, ...segments: string[]) => ({
    path: segments.join('/'),
  })),
  onSnapshot: vi.fn(() => unsubscribeMock),
}));

// Re-import after mocks are established to capture the mocked onSnapshot
import { onSnapshot } from 'firebase/firestore';

function resetStore() {
  useStore.setState({
    projects: [],
    assumptions: [],
    currentProjectId: null,
    userName: null,
    viewMode: 'category',
    isSessionLoading: false,
    isProjectModalOpen: false,
    isAssumptionModalOpen: false,
    isScoreModalOpen: false,
    editingAssumption: null,
    scoringAssumption: null,
  });
}

beforeEach(() => {
  resetStore();
  vi.clearAllMocks();
  vi.mocked(onSnapshot).mockReturnValue(unsubscribeMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSessionSync', () => {
  it('does not call onSnapshot when sessionId is undefined', () => {
    renderHook(() => useSessionSync(undefined));
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('subscribes to session doc and assumptions when sessionId is provided', () => {
    renderHook(() => useSessionSync('session-1'));
    // Two onSnapshot calls: one for the session doc, one for the assumptions collection
    expect(onSnapshot).toHaveBeenCalledTimes(2);
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useSessionSync('session-1'));
    unmount();
    // Both listeners should be cleaned up
    expect(unsubscribeMock).toHaveBeenCalledTimes(2);
  });

  it('re-subscribes when sessionId changes', () => {
    const { rerender } = renderHook(
      ({ sessionId }: { sessionId: string }) => useSessionSync(sessionId),
      { initialProps: { sessionId: 'session-1' } }
    );

    expect(onSnapshot).toHaveBeenCalledTimes(2);

    rerender({ sessionId: 'session-2' });

    // Previous listeners unsubscribed + new ones created
    expect(onSnapshot).toHaveBeenCalledTimes(4);
  });

  it('saves session ID to localStorage via saveCurrentSession', () => {
    renderHook(() => useSessionSync('session-abc'));
    expect(localStorage.getItem('rat_current_session')).toBe('session-abc');
  });
});
