import { create } from 'zustand';
import type { Project, Assumption, ViewMode, Score } from '../types';
import {
  loadUserName,
  saveUserName,
  generateId,
} from '../utils/storage';
import {
  saveSession,
  deleteSession,
  saveAssumption as saveAssumptionToFirestore,
  deleteAssumption as deleteAssumptionFromFirestore,
} from '../utils/firestoreStorage';

interface AppState {
  // Data
  projects: Project[];
  assumptions: Assumption[];
  currentProjectId: string | null;
  userName: string | null;
  viewMode: ViewMode;
  isSessionLoading: boolean;
  sessionError: string | null;

  // UI State
  isProjectModalOpen: boolean;
  isAssumptionModalOpen: boolean;
  isScoreModalOpen: boolean;
  editingAssumption: Assumption | null;
  scoringAssumption: Assumption | null;

  // Actions
  loadData: () => void;
  setUserName: (name: string) => void;
  setSessionData: (data: { project?: Project; assumptions?: Assumption[] }) => void;
  setSessionError: (error: string | null) => void;

  // Project actions
  setCurrentProject: (projectId: string | null) => void;
  createProject: (
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  openProjectModal: () => void;
  closeProjectModal: () => void;

  // Assumption actions
  createAssumption: (
    assumption: Omit<Assumption, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>
  ) => Promise<void>;
  updateAssumption: (assumption: Assumption) => Promise<void>;
  deleteAssumption: (assumptionId: string) => Promise<void>;
  openAssumptionModal: (assumption?: Assumption) => void;
  closeAssumptionModal: () => void;

  // Score actions
  openScoreModal: (assumption: Assumption) => void;
  closeScoreModal: () => void;
  addScore: (
    assumptionId: string,
    score: Omit<Score, 'timestamp' | 'person'>
  ) => Promise<void>;

  // View actions
  setViewMode: (mode: ViewMode) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  projects: [],
  assumptions: [],
  currentProjectId: null,
  userName: null,
  viewMode: 'category',
  isSessionLoading: false,
  sessionError: null,
  isProjectModalOpen: false,
  isAssumptionModalOpen: false,
  isScoreModalOpen: false,
  editingAssumption: null,
  scoringAssumption: null,

  // Load user name from localStorage and reset session state on home-page init
  loadData: () => {
    const userName = loadUserName();
    set({ userName, currentProjectId: null, projects: [], assumptions: [], sessionError: null });
  },

  setUserName: (name: string) => {
    saveUserName(name);
    set({ userName: name });
  },

  // Called by useSessionSync to push Firestore data into the store
  setSessionData: ({ project, assumptions }) => {
    set((state) => {
      const updates: Partial<AppState> = { isSessionLoading: false };

      if (project !== undefined) {
        updates.sessionError = null;
        const existing = state.projects.find((p) => p.id === project.id);
        if (existing) {
          updates.projects = state.projects.map((p) =>
            p.id === project.id ? project : p
          );
        } else {
          updates.projects = [...state.projects, project];
        }
        updates.currentProjectId = project.id;
      }

      if (assumptions !== undefined) {
        const sessionId = project?.id ?? state.currentProjectId;
        if (sessionId) {
          // Replace all assumptions for this session; keep others
          const otherAssumptions = state.assumptions.filter(
            (a) => a.projectId !== sessionId
          );
          updates.assumptions = [...otherAssumptions, ...assumptions];
        }
      }

      return updates;
    });
  },

  setSessionError: (error: string | null) => set({ sessionError: error }),

  // Project actions
  setCurrentProject: (projectId: string | null) => {
    set({ currentProjectId: projectId });
  },

  createProject: (projectData) => {
    const project: Project = {
      ...projectData,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // Optimistic update — apply immediately so navigation can proceed
    set((state) => ({
      projects: [...state.projects, project],
      currentProjectId: project.id,
      viewMode: 'category',
    }));
    // Fire-and-forget: don't await — if Firestore is unreachable it queues
    // indefinitely and would block navigation before the promise resolves.
    // If it fails, surface the error so the creator knows invite links won't work.
    saveSession(project).catch((err: Error) => {
      console.error('Firestore session save failed:', err);
      set({ sessionError: 'Session could not sync to server — invite links may not work. (' + err.message + ')' });
    });
    return Promise.resolve(project.id);
  },

  updateProject: (project) => {
    const updatedProject = { ...project, updatedAt: Date.now() };
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p
      ),
    }));
    saveSession(updatedProject).catch(() => {});
    return Promise.resolve();
  },

  deleteProject: (projectId) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      assumptions: state.assumptions.filter((a) => a.projectId !== projectId),
      currentProjectId:
        state.currentProjectId === projectId ? null : state.currentProjectId,
    }));
    deleteSession(projectId).catch(() => {});
    return Promise.resolve();
  },

  openProjectModal: () => set({ isProjectModalOpen: true }),
  closeProjectModal: () => set({ isProjectModalOpen: false }),

  // Assumption actions
  createAssumption: (assumptionData) => {
    const userName = get().userName || 'Anonymous';
    const assumption: Assumption = {
      ...assumptionData,
      id: generateId(),
      updatedBy: userName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ assumptions: [...state.assumptions, assumption] }));
    const sessionId = get().currentProjectId;
    if (sessionId) {
      saveAssumptionToFirestore(sessionId, assumption).catch(() => {});
    }
    return Promise.resolve();
  },

  updateAssumption: (assumption) => {
    const userName = get().userName || 'Anonymous';
    const updatedAssumption: Assumption = {
      ...assumption,
      updatedBy: userName,
      updatedAt: Date.now(),
    };
    set((state) => ({
      assumptions: state.assumptions.map((a) =>
        a.id === updatedAssumption.id ? updatedAssumption : a
      ),
    }));
    const sessionId = get().currentProjectId;
    if (sessionId) {
      saveAssumptionToFirestore(sessionId, updatedAssumption).catch(() => {});
    }
    return Promise.resolve();
  },

  deleteAssumption: (assumptionId) => {
    const sessionId = get().currentProjectId;
    set((state) => ({
      assumptions: state.assumptions.filter((a) => a.id !== assumptionId),
    }));
    if (sessionId) {
      deleteAssumptionFromFirestore(sessionId, assumptionId).catch(() => {});
    }
    return Promise.resolve();
  },

  openAssumptionModal: (assumption) => {
    set({
      isAssumptionModalOpen: true,
      editingAssumption: assumption || null,
    });
  },

  closeAssumptionModal: () => {
    set({
      isAssumptionModalOpen: false,
      editingAssumption: null,
    });
  },

  // Score actions
  openScoreModal: (assumption) => {
    set({
      isScoreModalOpen: true,
      scoringAssumption: assumption,
    });
  },

  closeScoreModal: () => {
    set({
      isScoreModalOpen: false,
      scoringAssumption: null,
    });
  },

  addScore: (assumptionId, scoreData) => {
    const state = get();
    const assumption = state.assumptions.find((a) => a.id === assumptionId);
    if (!assumption) return Promise.resolve();

    const userName = state.userName || 'Anonymous';

    // Replace existing score from this user
    const filteredScores = assumption.scores.filter(
      (s) => s.person !== userName
    );
    const newScore: Score = {
      ...scoreData,
      person: userName,
      timestamp: Date.now(),
    };

    const updatedAssumption: Assumption = {
      ...assumption,
      scores: [...filteredScores, newScore],
      updatedBy: userName,
      updatedAt: Date.now(),
    };

    set((s) => ({
      assumptions: s.assumptions.map((a) =>
        a.id === assumptionId ? updatedAssumption : a
      ),
    }));

    const sessionId = state.currentProjectId;
    if (sessionId) {
      saveAssumptionToFirestore(sessionId, updatedAssumption).catch(() => {});
    }
    return Promise.resolve();
  },

  // View actions
  setViewMode: (mode) => set({ viewMode: mode }),
}));
