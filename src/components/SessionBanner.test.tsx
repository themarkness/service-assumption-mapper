import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionBanner } from './SessionBanner';
import { useStore } from '../store/useStore';
import type { Assumption } from '../types';

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

function makeAssumption(overrides: Partial<Assumption> = {}): Assumption {
  return {
    id: 'a1',
    projectId: 'session-1',
    text: 'Test assumption',
    category: 'users',
    scores: [],
    createdBy: 'Alice',
    updatedBy: 'Alice',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SessionBanner', () => {
  it('renders nothing when there is no current session', () => {
    const { container } = render(<SessionBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the session ID when a session is active', () => {
    useStore.setState({ currentProjectId: 'session-1' });
    render(<SessionBanner />);
    expect(screen.getByText('session-1')).toBeInTheDocument();
  });

  it('shows a "Copy invite link" button', () => {
    useStore.setState({ currentProjectId: 'session-1' });
    render(<SessionBanner />);
    expect(screen.getByRole('button', { name: /copy invite link/i })).toBeInTheDocument();
  });

  it('shows the current user name as a participant', () => {
    useStore.setState({ currentProjectId: 'session-1', userName: 'Alice' });
    render(<SessionBanner />);
    expect(screen.getByText(/alice/i)).toBeInTheDocument();
  });

  it('shows participants from assumption scores', () => {
    useStore.setState({
      currentProjectId: 'session-1',
      userName: null,
      assumptions: [
        makeAssumption({
          scores: [{ person: 'Bob', importance: 5, confidence: 5, timestamp: 1000 }],
        }),
      ],
    });
    render(<SessionBanner />);
    expect(screen.getByText(/bob/i)).toBeInTheDocument();
  });

  it('copies the invite URL to clipboard on button click', async () => {
    useStore.setState({ currentProjectId: 'session-1' });

    // userEvent.setup() replaces navigator.clipboard with its own ClipboardStub.
    // Spy on writeText AFTER setup so we intercept the stub's method, not a pre-set mock.
    const user = userEvent.setup();
    render(<SessionBanner />);
    const writeTextSpy = vi.spyOn(navigator.clipboard as Clipboard, 'writeText').mockResolvedValue(undefined);

    await user.click(screen.getByRole('button', { name: /copy invite link/i }));

    expect(writeTextSpy).toHaveBeenCalledOnce();
    expect(writeTextSpy).toHaveBeenCalledWith(
      expect.stringContaining('session-1')
    );
  });

  it('shows "Copied!" feedback after copying', async () => {
    useStore.setState({ currentProjectId: 'session-1' });

    const user = userEvent.setup();
    render(<SessionBanner />);

    await user.click(screen.getByRole('button', { name: /copy invite link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
    });
  });
});
