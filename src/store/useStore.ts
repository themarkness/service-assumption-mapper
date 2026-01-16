import { create } from 'zustand';
import type { Project, Assumption, ViewMode, Score } from '../types';
import {
  loadProjects,
  loadAssumptions,
  saveProject as saveProjectToStorage,
  saveAssumption as saveAssumptionToStorage,
  deleteProject as deleteProjectFromStorage,
  deleteAssumption as deleteAssumptionFromStorage,
  getCurrentProjectId,
  setCurrentProject,
  loadUserName,
  saveUserName,
  generateId,
} from '../utils/storage';

interface AppState {
  // Data
  projects: Project[];
  assumptions: Assumption[];
  currentProjectId: string | null;
  userName: string | null;
  viewMode: ViewMode;

  // UI State
  isProjectModalOpen: boolean;
  isAssumptionModalOpen: boolean;
  isScoreModalOpen: boolean;
  editingAssumption: Assumption | null;
  scoringAssumption: Assumption | null;

  // Actions
  loadData: () => void;
  setUserName: (name: string) => void;

  // Project actions
  setCurrentProject: (projectId: string) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  openProjectModal: () => void;
  closeProjectModal: () => void;

  // Assumption actions
  createAssumption: (assumption: Omit<Assumption, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAssumption: (assumption: Assumption) => void;
  deleteAssumption: (assumptionId: string) => void;
  openAssumptionModal: (assumption?: Assumption) => void;
  closeAssumptionModal: () => void;

  // Score actions
  openScoreModal: (assumption: Assumption) => void;
  closeScoreModal: () => void;
  addScore: (assumptionId: string, score: Omit<Score, 'timestamp' | 'person'>) => void;

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
  isProjectModalOpen: false,
  isAssumptionModalOpen: false,
  isScoreModalOpen: false,
  editingAssumption: null,
  scoringAssumption: null,

  // Load data from localStorage
  loadData: () => {
    const projects = loadProjects();
    const assumptions = loadAssumptions();
    const currentProjectId = getCurrentProjectId();
    const userName = loadUserName();

    set({
      projects,
      assumptions,
      currentProjectId,
      userName,
    });
  },

  setUserName: (name: string) => {
    saveUserName(name);
    set({ userName: name });
  },

  // Project actions
  setCurrentProject: (projectId: string) => {
    setCurrentProject(projectId);
    set({ currentProjectId: projectId });
  },

  createProject: (projectData) => {
    const project: Project = {
      ...projectData,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveProjectToStorage(project);
    const projects = loadProjects();
    set({ projects, currentProjectId: project.id, viewMode: 'category' });
    setCurrentProject(project.id);
  },

  updateProject: (project) => {
    const updatedProject = {
      ...project,
      updatedAt: Date.now(),
    };
    saveProjectToStorage(updatedProject);
    const projects = loadProjects();
    set({ projects });
  },

  deleteProject: (projectId) => {
    deleteProjectFromStorage(projectId);
    const projects = loadProjects();
    const assumptions = loadAssumptions();
    set({
      projects,
      assumptions,
      currentProjectId: projects.length > 0 ? projects[0].id : null,
    });
  },

  openProjectModal: () => set({ isProjectModalOpen: true }),
  closeProjectModal: () => set({ isProjectModalOpen: false }),

  // Assumption actions
  createAssumption: (assumptionData) => {
    const assumption: Assumption = {
      ...assumptionData,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveAssumptionToStorage(assumption);
    const assumptions = loadAssumptions();
    set({ assumptions });
  },

  updateAssumption: (assumption) => {
    const updatedAssumption = {
      ...assumption,
      updatedAt: Date.now(),
    };
    saveAssumptionToStorage(updatedAssumption);
    const assumptions = loadAssumptions();
    set({ assumptions });
  },

  deleteAssumption: (assumptionId) => {
    deleteAssumptionFromStorage(assumptionId);
    const assumptions = loadAssumptions();
    set({ assumptions });
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
    const assumptions = get().assumptions;
    const assumption = assumptions.find((a) => a.id === assumptionId);
    if (!assumption) return;

    const userName = get().userName || 'Anonymous';

    // Remove existing score from this user if exists
    const filteredScores = assumption.scores.filter((s) => s.person !== userName);

    const newScore: Score = {
      ...scoreData,
      person: userName,
      timestamp: Date.now(),
    };

    const updatedAssumption = {
      ...assumption,
      scores: [...filteredScores, newScore],
      updatedAt: Date.now(),
    };

    saveAssumptionToStorage(updatedAssumption);
    const newAssumptions = loadAssumptions();
    set({ assumptions: newAssumptions });
  },

  // View actions
  setViewMode: (mode) => set({ viewMode: mode }),
}));
