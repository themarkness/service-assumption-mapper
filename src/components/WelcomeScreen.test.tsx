import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeScreen } from './WelcomeScreen';
import { useStore } from '../store/useStore';

// Reset store to a known state before each test
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

beforeEach(() => {
  resetStore();
});

describe('WelcomeScreen', () => {
  describe('when no user name is set', () => {
    it('renders the main heading', () => {
      render(<WelcomeScreen />);
      expect(
        screen.getByText('Government Service Assumptions Mapping Tool')
      ).toBeInTheDocument();
    });

    it('shows the name input form', () => {
      render(<WelcomeScreen />);
      expect(screen.getByLabelText(/what's your name/i)).toBeInTheDocument();
    });

    it('shows a Continue button', () => {
      render(<WelcomeScreen />);
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('does not show "Getting Started" section before name is submitted', () => {
      render(<WelcomeScreen />);
      expect(screen.queryByText(/getting started/i)).not.toBeInTheDocument();
    });

    it('does not show "Create Your First Project" before name is submitted', () => {
      render(<WelcomeScreen />);
      expect(screen.queryByRole('button', { name: /create your first project/i })).not.toBeInTheDocument();
    });
  });

  describe('submitting the name form', () => {
    it('saves the user name and shows the welcome message', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      await user.type(screen.getByLabelText(/what's your name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      expect(screen.getByText(/welcome, alice/i)).toBeInTheDocument();
    });

    it('persists the user name in the store', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      await user.type(screen.getByLabelText(/what's your name/i), 'Bob');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      expect(useStore.getState().userName).toBe('Bob');
    });

    it('trims whitespace from the entered name', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      await user.type(screen.getByLabelText(/what's your name/i), '  Charlie  ');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      expect(useStore.getState().userName).toBe('Charlie');
    });

    it('does not submit when the name is blank', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      await user.click(screen.getByRole('button', { name: /continue/i }));

      // Name input should still be visible
      expect(screen.getByLabelText(/what's your name/i)).toBeInTheDocument();
    });

    it('shows "Getting Started" section after name is submitted', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      await user.type(screen.getByLabelText(/what's your name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      expect(screen.getByText(/getting started/i)).toBeInTheDocument();
    });

    it('shows "Create Your First Project" button after name is submitted', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      await user.type(screen.getByLabelText(/what's your name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      expect(screen.getByRole('button', { name: /create your first project/i })).toBeInTheDocument();
    });
  });

  describe('when a user name is already set in the store', () => {
    beforeEach(() => {
      useStore.setState({ userName: 'Alice' });
    });

    it('shows the welcome message immediately', () => {
      render(<WelcomeScreen />);
      expect(screen.getByText(/welcome, alice/i)).toBeInTheDocument();
    });

    it('does not show the name input form', () => {
      render(<WelcomeScreen />);
      expect(screen.queryByLabelText(/what's your name/i)).not.toBeInTheDocument();
    });

    it('shows a "Change name" link', () => {
      render(<WelcomeScreen />);
      expect(screen.getByRole('button', { name: /change name/i })).toBeInTheDocument();
    });

    it('clicking "Change name" restores the name input form', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      await user.click(screen.getByRole('button', { name: /change name/i }));

      expect(screen.getByLabelText(/what's your name/i)).toBeInTheDocument();
    });
  });

  describe('"Create Your First Project" button', () => {
    it('calls openProjectModal when clicked', async () => {
      useStore.setState({ userName: 'Alice' });
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      await user.click(screen.getByRole('button', { name: /create your first project/i }));

      expect(useStore.getState().isProjectModalOpen).toBe(true);
    });
  });

  describe('form submission via keyboard', () => {
    it('submits the form when Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<WelcomeScreen />);

      const input = screen.getByLabelText(/what's your name/i);
      await user.type(input, 'Dave{Enter}');

      expect(useStore.getState().userName).toBe('Dave');
    });
  });
});
