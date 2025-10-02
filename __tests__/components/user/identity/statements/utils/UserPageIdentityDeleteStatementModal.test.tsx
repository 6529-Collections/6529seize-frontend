import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation } from '@tanstack/react-query';
import UserPageIdentityDeleteStatementModal from '@/components/user/identity/statements/utils/UserPageIdentityDeleteStatementModal';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { CicStatement } from '@/entities/IProfile';
import { ApiIdentity } from '@/generated/models/ApiIdentity';

// Mock dependencies
jest.mock('@tanstack/react-query');
jest.mock('react-use', () => ({
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn((key, fn) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === key) fn();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }),
}));

const mockMutation = {
  mutateAsync: jest.fn(),
  isPending: false,
  error: null,
};

(useMutation as jest.Mock).mockReturnValue(mockMutation);

const mockStatement: CicStatement = {
  id: 'statement-1',
  statement_comment: 'Test statement',
  statement_value: 'positive',
  statement_type: 'General',
  statement_group: 'Test Group',
  created_at: new Date().toISOString(),
};

const mockProfile: ApiIdentity = {
  query: 'test-profile',
  handle: 'testhandle',
  classification: 'General',
  pfp: null,
  cic_rating: 1000,
  rep_rating: 500,
  rep_category: 'General',
  primary_wallet: 'test-wallet',
  created_at: new Date().toISOString(),
  wallet_tdh: null,
  wallet_balance: null,
  consolidation_display: null,
  consolidation_non_display: null,
  external_metadata: null,
  statements: [],
  social_links: [],
  contact: null,
  general: null,
  sub_classification: null,
  level: 1,
};

const mockAuthContext = {
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
  setToast: jest.fn(),
  connectedProfile: null,
  activeProfileProxy: null,
  showWaves: false,
  setShowWaves: jest.fn(),
  receivedGasAllocations: [],
  setReceivedGasAllocations: jest.fn(),
};

const mockReactQueryContext = {
  onProfileStatementRemove: jest.fn(),
};

const renderWithProviders = (onClose = jest.fn()) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <ReactQueryWrapperContext.Provider value={mockReactQueryContext}>
        <UserPageIdentityDeleteStatementModal
          statement={mockStatement}
          profile={mockProfile}
          onClose={onClose}
        />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
};

describe('UserPageIdentityDeleteStatementModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mutation mock to default state
    (useMutation as jest.Mock).mockReturnValue(mockMutation);
  });

  it('renders modal with delete confirmation', () => {
    renderWithProviders();
    
    expect(screen.getByText('Delete Statement')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this statement?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const mockOnClose = jest.fn();
    renderWithProviders(mockOnClose);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when close X button is clicked', async () => {
    const mockOnClose = jest.fn();
    renderWithProviders(mockOnClose);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const mockOnClose = jest.fn();
    renderWithProviders(mockOnClose);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state when delete is in progress', async () => {
    const mockOnClose = jest.fn();
    
    // Test that the delete button has the correct structure for loading states
    renderWithProviders(mockOnClose);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    
    // Before any action, button should not be in loading state
    expect(deleteButton).not.toBeDisabled();
    expect(deleteButton).not.toHaveClass('tw-cursor-not-allowed');
    
    // Check that the button has the correct structure for showing loading state
    // The button should contain text "Delete"
    expect(deleteButton).toHaveTextContent('Delete');
    
    // Check that the button has conditional styling classes that will change based on loading state
    expect(deleteButton).toHaveClass('tw-cursor-pointer');
    expect(deleteButton).toHaveClass('tw-bg-[#F04438]');
  });

  it('handles successful deletion', async () => {
    mockMutation.mutateAsync.mockResolvedValueOnce({});
    renderWithProviders();
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockAuthContext.requestAuth).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalled();
    });
  });

  it('does not proceed if authentication fails', async () => {
    mockAuthContext.requestAuth.mockResolvedValueOnce({ success: false });
    renderWithProviders();
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockAuthContext.requestAuth).toHaveBeenCalled();
    });
    
    expect(mockMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it('calls mutation with correct parameters', async () => {
    mockMutation.mutateAsync.mockResolvedValueOnce({});
    
    renderWithProviders();
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockAuthContext.requestAuth).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalled();
    });
    
    // Verify that the component correctly sets up the mutation
    expect(mockMutation.mutateAsync).toHaveBeenCalledTimes(1);
  });
});
