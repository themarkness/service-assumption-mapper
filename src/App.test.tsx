import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { useStore } from './store/useStore';
import {
  saveProject,
  setCurrentProject as setCurrentProjectStorage,
} from './utils/storage';
import type { Project } from './types';

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    name: 'Test Project',
    team: 'Alpha Team',
    phase: 'Discovery',
    date: '2024-01-01',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function resetStore(overrides = {}) {
  useStore.setState({
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
    ...overrides,
  });
}

beforeEach(() => {
  resetStore();
  // localStorage is cleared by the global setup
});

/**
 * App calls loadData() on mount, which reads from localStorage.
 * So we seed both localStorage AND the store to keep them in sync.
 */
function seedProject(project: Project, viewMode: 'category' | 'grid' | 'projects' = 'category') {
  // Seed localStorage so loadData() reads correct data
  saveProject(project);
  setCurrentProjectStorage(project.id);
  // Seed store so first render shows correct state before effect runs
  useStore.setState({ projects: [project], currentProjectId: project.id, viewMode });
}

describe('App routing', () => {
  it('shows WelcomeScreen when no projects exist', () => {
    // Nothing in localStorage → loadData will return empty arrays
    render(<App />);
    expect(
      screen.getByText('Government Service Assumptions Mapping Tool')
    ).toBeInTheDocument();
  });

  it('shows ProjectsPage when viewMode is "projects"', () => {
    const project = makeProject();
    seedProject(project, 'projects');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Your Projects' })).toBeInTheDocument();
  });

  it('shows ProjectsPage when projects exist but no current project is selected', () => {
    const project = makeProject();
    saveProject(project);
    // No current project set in storage
    useStore.setState({ projects: [project], currentProjectId: null, viewMode: 'category' });
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Your Projects' })).toBeInTheDocument();
  });

  it('shows TopNav with project name when a current project is selected', () => {
    const project = makeProject({ name: 'My RAT Project' });
    seedProject(project, 'category');
    render(<App />);
    // TopNav renders the project name as a clickable heading
    expect(screen.getByText('My RAT Project')).toBeInTheDocument();
  });

  it('renders CategoryView in category viewMode (shows category column headings)', () => {
    const project = makeProject();
    seedProject(project, 'category');
    render(<App />);
    // CategoryView renders column headings for each assumption category
    expect(screen.getByText('Service')).toBeInTheDocument();
  });

  it('renders the ProjectModal when isProjectModalOpen is true on WelcomeScreen', () => {
    useStore.setState({ projects: [], isProjectModalOpen: true });
    render(<App />);
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
  });
});
