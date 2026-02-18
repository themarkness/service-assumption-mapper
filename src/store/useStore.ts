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

  // Project actions
  setCurrentProject: (projectId: string) => void;
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
  isProjectModalOpen: false,
  isAssumptionModalOpen: false,
  isScoreModalOpen: false,
  editingAssumption: null,
  scoringAssumption: null,

  // Load only user name from localStorage on app init
  loadData: () => {
    const userName = loadUserName();
    set({ userName });
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

  // Project actions
  setCurrentProject: (projectId: string) => {
    set({ currentProjectId: projectId });
  },

  createProject: async (projectData) => {
    const project: Project = {
      ...projectData,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // Optimistic update
    set((state) => ({
      projects: [...state.projects, project],
      currentProjectId: project.id,
      viewMode: 'category',
    }));
    try {
      await saveSession(project);
    } catch {
      // Firestore write failed; in-memory state is already updated
    }
    return project.id;
  },

  updateProject: async (project) => {
    const updatedProject = { ...project, updatedAt: Date.now() };
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === updatedProject.id ? updatedProject : p
      ),
    }));
    try {
      await saveSession(updatedProject);
    } catch {
      // Firestore write failed; in-memory state is already updated
    }
  },

  deleteProject: async (projectId) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      assumptions: state.assumptions.filter((a) => a.projectId !== projectId),
      currentProjectId:
        state.currentProjectId === projectId ? null : state.currentProjectId,
    }));
    try {
      await deleteSession(projectId);
    } catch {
      // Firestore write failed; in-memory state is already updated
    }
  },

  openProjectModal: () => set({ isProjectModalOpen: true }),
  closeProjectModal: () => set({ isProjectModalOpen: false }),

  // Assumption actions
  createAssumption: async (assumptionData) => {
    const userName = get().userName || 'Anonymous';
    const assumption: Assumption = {
      ...assumptionData,
      id: generateId(),
      updatedBy: userName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // Optimistic update
    set((state) => ({ assumptions: [...state.assumptions, assumption] }));

    const sessionId = get().currentProjectId;
    if (sessionId) {
      try {
        await saveAssumptionToFirestore(sessionId, assumption);
      } catch {
        // Firestore write failed; in-memory state is already updated
      }
    }
  },

  updateAssumption: async (assumption) => {
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
      try {
        await saveAssumptionToFirestore(sessionId, updatedAssumption);
      } catch {
        // Firestore write failed; in-memory state is already updated
      }
    }
  },

  deleteAssumption: async (assumptionId) => {
    const sessionId = get().currentProjectId;
    set((state) => ({
      assumptions: state.assumptions.filter((a) => a.id !== assumptionId),
    }));
    if (sessionId) {
      try {
        await deleteAssumptionFromFirestore(sessionId, assumptionId);
      } catch {
        // Firestore write failed; in-memory state is already updated
      }
    }
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

  addScore: async (assumptionId, scoreData) => {
    const state = get();
    const assumption = state.assumptions.find((a) => a.id === assumptionId);
    if (!assumption) return;

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
      try {
        await saveAssumptionToFirestore(sessionId, updatedAssumption);
      } catch {
        // Firestore write failed; in-memory state is already updated
      }
    }
  },

  // View actions
  setViewMode: (mode) => set({ viewMode: mode }),
}));
