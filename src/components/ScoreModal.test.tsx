import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScoreModal } from './ScoreModal';
import { useStore } from '../store/useStore';
import type { Assumption } from '../types';

function makeAssumption(overrides: Partial<Assumption> = {}): Assumption {
  return {
    id: 'a1',
    projectId: 'proj-1',
    text: 'Users will adopt the service',
    category: 'users',
    scores: [],
    createdBy: 'Alice',
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
    userName: 'Alice',
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

describe('ScoreModal', () => {
  it('renders nothing when isScoreModalOpen is false', () => {
    const { container } = render(<ScoreModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when scoringAssumption is null even if modal is open', () => {
    useStore.setState({ isScoreModalOpen: true, scoringAssumption: null });
    const { container } = render(<ScoreModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when both isScoreModalOpen and scoringAssumption are set', () => {
    const assumption = makeAssumption();
    useStore.setState({ isScoreModalOpen: true, scoringAssumption: assumption });
    render(<ScoreModal />);
    expect(screen.getByText('Score Assumption')).toBeInTheDocument();
  });

  it('displays the assumption text in the modal', () => {
    const assumption = makeAssumption({ text: 'Users will adopt the service' });
    useStore.setState({ isScoreModalOpen: true, scoringAssumption: assumption });
    render(<ScoreModal />);
    expect(screen.getByText('Users will adopt the service')).toBeInTheDocument();
  });

  it('shows both importance and confidence sliders', () => {
    const assumption = makeAssumption();
    useStore.setState({ isScoreModalOpen: true, scoringAssumption: assumption });
    render(<ScoreModal />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(2);
  });

  it('shows the notes textarea', () => {
    const assumption = makeAssumption();
    useStore.setState({ isScoreModalOpen: true, scoringAssumption: assumption });
    render(<ScoreModal />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows Save Score and Cancel buttons', () => {
    const assumption = makeAssumption();
    useStore.setState({ isScoreModalOpen: true, scoringAssumption: assumption });
    render(<ScoreModal />);
    expect(screen.getByRole('button', { name: /save score/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('closes the modal when Cancel is clicked', async () => {
    const assumption = makeAssumption();
    useStore.setState({ isScoreModalOpen: true, scoringAssumption: assumption });
    const user = userEvent.setup();
    render(<ScoreModal />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(useStore.getState().isScoreModalOpen).toBe(false);
    expect(useStore.getState().scoringAssumption).toBeNull();
  });

  it('displays existing scores from other users', () => {
    const assumption = makeAssumption({
      scores: [{ person: 'Bob', importance: 7, confidence: 4, timestamp: 1 }],
    });
    useStore.setState({ isScoreModalOpen: true, scoringAssumption: assumption });
    render(<ScoreModal />);
    expect(screen.getByText('Bob:')).toBeInTheDocument();
    expect(screen.getByText(/importance: 7/i)).toBeInTheDocument();
    expect(screen.getByText(/confidence: 4/i)).toBeInTheDocument();
  });

  it('does not show current scores section when assumption has no scores', () => {
    const assumption = makeAssumption({ scores: [] });
    useStore.setState({ isScoreModalOpen: true, scoringAssumption: assumption });
    render(<ScoreModal />);
    expect(screen.queryByText(/current scores/i)).not.toBeInTheDocument();
  });

  it('shows the calculated risk score preview', () => {
    const assumption = makeAssumption();
    useStore.setState({ isScoreModalOpen: true, scoringAssumption: assumption });
    render(<ScoreModal />);
    expect(screen.getByText(/calculated risk score/i)).toBeInTheDocument();
  });

  it('submits the score and closes modal on form submit', async () => {
    const { saveAssumption } = await import('../utils/storage');
    const assumption = makeAssumption();
    saveAssumption(assumption);
    useStore.setState({
      isScoreModalOpen: true,
      scoringAssumption: assumption,
      assumptions: [assumption],
      userName: 'Alice',
    });

    const user = userEvent.setup();
    render(<ScoreModal />);

    await user.click(screen.getByRole('button', { name: /save score/i }));

    expect(useStore.getState().isScoreModalOpen).toBe(false);
  });

  it('pre-populates form with the current user existing score', () => {
    const assumption = makeAssumption({
      scores: [{ person: 'Alice', importance: 9, confidence: 2, notes: 'Risky', timestamp: 1 }],
    });
    useStore.setState({
      isScoreModalOpen: true,
      scoringAssumption: assumption,
      userName: 'Alice',
    });
    render(<ScoreModal />);

    // The importance slider should be 9
    const sliders = screen.getAllByRole('slider');
    expect(sliders[0]).toHaveValue('9');
    expect(sliders[1]).toHaveValue('2');
  });
});
