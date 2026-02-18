import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinSessionPage } from './JoinSessionPage';
import { useStore } from '../store/useStore';

function resetStore() {
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
  });
}

beforeEach(() => {
  resetStore();
});

describe('JoinSessionPage', () => {
  it('renders the join heading', () => {
    render(<JoinSessionPage sessionId="abc123" />);
    expect(screen.getByText(/join session/i)).toBeInTheDocument();
  });

  it('shows the session ID in the page', () => {
    render(<JoinSessionPage sessionId="abc123" />);
    expect(screen.getByText('abc123')).toBeInTheDocument();
  });

  it('renders the name input field', () => {
    render(<JoinSessionPage sessionId="abc123" />);
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
  });

  it('renders a Join button', () => {
    render(<JoinSessionPage sessionId="abc123" />);
    expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument();
  });

  it('saves the user name when the form is submitted', async () => {
    const user = userEvent.setup();
    render(<JoinSessionPage sessionId="abc123" />);

    await user.type(screen.getByLabelText(/your name/i), 'Alice');
    await user.click(screen.getByRole('button', { name: /join/i }));

    expect(useStore.getState().userName).toBe('Alice');
  });

  it('trims whitespace from the name', async () => {
    const user = userEvent.setup();
    render(<JoinSessionPage sessionId="abc123" />);

    await user.type(screen.getByLabelText(/your name/i), '  Bob  ');
    await user.click(screen.getByRole('button', { name: /join/i }));

    expect(useStore.getState().userName).toBe('Bob');
  });

  it('does not save an empty name', async () => {
    const user = userEvent.setup();
    render(<JoinSessionPage sessionId="abc123" />);

    await user.click(screen.getByRole('button', { name: /join/i }));

    expect(useStore.getState().userName).toBeNull();
  });
});
