import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveHeaderPinButton from '../../../../components/waves/header/WaveHeaderPinButton';
import { AuthContext } from '../../../../components/auth/Auth';

// Create mocks that we can access
const mockAddPinnedWave = jest.fn();
const mockRemovePinnedWave = jest.fn();

// Mock the MyStreamContext
jest.mock('../../../../contexts/wave/MyStreamContext', () => ({
  useMyStream: () => ({
    waves: {
      addPinnedWave: mockAddPinnedWave,
      removePinnedWave: mockRemovePinnedWave,
    },
  }),
}));

// Create mocks that we can modify during tests
const mockUsePinnedWavesServer = jest.fn();
const mockIsOperationInProgress = jest.fn(() => false);

jest.mock('../../../../hooks/usePinnedWavesServer', () => ({
  usePinnedWavesServer: () => mockUsePinnedWavesServer(),
  MAX_PINNED_WAVES: 3,
}));

jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid={`tooltip-${id}`}>{children}</div>
  ),
}));


const mockAuth = {
  connectedProfile: { handle: 'testuser' },
  activeProfileProxy: null,
  setToast: jest.fn(),
};

const mockAuthNotConnected = {
  connectedProfile: null,
  activeProfileProxy: null,
  setToast: jest.fn(),
};

const mockAuthWithProxy = {
  connectedProfile: { handle: 'testuser' },
  activeProfileProxy: { id: 'proxy1' },
  setToast: jest.fn(),
};

describe('WaveHeaderPinButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set default mock return values
    mockUsePinnedWavesServer.mockReturnValue({
      pinnedIds: [],
      isOperationInProgress: mockIsOperationInProgress,
    });
    mockIsOperationInProgress.mockReturnValue(false);
  });

  const renderComponent = (authContext = mockAuth, waveId = 'wave-123') => {
    return render(
      <AuthContext.Provider value={authContext}>
        <WaveHeaderPinButton waveId={waveId} />
      </AuthContext.Provider>
    );
  };

  describe('Authentication Checks', () => {
    it('does not render when user is not authenticated', () => {
      const { container } = renderComponent(mockAuthNotConnected);
      expect(container.firstChild).toBeNull();
    });

    it('does not render when user is using proxy', () => {
      const { container } = renderComponent(mockAuthWithProxy);
      expect(container.firstChild).toBeNull();
    });

    it('renders when user is authenticated without proxy', () => {
      renderComponent();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Pin Button Rendering', () => {
    it('renders pin button with correct styling', () => {
      renderComponent();
      const button = screen.getByRole('button');
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Pin wave');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('renders tooltip with correct content for unpinned wave', () => {
      renderComponent();
      expect(screen.getByTestId('tooltip-wave-header-pin-wave-123')).toBeInTheDocument();
    });
  });

  describe('Pin Functionality', () => {
    it('pins wave when clicked and not currently pinned', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockAddPinnedWave).toHaveBeenCalledWith('wave-123');
      expect(mockRemovePinnedWave).not.toHaveBeenCalled();
    });

    it('prevents event propagation when clicked', async () => {
      const user = userEvent.setup();
      const mockStopPropagation = jest.fn();
      const mockPreventDefault = jest.fn();
      
      renderComponent();
      const button = screen.getByRole('button');
      
      // Mock the event methods
      button.click = () => {
        const event = new MouseEvent('click', { bubbles: true });
        event.stopPropagation = mockStopPropagation;
        event.preventDefault = mockPreventDefault;
        fireEvent(button, event);
      };
      
      await user.click(button);
      
      expect(mockAddPinnedWave).toHaveBeenCalled();
    });
  });

  describe('Unpin Functionality', () => {
    beforeEach(() => {
      // Mock usePinnedWavesServer to return wave as pinned
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ['wave-123'],
        isOperationInProgress: mockIsOperationInProgress,
      });
    });

    it('unpins wave when clicked and currently pinned', async () => {
      // Re-render with updated mock
      const user = userEvent.setup();
      renderComponent();
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Unpin wave');
      
      await user.click(button);
      
      expect(mockRemovePinnedWave).toHaveBeenCalledWith('wave-123');
      expect(mockAddPinnedWave).not.toHaveBeenCalled();
    });
  });

  describe('Max Limit Handling', () => {
    beforeEach(() => {
      // Mock usePinnedWavesServer to return max pinned waves
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ['wave-1', 'wave-2', 'wave-3'],
        isOperationInProgress: mockIsOperationInProgress,
      });
    });

    it('shows error toast when trying to pin beyond limit', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockAuth.setToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Maximum 3 pinned waves allowed',
      });
      expect(mockAddPinnedWave).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      // Mock usePinnedWavesServer to return operation in progress
      mockIsOperationInProgress.mockReturnValue(true);
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: [],
        isOperationInProgress: mockIsOperationInProgress,
      });
    });

    it('disables button when operation is in progress', () => {
      renderComponent();
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('tw-opacity-50', 'tw-cursor-not-allowed');
    });

    it('does not execute action when operation is in progress', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockAddPinnedWave).not.toHaveBeenCalled();
      expect(mockRemovePinnedWave).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles errors when pinning fails', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Network error');
      mockAddPinnedWave.mockImplementation(() => {
        throw mockError;
      });
      
      renderComponent();
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockAuth.setToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to pin wave: Network error',
      });
    });

    it('handles errors when unpinning fails', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Server error');
      mockRemovePinnedWave.mockImplementation(() => {
        throw mockError;
      });
      
      // Mock as pinned wave
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ['wave-123'],
        isOperationInProgress: mockIsOperationInProgress,
      });
      
      renderComponent();
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockAuth.setToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to unpin wave: Server error',
      });
    });

    it('handles non-Error objects in catch block', async () => {
      const user = userEvent.setup();
      mockAddPinnedWave.mockImplementation(() => {
        throw new Error('String error');
      });
      
      renderComponent();
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockAuth.setToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to pin wave: String error',
      });
    });
  });

  describe('Tooltip Content', () => {
    it('shows correct tooltip for unpinned wave', () => {
      renderComponent();
      const tooltip = screen.getByTestId('tooltip-wave-header-pin-wave-123');
      expect(tooltip).toHaveTextContent('Pin wave');
    });

    it('shows correct tooltip for pinned wave', () => {
      // Mock as pinned
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ['wave-123'],
        isOperationInProgress: mockIsOperationInProgress,
      });
      
      renderComponent();
      const tooltip = screen.getByTestId('tooltip-wave-header-pin-wave-123');
      expect(tooltip).toHaveTextContent('Unpin wave');
    });

    it('shows max limit tooltip when at capacity', () => {
      // Mock as at max capacity
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ['wave-1', 'wave-2', 'wave-3'],
        isOperationInProgress: mockIsOperationInProgress,
      });
      
      renderComponent();
      const tooltip = screen.getByTestId('tooltip-wave-header-pin-wave-123');
      expect(tooltip).toHaveTextContent('Max 3 pinned waves. Unpin another wave first.');
    });
  });

  describe('Visual States', () => {
    it('applies correct styles for unpinned state', () => {
      renderComponent();
      const button = screen.getByRole('button');
      const icon = button.querySelector('svg');
      
      expect(button).toHaveClass('tw-text-iron-500');
      expect(icon).not.toHaveClass('tw-rotate-[-45deg]');
    });

    it('applies correct styles for pinned state', () => {
      // Mock as pinned
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ['wave-123'],
        isOperationInProgress: mockIsOperationInProgress,
      });
      
      renderComponent();
      const button = screen.getByRole('button');
      const icon = button.querySelector('svg');
      
      expect(button).toHaveClass('tw-text-iron-200', 'tw-bg-iron-700');
      expect(icon).toHaveClass('tw-rotate-[-45deg]');
    });
  });
});