import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssumptionCard } from './AssumptionCard';
import { useStore } from '../store/useStore';
import type { AssumptionWithCalculations } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore() {
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
  });
}

function makeAssumption(
  overrides: Partial<AssumptionWithCalculations> = {}
): AssumptionWithCalculations {
  return {
    id: 'a1',
    projectId: 'proj-1',
    text: 'Users will adopt the service easily',
    category: 'users',
    scores: [],
    createdBy: 'Alice',
    createdAt: 1000,
    updatedAt: 1000,
    averageImportance: 0,
    averageConfidence: 0,
    riskScore: 0,
    ...overrides,
  };
}

beforeEach(() => {
  resetStore();
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('AssumptionCard rendering', () => {
  it('renders the assumption text', () => {
    render(<AssumptionCard assumption={makeAssumption()} />);
    expect(screen.getByText('Users will adopt the service easily')).toBeInTheDocument();
  });

  it('renders Edit and Delete buttons', () => {
    render(<AssumptionCard assumption={makeAssumption()} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('renders "Add Score" when no scores exist', () => {
    render(<AssumptionCard assumption={makeAssumption({ scores: [] })} />);
    expect(screen.getByRole('button', { name: /add score/i })).toBeInTheDocument();
  });

  it('renders "Update Score" when scores exist', () => {
    const assumption = makeAssumption({
      scores: [{ person: 'Alice', importance: 7, confidence: 4, timestamp: 1 }],
      averageImportance: 7,
      averageConfidence: 4,
      riskScore: 42,
    });
    render(<AssumptionCard assumption={assumption} />);
    expect(screen.getByRole('button', { name: /update score/i })).toBeInTheDocument();
  });

  it('does not show score badges when there are no scores', () => {
    render(<AssumptionCard assumption={makeAssumption({ scores: [] })} />);
    expect(screen.queryByText(/I:\d/)).not.toBeInTheDocument();
  });

  it('shows score badges for each scorer when scores exist', () => {
    const assumption = makeAssumption({
      scores: [
        { person: 'Alice', importance: 8, confidence: 3, timestamp: 1 },
        { person: 'Bob', importance: 6, confidence: 7, timestamp: 2 },
      ],
      riskScore: 40,
      averageImportance: 7,
      averageConfidence: 5,
    });
    render(<AssumptionCard assumption={assumption} />);
    expect(screen.getByText(/Alice: I:8 C:3/)).toBeInTheDocument();
    expect(screen.getByText(/Bob: I:6 C:7/)).toBeInTheDocument();
  });

  it('shows the numeric risk score when scores exist', () => {
    const assumption = makeAssumption({
      scores: [{ person: 'Alice', importance: 8, confidence: 3, timestamp: 1 }],
      riskScore: 56,
      averageImportance: 8,
      averageConfidence: 3,
    });
    render(<AssumptionCard assumption={assumption} />);
    // Risk score is displayed as toFixed(0) → "56"
    expect(screen.getByText('56')).toBeInTheDocument();
  });

  it('shows average importance and confidence when scores exist', () => {
    const assumption = makeAssumption({
      scores: [{ person: 'Alice', importance: 8, confidence: 4, timestamp: 1 }],
      riskScore: 48,
      averageImportance: 8,
      averageConfidence: 4,
    });
    render(<AssumptionCard assumption={assumption} />);
    expect(screen.getByText(/avg importance/i)).toBeInTheDocument();
    expect(screen.getByText(/avg confidence/i)).toBeInTheDocument();
  });

  it('applies opacity class when isDragging is true', () => {
    const { container } = render(
      <AssumptionCard assumption={makeAssumption()} isDragging={true} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('opacity-50');
  });

  it('does not apply opacity class when isDragging is false', () => {
    const { container } = render(
      <AssumptionCard assumption={makeAssumption()} isDragging={false} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('opacity-50');
  });
});

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

describe('AssumptionCard interactions', () => {
  it('clicking the card opens the score modal', async () => {
    const user = userEvent.setup();
    const assumption = makeAssumption();
    render(<AssumptionCard assumption={assumption} />);

    const card = screen.getByText('Users will adopt the service easily').closest('div[class]')!;
    await user.click(card);

    expect(useStore.getState().isScoreModalOpen).toBe(true);
    expect(useStore.getState().scoringAssumption?.id).toBe(assumption.id);
  });

  it('clicking Edit opens the assumption modal in edit mode', async () => {
    const user = userEvent.setup();
    const assumption = makeAssumption();
    render(<AssumptionCard assumption={assumption} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(useStore.getState().isAssumptionModalOpen).toBe(true);
    expect(useStore.getState().editingAssumption?.id).toBe(assumption.id);
  });

  it('clicking "Add Score" / "Update Score" opens the score modal', async () => {
    const user = userEvent.setup();
    const assumption = makeAssumption({ scores: [] });
    render(<AssumptionCard assumption={assumption} />);

    await user.click(screen.getByRole('button', { name: /add score/i }));

    expect(useStore.getState().isScoreModalOpen).toBe(true);
  });

  it('clicking Delete and confirming calls deleteAssumption', async () => {
    // Seed the assumption into storage so the store can delete it
    const { saveAssumption } = await import('../utils/storage');
    const assumption = makeAssumption();
    saveAssumption(assumption);
    useStore.setState({ assumptions: [assumption] });

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    render(<AssumptionCard assumption={assumption} />);
    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(useStore.getState().assumptions).toHaveLength(0);

    vi.restoreAllMocks();
  });

  it('clicking Delete and cancelling does NOT delete the assumption', async () => {
    const { saveAssumption } = await import('../utils/storage');
    const assumption = makeAssumption();
    saveAssumption(assumption);
    useStore.setState({ assumptions: [assumption] });

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const user = userEvent.setup();
    render(<AssumptionCard assumption={assumption} />);
    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(useStore.getState().assumptions).toHaveLength(1);

    vi.restoreAllMocks();
  });

  it('Edit button click does not bubble up to card (score modal should not open)', async () => {
    const user = userEvent.setup();
    const assumption = makeAssumption();
    render(<AssumptionCard assumption={assumption} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    // Only assumption modal should be open; score modal should stay closed
    expect(useStore.getState().isAssumptionModalOpen).toBe(true);
    expect(useStore.getState().isScoreModalOpen).toBe(false);
  });
});
