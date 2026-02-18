import type { Project, Assumption } from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'rat_projects',
  ASSUMPTIONS: 'rat_assumptions',
  CURRENT_PROJECT: 'rat_current_project',
  CURRENT_SESSION: 'rat_current_session',
  USER_NAME: 'rat_user_name',
};

// Projects
export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

export function loadProjects(): Project[] {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  return data ? JSON.parse(data) : [];
}

export function saveProject(project: Project): void {
  const projects = loadProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  saveProjects(projects);
}

export function deleteProject(projectId: string): void {
  const projects = loadProjects();
  saveProjects(projects.filter((p) => p.id !== projectId));
  // Also delete all assumptions for this project
  const assumptions = loadAssumptions();
  saveAssumptions(assumptions.filter((a) => a.projectId !== projectId));
}

// Assumptions
export function saveAssumptions(assumptions: Assumption[]): void {
  localStorage.setItem(STORAGE_KEYS.ASSUMPTIONS, JSON.stringify(assumptions));
}

export function loadAssumptions(): Assumption[] {
  const data = localStorage.getItem(STORAGE_KEYS.ASSUMPTIONS);
  return data ? JSON.parse(data) : [];
}

export function loadAssumptionsForProject(projectId: string): Assumption[] {
  return loadAssumptions().filter((a) => a.projectId === projectId);
}

export function saveAssumption(assumption: Assumption): void {
  const assumptions = loadAssumptions();
  const index = assumptions.findIndex((a) => a.id === assumption.id);
  if (index >= 0) {
    assumptions[index] = assumption;
  } else {
    assumptions.push(assumption);
  }
  saveAssumptions(assumptions);
}

export function deleteAssumption(assumptionId: string): void {
  const assumptions = loadAssumptions();
  saveAssumptions(assumptions.filter((a) => a.id !== assumptionId));
}

// Current Project
export function setCurrentProject(projectId: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, projectId);
}

export function getCurrentProjectId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT);
}

// User Name
export function saveUserName(name: string): void {
  localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
}

export function loadUserName(): string | null {
  return localStorage.getItem(STORAGE_KEYS.USER_NAME);
}

// Current Session (for Firestore-backed sessions)
export function saveCurrentSession(sessionId: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
}

export function loadCurrentSession(): string | null {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
}

// Utility to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
