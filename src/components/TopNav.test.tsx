import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TopNav } from './TopNav';
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

afterEach(() => {
  vi.restoreAllMocks();
});

function renderTopNav() {
  return render(
    <MemoryRouter>
      <TopNav />
    </MemoryRouter>
  );
}

describe('TopNav', () => {
  it('renders nothing when there is no current project', () => {
    const { container } = renderTopNav();
    expect(container.firstChild).toBeNull();
  });

  it('renders when a current project is set', () => {
    const project = makeProject();
    useStore.setState({ projects: [project], currentProjectId: project.id });
    renderTopNav();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('shows the project team and phase', () => {
    const project = makeProject({ team: 'GDS Team', phase: 'Beta' });
    useStore.setState({ projects: [project], currentProjectId: project.id });
    renderTopNav();
    expect(screen.getByText(/gds team/i)).toBeInTheDocument();
    expect(screen.getByText(/beta/i)).toBeInTheDocument();
  });

  it('shows Category View and Grid View toggle buttons', () => {
    const project = makeProject();
    useStore.setState({ projects: [project], currentProjectId: project.id });
    renderTopNav();
    expect(screen.getByRole('button', { name: /category view/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /grid view/i })).toBeInTheDocument();
  });

  it('clicking "Grid View" switches to grid mode', async () => {
    const project = makeProject();
    useStore.setState({ projects: [project], currentProjectId: project.id, viewMode: 'category' });
    const user = userEvent.setup();
    renderTopNav();

    await user.click(screen.getByRole('button', { name: /grid view/i }));

    expect(useStore.getState().viewMode).toBe('grid');
  });

  it('clicking "Category View" switches to category mode', async () => {
    const project = makeProject();
    useStore.setState({ projects: [project], currentProjectId: project.id, viewMode: 'grid' });
    const user = userEvent.setup();
    renderTopNav();

    await user.click(screen.getByRole('button', { name: /category view/i }));

    expect(useStore.getState().viewMode).toBe('category');
  });

  it('shows "← Home" navigation button', () => {
    const project = makeProject();
    useStore.setState({ projects: [project], currentProjectId: project.id });
    renderTopNav();
    expect(screen.getByRole('button', { name: /← home/i })).toBeInTheDocument();
  });

  it('clicking "← Home" can be clicked without error', async () => {
    const project = makeProject();
    useStore.setState({ projects: [project], currentProjectId: project.id });
    const user = userEvent.setup();
    renderTopNav();

    await expect(
      user.click(screen.getByRole('button', { name: /← home/i }))
    ).resolves.not.toThrow();
  });

  it('clicking "Add Assumption" opens the assumption modal', async () => {
    const project = makeProject();
    useStore.setState({ projects: [project], currentProjectId: project.id });
    const user = userEvent.setup();
    renderTopNav();

    await user.click(screen.getByRole('button', { name: /\+ add assumption/i }));

    expect(useStore.getState().isAssumptionModalOpen).toBe(true);
  });

  it('clicking the project name opens the project modal', async () => {
    const project = makeProject();
    useStore.setState({ projects: [project], currentProjectId: project.id });
    const user = userEvent.setup();
    renderTopNav();

    await user.click(screen.getByText('Test Project'));

    expect(useStore.getState().isProjectModalOpen).toBe(true);
  });

  describe('Export menu', () => {
    it('export menu is hidden by default', () => {
      const project = makeProject();
      useStore.setState({ projects: [project], currentProjectId: project.id });
      renderTopNav();
      expect(screen.queryByRole('button', { name: /export csv/i })).not.toBeInTheDocument();
    });

    it('clicking "Export ▾" shows export options', async () => {
      const project = makeProject();
      useStore.setState({ projects: [project], currentProjectId: project.id });
      const user = userEvent.setup();
      renderTopNav();

      await user.click(screen.getByRole('button', { name: /export ▾/i }));

      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument();
    });

    it('clicking "Export CSV" triggers CSV export and hides the menu', async () => {
      const project = makeProject();
      useStore.setState({ projects: [project], currentProjectId: project.id });

      const user = userEvent.setup();
      renderTopNav();

      await user.click(screen.getByRole('button', { name: /export ▾/i }));

      const linkMock = { href: '', download: '', click: vi.fn() };
      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') return linkMock as unknown as HTMLElement;
        return origCreateElement(tag);
      });
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

      await user.click(screen.getByRole('button', { name: /export csv/i }));

      expect(linkMock.click).toHaveBeenCalledOnce();
      expect(screen.queryByRole('button', { name: /export csv/i })).not.toBeInTheDocument();
    });

    it('clicking "Export JSON" triggers JSON export', async () => {
      const project = makeProject();
      useStore.setState({ projects: [project], currentProjectId: project.id });

      const user = userEvent.setup();
      renderTopNav();

      await user.click(screen.getByRole('button', { name: /export ▾/i }));

      const linkMock = { href: '', download: '', click: vi.fn() };
      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') return linkMock as unknown as HTMLElement;
        return origCreateElement(tag);
      });
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

      await user.click(screen.getByRole('button', { name: /export json/i }));

      expect(linkMock.click).toHaveBeenCalledOnce();
    });

    it('clicking "Export PDF" triggers PDF export without throwing', async () => {
      const project = makeProject();
      useStore.setState({ projects: [project], currentProjectId: project.id });

      const user = userEvent.setup();
      renderTopNav();

      await user.click(screen.getByRole('button', { name: /export ▾/i }));
      await expect(
        user.click(screen.getByRole('button', { name: /export pdf/i }))
      ).resolves.not.toThrow();
    });
  });
});
