import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryView } from './CategoryView';
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

describe('CategoryView', () => {
  it('renders all 8 category column headings', () => {
    render(<CategoryView />);
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Business Case')).toBeInTheDocument();
    expect(screen.getByText('Market Opportunity')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Delivery Approach')).toBeInTheDocument();
    expect(screen.getByText('Stakeholders')).toBeInTheDocument();
  });

  it('shows an "+ Add assumption" button in each column', () => {
    render(<CategoryView />);
    const addButtons = screen.getAllByRole('button', { name: /\+ add assumption/i });
    expect(addButtons).toHaveLength(8);
  });

  it('shows assumption count badges for each column', () => {
    render(<CategoryView />);
    // 8 columns each with a count badge starting at 0
    const zeroBadges = screen.getAllByText('0');
    expect(zeroBadges).toHaveLength(8);
  });

  it('displays an assumption card in the correct category column', () => {
    const assumption = makeAssumption({ id: 'a1', category: 'technology' });
    saveAssumption(assumption);
    useStore.setState({ assumptions: [assumption] });

    render(<CategoryView />);

    expect(screen.getByText('Users will adopt the service')).toBeInTheDocument();
  });

  it('updates the count badge when assumptions are present', () => {
    const assumption = makeAssumption({ id: 'a1', category: 'service' });
    saveAssumption(assumption);
    useStore.setState({ assumptions: [assumption] });

    render(<CategoryView />);

    // The "service" column should now show count "1"
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('only shows assumptions for the current project', () => {
    const ownAssumption = makeAssumption({ id: 'a1', projectId: 'proj-1' });
    const otherAssumption = makeAssumption({ id: 'a2', projectId: 'proj-other', text: 'Other project assumption' });
    saveAssumption(ownAssumption);
    saveAssumption(otherAssumption);
    useStore.setState({ assumptions: [ownAssumption, otherAssumption], currentProjectId: 'proj-1' });

    render(<CategoryView />);

    expect(screen.getByText('Users will adopt the service')).toBeInTheDocument();
    expect(screen.queryByText('Other project assumption')).not.toBeInTheDocument();
  });

  it('clicking "+ Add assumption" opens the assumption modal with the column category', async () => {
    const user = userEvent.setup();
    render(<CategoryView />);

    // Click the first "+ Add assumption" button (Service column)
    const addButtons = screen.getAllByRole('button', { name: /\+ add assumption/i });
    await user.click(addButtons[0]);

    expect(useStore.getState().isAssumptionModalOpen).toBe(true);
    expect(useStore.getState().editingAssumption?.category).toBe('service');
  });
});
