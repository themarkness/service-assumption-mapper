import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectModal } from './ProjectModal';
import { useStore } from '../store/useStore';

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
});

describe('ProjectModal', () => {
  it('renders nothing when isProjectModalOpen is false', () => {
    const { container } = render(<ProjectModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal when isProjectModalOpen is true', () => {
    useStore.setState({ isProjectModalOpen: true });
    render(<ProjectModal />);
    expect(screen.getByText('Create New Project')).toBeInTheDocument();
  });

  it('shows all required form fields', () => {
    useStore.setState({ isProjectModalOpen: true });
    render(<ProjectModal />);
    expect(screen.getByLabelText(/service\/product name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/team\/department/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phase/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
  });

  it('shows all phase options in the select', () => {
    useStore.setState({ isProjectModalOpen: true });
    render(<ProjectModal />);
    expect(screen.getByRole('option', { name: 'Discovery' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Live' })).toBeInTheDocument();
  });

  it('closes the modal when Cancel is clicked', async () => {
    useStore.setState({ isProjectModalOpen: true });
    const user = userEvent.setup();
    render(<ProjectModal />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(useStore.getState().isProjectModalOpen).toBe(false);
  });

  it('creates a project and closes modal on valid form submission', async () => {
    useStore.setState({ isProjectModalOpen: true });
    const user = userEvent.setup();
    render(<ProjectModal />);

    await user.type(screen.getByLabelText(/service\/product name/i), 'My Service');
    await user.type(screen.getByLabelText(/team\/department/i), 'GDS Team');
    await user.click(screen.getByRole('button', { name: /create project/i }));

    expect(useStore.getState().projects).toHaveLength(1);
    expect(useStore.getState().projects[0].name).toBe('My Service');
    expect(useStore.getState().isProjectModalOpen).toBe(false);
  });

  it('shows "Edit Project" title when a current project exists', () => {
    useStore.getState().createProject({
      name: 'Existing Project',
      team: 'Team',
      phase: 'Alpha',
      date: '2024-01-01',
    });
    useStore.setState({ isProjectModalOpen: true });
    render(<ProjectModal />);
    expect(screen.getByText('Edit Project')).toBeInTheDocument();
  });

  it('shows "Save Changes" button when editing', () => {
    useStore.getState().createProject({
      name: 'Existing Project',
      team: 'Team',
      phase: 'Alpha',
      date: '2024-01-01',
    });
    useStore.setState({ isProjectModalOpen: true });
    render(<ProjectModal />);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('pre-populates form with current project data when editing', () => {
    useStore.getState().createProject({
      name: 'Existing Project',
      team: 'GDS Team',
      phase: 'Beta',
      date: '2024-06-01',
    });
    useStore.setState({ isProjectModalOpen: true });
    render(<ProjectModal />);

    expect(screen.getByDisplayValue('Existing Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('GDS Team')).toBeInTheDocument();
  });

  it('closes the modal when the overlay is clicked', async () => {
    useStore.setState({ isProjectModalOpen: true });
    const user = userEvent.setup();
    const { container } = render(<ProjectModal />);

    // The outer overlay div has the onClick handler
    const overlay = container.firstChild as HTMLElement;
    await user.click(overlay);

    expect(useStore.getState().isProjectModalOpen).toBe(false);
  });
});
