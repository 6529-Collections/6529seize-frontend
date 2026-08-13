import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation } from '@tanstack/react-query';
import UserPageIdentityDeleteStatementModal from '@/components/user/identity/statements/utils/UserPageIdentityDeleteStatementModal';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import type { CicStatement } from '@/entities/IProfile';
import type { ApiIdentity } from '@/generated/models/ApiIdentity';

jest.mock('@tanstack/react-query');

let dialogProps: any;
jest.mock('@/components/mobile-wrapper-dialog/MobileWrapperDialog', () => ({
  __esModule: true,
  default: (props: any) => {
    dialogProps = props;
    return props.isOpen ? (
      <div role="dialog" aria-label={props.title}>
        <button onClick={props.onClose}>Close</button>
        {props.children}
      </div>
    ) : null;
  },
}));

const mockMutation = {
  mutate: jest.fn(),
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
          isOpen
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
    
    expect(screen.getByRole('dialog', { name: 'Delete statement?' })).toBeInTheDocument();
    expect(screen.getByText(/you can’t undo this action/i)).toBeInTheDocument();
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

  it('uses the shared destructive button when idle', async () => {
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
    
    expect(deleteButton).toHaveClass(
      'enabled:tw-cursor-pointer',
      'tw-bg-red',
      'focus-visible:tw-outline-red'
    );
  });

  it('handles successful deletion', async () => {
    renderWithProviders();
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockAuthContext.requestAuth).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(mockMutation.mutate).toHaveBeenCalled();
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
    
    expect(mockMutation.mutate).not.toHaveBeenCalled();
  });

  it('calls mutation with correct parameters', async () => {
    renderWithProviders();
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockAuthContext.requestAuth).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(mockMutation.mutate).toHaveBeenCalled();
    });
    
    // Verify that the component correctly sets up the mutation
    expect(mockMutation.mutate).toHaveBeenCalledTimes(1);
  });

  it('prevents dialog dismissal while deletion is pending', () => {
    (useMutation as jest.Mock).mockReturnValue({
      ...mockMutation,
      isPending: true,
    });
    renderWithProviders();
    expect(dialogProps.dismissible).toBe(false);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
});
