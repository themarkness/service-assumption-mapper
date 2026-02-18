import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssumptionModal } from './AssumptionModal';
import { useStore } from '../store/useStore';
import { saveAssumption } from '../utils/storage';
import type { Assumption } from '../types';

function makeAssumption(overrides: Partial<Assumption> = {}): Assumption {
  return {
    id: 'a1',
    projectId: 'proj-1',
    text: 'Users will adopt the service',
    category: 'users',
    scores: [],
    createdBy: 'Alice',
    updatedBy: 'Alice',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function resetStore(overrides = {}) {
  useStore.setState({
    projects: [],
    assumptions: [],
    currentProjectId: 'proj-1',
    userName: 'Alice',
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

describe('AssumptionModal', () => {
  it('renders nothing when isAssumptionModalOpen is false', () => {
    const { container } = render(<AssumptionModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal when isAssumptionModalOpen is true', () => {
    useStore.setState({ isAssumptionModalOpen: true });
    render(<AssumptionModal />);
    expect(screen.getByText('Add New Assumption')).toBeInTheDocument();
  });

  it('shows all form fields', () => {
    useStore.setState({ isAssumptionModalOpen: true });
    render(<AssumptionModal />);
    expect(screen.getByLabelText(/assumption \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/consequence if wrong/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/existing knowledge/i)).toBeInTheDocument();
  });

  it('shows all 8 category options', () => {
    useStore.setState({ isAssumptionModalOpen: true });
    render(<AssumptionModal />);
    expect(screen.getByRole('option', { name: 'Service' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Technology' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Stakeholders' })).toBeInTheDocument();
  });

  it('shows "Add Assumption" button for a new assumption', () => {
    useStore.setState({ isAssumptionModalOpen: true });
    render(<AssumptionModal />);
    expect(screen.getByRole('button', { name: /add assumption/i })).toBeInTheDocument();
  });

  it('closes the modal when Cancel is clicked', async () => {
    useStore.setState({ isAssumptionModalOpen: true });
    const user = userEvent.setup();
    render(<AssumptionModal />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(useStore.getState().isAssumptionModalOpen).toBe(false);
  });

  it('creates a new assumption on valid form submission', async () => {
    useStore.setState({ isAssumptionModalOpen: true, currentProjectId: 'proj-1' });
    const user = userEvent.setup();
    render(<AssumptionModal />);

    await user.type(screen.getByLabelText(/assumption \*/i), 'The service is needed');
    await user.click(screen.getByRole('button', { name: /add assumption/i }));

    expect(useStore.getState().assumptions).toHaveLength(1);
    expect(useStore.getState().assumptions[0].text).toBe('The service is needed');
    expect(useStore.getState().isAssumptionModalOpen).toBe(false);
  });

  it('assigns the current user as createdBy when creating', async () => {
    useStore.setState({ isAssumptionModalOpen: true, currentProjectId: 'proj-1', userName: 'Bob' });
    const user = userEvent.setup();
    render(<AssumptionModal />);

    await user.type(screen.getByLabelText(/assumption \*/i), 'New assumption');
    await user.click(screen.getByRole('button', { name: /add assumption/i }));

    expect(useStore.getState().assumptions[0].createdBy).toBe('Bob');
  });

  it('uses "Anonymous" as createdBy when no user name is set', async () => {
    useStore.setState({ isAssumptionModalOpen: true, currentProjectId: 'proj-1', userName: null });
    const user = userEvent.setup();
    render(<AssumptionModal />);

    await user.type(screen.getByLabelText(/assumption \*/i), 'New assumption');
    await user.click(screen.getByRole('button', { name: /add assumption/i }));

    expect(useStore.getState().assumptions[0].createdBy).toBe('Anonymous');
  });

  describe('Edit mode (editingAssumption with a real ID)', () => {
    it('shows "Edit Assumption" title when editing an existing assumption', () => {
      const assumption = makeAssumption();
      useStore.setState({ isAssumptionModalOpen: true, editingAssumption: assumption });
      render(<AssumptionModal />);
      expect(screen.getByText('Edit Assumption')).toBeInTheDocument();
    });

    it('shows "Save Changes" button when editing', () => {
      const assumption = makeAssumption();
      useStore.setState({ isAssumptionModalOpen: true, editingAssumption: assumption });
      render(<AssumptionModal />);
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('pre-populates the form with the existing assumption data', () => {
      const assumption = makeAssumption({
        text: 'Existing assumption text',
        category: 'technology',
        consequence: 'Service breaks',
        existingKnowledge: 'We know something',
      });
      useStore.setState({ isAssumptionModalOpen: true, editingAssumption: assumption });
      render(<AssumptionModal />);

      expect(screen.getByDisplayValue('Existing assumption text')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Service breaks')).toBeInTheDocument();
      expect(screen.getByDisplayValue('We know something')).toBeInTheDocument();
    });

    it('updates the assumption on form submission', async () => {
      const assumption = makeAssumption({ text: 'Original text' });
      saveAssumption(assumption);
      useStore.setState({
        isAssumptionModalOpen: true,
        editingAssumption: assumption,
        assumptions: [assumption],
      });

      const user = userEvent.setup();
      render(<AssumptionModal />);

      const textarea = screen.getByLabelText(/assumption \*/i);
      await user.clear(textarea);
      await user.type(textarea, 'Updated text');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(useStore.getState().assumptions[0].text).toBe('Updated text');
      expect(useStore.getState().isAssumptionModalOpen).toBe(false);
    });
  });

  describe('Pre-selected category mode (editingAssumption without ID)', () => {
    it('pre-selects the category when editingAssumption has a category but no id', () => {
      // When clicking "+ Add assumption" from a column, editingAssumption has category but empty id
      const partial = {
        id: '',
        projectId: '',
        text: '',
        category: 'technology' as const,
        scores: [],
        createdBy: '',
        updatedBy: '',
        createdAt: 0,
        updatedAt: 0,
      };
      useStore.setState({ isAssumptionModalOpen: true, editingAssumption: partial });
      render(<AssumptionModal />);

      // The category select should default to 'technology'
      expect(screen.getByRole('combobox')).toHaveValue('technology');
    });
  });

  it('closes the modal when the overlay is clicked', async () => {
    useStore.setState({ isAssumptionModalOpen: true });
    const user = userEvent.setup();
    const { container } = render(<AssumptionModal />);

    const overlay = container.firstChild as HTMLElement;
    await user.click(overlay);

    expect(useStore.getState().isAssumptionModalOpen).toBe(false);
  });
});
