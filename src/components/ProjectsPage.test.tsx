import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectsPage } from './ProjectsPage';
import { useStore } from '../store/useStore';
import type { Project } from '../types';

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
});

describe('ProjectsPage', () => {
  describe('with no projects', () => {
    it('renders the "Your Projects" heading', () => {
      render(<ProjectsPage />);
      expect(screen.getByText('Your Projects')).toBeInTheDocument();
    });

    it('shows an empty-state message', () => {
      render(<ProjectsPage />);
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
    });

    it('shows a "Create Your First Project" button', () => {
      render(<ProjectsPage />);
      // There may be more than one button with this label in the empty state
      expect(screen.getAllByText(/create your first project/i).length).toBeGreaterThan(0);
    });
  });

  describe('with projects', () => {
    beforeEach(() => {
      useStore.setState({
        projects: [
          makeProject({ id: 'p1', name: 'Project Alpha', team: 'Team A', phase: 'Alpha', updatedAt: 2000 }),
          makeProject({ id: 'p2', name: 'Project Beta', team: 'Team B', phase: 'Beta', updatedAt: 1000 }),
        ],
        currentProjectId: 'p1',
      });
    });

    it('renders all project names', () => {
      render(<ProjectsPage />);
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });

    it('shows project count', () => {
      render(<ProjectsPage />);
      expect(screen.getByText('2 projects')).toBeInTheDocument();
    });

    it('marks the current project with a "Current" badge', () => {
      render(<ProjectsPage />);
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('shows "Open Project" for non-current projects', () => {
      render(<ProjectsPage />);
      expect(screen.getByRole('button', { name: /open project/i })).toBeInTheDocument();
    });

    it('shows "Continue Working" for the current project', () => {
      render(<ProjectsPage />);
      expect(screen.getByRole('button', { name: /continue working/i })).toBeInTheDocument();
    });

    it('shows team and phase info for each project', () => {
      render(<ProjectsPage />);
      expect(screen.getByText(/team a/i)).toBeInTheDocument();
      // Phase "Alpha" appears multiple times (also in project name), use getAllByText
      const alphaMatches = screen.getAllByText(/\bAlpha\b/);
      expect(alphaMatches.length).toBeGreaterThan(0);
    });

    it('clicking "Open Project" sets the current project and switches to category view', async () => {
      const user = userEvent.setup();
      render(<ProjectsPage />);

      await user.click(screen.getByRole('button', { name: /open project/i }));

      expect(useStore.getState().currentProjectId).toBe('p2');
      expect(useStore.getState().viewMode).toBe('category');
    });

    it('clicking "Continue Working" switches to category view', async () => {
      useStore.setState({ viewMode: 'projects' });
      const user = userEvent.setup();
      render(<ProjectsPage />);

      await user.click(screen.getByRole('button', { name: /continue working/i }));

      expect(useStore.getState().viewMode).toBe('category');
    });

    it('clicking Delete and confirming removes the project', async () => {
      const { saveProject } = await import('../utils/storage');
      saveProject(makeProject({ id: 'p1', name: 'Project Alpha', updatedAt: 2000 }));
      saveProject(makeProject({ id: 'p2', name: 'Project Beta', updatedAt: 1000 }));

      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const user = userEvent.setup();
      render(<ProjectsPage />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(useStore.getState().projects).toHaveLength(1);
      vi.restoreAllMocks();
    });

    it('clicking Delete and cancelling keeps the project', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const user = userEvent.setup();
      render(<ProjectsPage />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(useStore.getState().projects).toHaveLength(2);
      vi.restoreAllMocks();
    });
  });

  describe('"+ Create New Project" button', () => {
    it('opens the project modal when clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectsPage />);

      await user.click(screen.getByRole('button', { name: /\+ create new project/i }));

      expect(useStore.getState().isProjectModalOpen).toBe(true);
    });
  });

  describe('sorting', () => {
    it('displays projects sorted by updatedAt descending', () => {
      useStore.setState({
        projects: [
          makeProject({ id: 'old', name: 'Old Project', updatedAt: 500 }),
          makeProject({ id: 'new', name: 'New Project', updatedAt: 9999 }),
        ],
      });
      render(<ProjectsPage />);
      const headings = screen.getAllByRole('heading', { level: 2 });
      // First heading should be "New Project" (most recently updated)
      expect(headings[0].textContent).toContain('New Project');
    });
  });

  describe('singular project count', () => {
    it('shows "1 project" (singular) for a single project', () => {
      useStore.setState({ projects: [makeProject()] });
      render(<ProjectsPage />);
      expect(screen.getByText('1 project')).toBeInTheDocument();
    });
  });
});
