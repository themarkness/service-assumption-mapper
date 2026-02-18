import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { useStore } from './store/useStore';
import type { Project } from './types';

// Mock useSessionSync so it does not attempt Firestore connections in tests
vi.mock('./hooks/useSessionSync', () => ({
  useSessionSync: vi.fn(),
}));

// Mock Firestore storage so store actions resolve cleanly in tests
vi.mock('./utils/firestoreStorage', () => ({
  saveSession: vi.fn().mockResolvedValue(undefined),
  getSession: vi.fn().mockResolvedValue(null),
  deleteSession: vi.fn().mockResolvedValue(undefined),
  saveAssumption: vi.fn().mockResolvedValue(undefined),
  deleteAssumption: vi.fn().mockResolvedValue(undefined),
  getAssumptions: vi.fn().mockResolvedValue([]),
}));

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test-session',
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
    isSessionLoading: false,
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
  // Reset to home route before each test
  window.location.hash = '';
});

describe('App routing', () => {
  it('shows WelcomeScreen at the home route', () => {
    render(<App />);
    expect(
      screen.getByText('Government Service Assumptions Mapping Tool')
    ).toBeInTheDocument();
  });

  it('renders the ProjectModal when isProjectModalOpen is true at home route', () => {
    useStore.setState({ isProjectModalOpen: true });
    render(<App />);
    expect(screen.getByText('Create New Session')).toBeInTheDocument();
  });

  it('shows JoinSessionPage at a session route when no user name is set', () => {
    window.location.hash = '#/session/abc123';
    render(<App />);
    expect(screen.getByText(/join session/i)).toBeInTheDocument();
  });

  it('shows loading state at session route when userName is set but session not yet loaded', () => {
    window.location.hash = '#/session/abc123';
    resetStore({ userName: 'Alice' });
    render(<App />);
    expect(screen.getByText(/loading session/i)).toBeInTheDocument();
  });

  it('shows TopNav with project name when session route is active and project is loaded', () => {
    const project = makeProject({ id: 'abc123' });
    window.location.hash = '#/session/abc123';
    resetStore({
      userName: 'Alice',
      projects: [project],
      currentProjectId: project.id,
      viewMode: 'category',
    });
    render(<App />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders CategoryView column headings when session view is active', () => {
    const project = makeProject({ id: 'abc123' });
    window.location.hash = '#/session/abc123';
    resetStore({
      userName: 'Alice',
      projects: [project],
      currentProjectId: project.id,
      viewMode: 'category',
    });
    render(<App />);
    expect(screen.getByText('Service')).toBeInTheDocument();
  });
});
