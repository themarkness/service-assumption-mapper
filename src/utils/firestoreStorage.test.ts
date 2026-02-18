import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Project, Assumption } from '../types';

// Mock the Firebase db instance
vi.mock('../utils/firebase', () => ({
  db: {},
}));

const mockSetDoc = vi.fn().mockResolvedValue(undefined);
const mockDeleteDoc = vi.fn().mockResolvedValue(undefined);
const mockGetDocs = vi.fn().mockResolvedValue({ docs: [] });
const mockGetDoc = vi.fn().mockResolvedValue({ exists: () => false, data: () => null });
const mockDoc = vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') }));
const mockCollection = vi.fn((_db: unknown, ...segments: string[]) => ({
  path: segments.join('/'),
}));

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  collection: mockCollection,
  setDoc: mockSetDoc,
  getDoc: mockGetDoc,
  deleteDoc: mockDeleteDoc,
  getDocs: mockGetDocs,
}));

// Import after mocks are in place
const { saveSession, getSession, deleteSession, saveAssumption, deleteAssumption, getAssumptions } =
  await import('./firestoreStorage');

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'session-1',
    name: 'Test Session',
    team: 'Alpha Team',
    phase: 'Discovery',
    date: '2024-01-01',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeAssumption(overrides: Partial<Assumption> = {}): Assumption {
  return {
    id: 'a1',
    projectId: 'session-1',
    text: 'Test assumption',
    category: 'users',
    scores: [],
    createdBy: 'Alice',
    updatedBy: 'Alice',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetDoc.mockResolvedValue({ exists: () => false, data: () => null });
  mockGetDocs.mockResolvedValue({ docs: [] });
  mockSetDoc.mockResolvedValue(undefined);
  mockDeleteDoc.mockResolvedValue(undefined);
});

describe('saveSession', () => {
  it('calls setDoc with the session data', async () => {
    const session = makeProject();
    await saveSession(session);
    expect(mockSetDoc).toHaveBeenCalledOnce();
  });
});

describe('getSession', () => {
  it('returns null when the session does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => null });
    const result = await getSession('nonexistent');
    expect(result).toBeNull();
  });

  it('returns the session data when it exists', async () => {
    const session = makeProject();
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => session });
    const result = await getSession('session-1');
    expect(result).toEqual(session);
  });
});

describe('deleteSession', () => {
  it('deletes all assumptions and then the session doc', async () => {
    const mockAssumptionRef = { id: 'a1' };
    mockGetDocs.mockResolvedValue({ docs: [{ ref: mockAssumptionRef }] });

    await deleteSession('session-1');

    // deleteDoc called for the assumption + the session doc
    expect(mockDeleteDoc).toHaveBeenCalledTimes(2);
  });
});

describe('saveAssumption', () => {
  it('calls setDoc with the assumption data', async () => {
    const assumption = makeAssumption();
    await saveAssumption('session-1', assumption);
    expect(mockSetDoc).toHaveBeenCalledOnce();
  });
});

describe('deleteAssumption', () => {
  it('calls deleteDoc for the assumption', async () => {
    await deleteAssumption('session-1', 'a1');
    expect(mockDeleteDoc).toHaveBeenCalledOnce();
  });
});

describe('getAssumptions', () => {
  it('returns an empty array when there are no assumptions', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    const result = await getAssumptions('session-1');
    expect(result).toEqual([]);
  });

  it('returns assumption data from the snapshot', async () => {
    const assumption = makeAssumption();
    mockGetDocs.mockResolvedValue({
      docs: [{ data: () => assumption }],
    });
    const result = await getAssumptions('session-1');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(assumption);
  });
});
