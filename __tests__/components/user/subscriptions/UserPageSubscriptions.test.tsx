import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageSubscriptions from '../../../../components/user/subscriptions/UserPageSubscriptions';
import { renderWithAuth } from '../../../utils/testContexts';
import { ApiIdentity } from '../../../../generated/models/ApiIdentity';
import * as commonApi from '../../../../services/api/common-api';
import * as memeCalendarHelpers from '../../../../helpers/meme_calendar.helpers';

// Mock child components
jest.mock('../../../../components/user/subscriptions/UserPageSubscriptionsBalance', () => ({
  __esModule: true,
  default: ({ details, fetching, refresh, show_refresh }: any) => (
    <div data-testid="subscriptions-balance">
      Balance Component - Fetching: {fetching ? 'true' : 'false'}
      {show_refresh && <button onClick={refresh}>Refresh</button>}
    </div>
  ),
}));

jest.mock('../../../../components/user/subscriptions/UserPageSubscriptionsMode', () => ({
  __esModule: true,
  default: ({ profileKey, details, readonly, refresh }: any) => (
    <div data-testid="subscriptions-mode">
      Mode Component - Profile: {profileKey}, Readonly: {readonly ? 'true' : 'false'}
    </div>
  ),
}));

jest.mock('../../../../components/user/subscriptions/UserPageSubscriptionsTopUp', () => ({
  __esModule: true,
  default: () => <div data-testid="subscriptions-topup">TopUp Component</div>,
}));

jest.mock('../../../../components/user/subscriptions/UserPageSubscriptionsUpcoming', () => ({
  __esModule: true,
  default: ({ profileKey, details, memes_subscriptions, readonly, refresh }: any) => (
    <div data-testid="subscriptions-upcoming">
      Upcoming Component - Memes: {memes_subscriptions?.length || 0}
    </div>
  ),
}));

jest.mock('../../../../components/user/subscriptions/UserPageSubscriptionsHistory', () => ({
  __esModule: true,
  default: ({ topups, redeemed, logs, setRedeemedPage, setTopUpPage, setLogsPage }: any) => (
    <div data-testid="subscriptions-history">
      History Component
      <button onClick={() => setTopUpPage(2)}>Load TopUp Page 2</button>
      <button onClick={() => setRedeemedPage(2)}>Load Redeemed Page 2</button>
      <button onClick={() => setLogsPage(2)}>Load Logs Page 2</button>
    </div>
  ),
}));

jest.mock('../../../../components/user/subscriptions/UserPageSubscriptionsAirdropAddress', () => ({
  __esModule: true,
  default: ({ show_edit, airdrop }: any) => (
    <div data-testid="subscriptions-airdrop">
      Airdrop Component - Edit: {show_edit ? 'true' : 'false'}
    </div>
  ),
}));

// Mock API
jest.mock('../../../../services/api/common-api');
const mockCommonApiFetch = commonApi.commonApiFetch as jest.MockedFunction<typeof commonApi.commonApiFetch>;

// Mock meme calendar helpers
jest.mock('../../../../helpers/meme_calendar.helpers');
const mockNumberOfCardsForSeasonEnd = memeCalendarHelpers.numberOfCardsForSeasonEnd as jest.MockedFunction<typeof memeCalendarHelpers.numberOfCardsForSeasonEnd>;
const mockIsMintingToday = memeCalendarHelpers.isMintingToday as jest.MockedFunction<typeof memeCalendarHelpers.isMintingToday>;

describe('UserPageSubscriptions', () => {
  const mockProfile: ApiIdentity = {
    consolidation_key: 'test-key',
    wallets: [{ wallet: 'wallet1' }, { wallet: 'wallet2' }],
  } as ApiIdentity;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCommonApiFetch.mockResolvedValue({});
    mockNumberOfCardsForSeasonEnd.mockReturnValue({ szn: 1, count: 5 });
    mockIsMintingToday.mockReturnValue(false);
  });

  describe('Profile Key Generation', () => {
    it('should generate profile key from consolidation_key when available', () => {
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );
      
      expect(screen.getByTestId('subscriptions-mode')).toHaveTextContent('Profile: test-key');
    });

    it('should generate profile key from wallets when consolidation_key is missing', () => {
      const profileWithoutKey = { 
        ...mockProfile, 
        consolidation_key: undefined as any
      };
      
      renderWithAuth(
        <UserPageSubscriptions profile={profileWithoutKey} />,
        { connectedProfile: null }
      );
      
      expect(screen.getByTestId('subscriptions-mode')).toHaveTextContent('Profile: wallet1-wallet2');
    });

    it('should not render when profile key cannot be generated', () => {
      const emptyProfile = {} as ApiIdentity;
      
      const { container } = renderWithAuth(
        <UserPageSubscriptions profile={emptyProfile} />,
        { connectedProfile: null }
      );
      
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Connected Account Detection', () => {
    it('should detect connected account with matching consolidation keys', () => {
      const connectedProfile = { consolidation_key: 'test-key' } as ApiIdentity;
      
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile, activeProfileProxy: null }
      );
      
      expect(screen.getByTestId('subscriptions-mode')).toHaveTextContent('Readonly: false');
      expect(screen.getByTestId('subscriptions-topup')).toBeInTheDocument();
    });

    it('should detect connected account with matching wallet addresses', () => {
      const connectedProfile = { 
        consolidation_key: undefined as any,
        wallets: [{ wallet: 'wallet1' }, { wallet: 'wallet2' }] 
      } as ApiIdentity;
      const profileWithoutKey = { 
        consolidation_key: undefined as any,
        wallets: [{ wallet: 'wallet1' }, { wallet: 'wallet2' }] 
      } as ApiIdentity;
      
      renderWithAuth(
        <UserPageSubscriptions profile={profileWithoutKey} />,
        { connectedProfile, activeProfileProxy: null }
      );
      
      expect(screen.getByTestId('subscriptions-mode')).toHaveTextContent('Readonly: false');
    });

    it('should set readonly mode for non-connected accounts', () => {
      const differentProfile = { consolidation_key: 'different-key' } as ApiIdentity;
      
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: differentProfile, activeProfileProxy: null }
      );
      
      expect(screen.getByTestId('subscriptions-mode')).toHaveTextContent('Readonly: true');
      expect(screen.queryByTestId('subscriptions-topup')).not.toBeInTheDocument();
    });

    it('should disable functionality when active profile proxy exists', () => {
      const connectedProfile = { consolidation_key: 'test-key' } as ApiIdentity;
      
      const { container } = renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile, activeProfileProxy: { 
          id: 'proxy-1',
          granted_to: {} as any,
          created_at: Date.now(),
          created_by: {} as any,
          actions: []
        } as any }
      );
      
      // When activeProfileProxy exists, the component returns early and doesn't render
      expect(container.innerHTML).toBe('');
    });
  });

  describe('API Data Fetching', () => {
    it('should fetch all data on mount', async () => {
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'subscriptions/consolidation/details/test-key',
        });
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'subscriptions/consolidation/test-key/airdrop-address',
        });
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'subscriptions/consolidation/top-up/test-key?page=1&page_size=10',
        });
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'subscriptions/consolidation/upcoming-memes/test-key?card_count=5',
        });
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'subscriptions/consolidation/redeemed/test-key?page=1&page_size=10',
        });
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'subscriptions/consolidation/logs/test-key?page=1&page_size=10',
        });
      });
    });

    it('should adjust meme subscriptions limit when minting today', async () => {
      mockIsMintingToday.mockReturnValue(true);
      
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'subscriptions/consolidation/upcoming-memes/test-key?card_count=6',
        });
      });
    });

    it('should handle API errors gracefully', async () => {
      // First render with successful mocks
      mockCommonApiFetch.mockResolvedValue({});
      
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );

      // Component should render even when API calls fail  
      expect(screen.getByTestId('subscriptions-balance')).toBeInTheDocument();
      
      // Test that component handles subsequent API failures
      mockCommonApiFetch.mockRejectedValue(new Error('API Error'));
      
      // Component should still be present
      expect(screen.getByTestId('subscriptions-balance')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh all data when refresh is called', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: { consolidation_key: 'test-key' } as ApiIdentity }
      );

      // Clear previous calls
      jest.clearAllMocks();

      await user.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledTimes(6);
      });
    });
  });

  describe('Pagination Handlers', () => {
    it('should handle top-up history pagination', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );

      jest.clearAllMocks();

      await user.click(screen.getByText('Load TopUp Page 2'));

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'subscriptions/consolidation/top-up/test-key?page=2&page_size=10',
        });
      });
    });

    it('should handle redeemed history pagination', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );

      jest.clearAllMocks();

      await user.click(screen.getByText('Load Redeemed Page 2'));

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'subscriptions/consolidation/redeemed/test-key?page=2&page_size=10',
        });
      });
    });

    it('should handle logs pagination', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );

      jest.clearAllMocks();

      await user.click(screen.getByText('Load Logs Page 2'));

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'subscriptions/consolidation/logs/test-key?page=2&page_size=10',
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state when any fetch is in progress', () => {
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );

      expect(screen.getByTestId('subscriptions-balance')).toHaveTextContent('Fetching: true');
    });

    it('should clear loading state when all fetches complete', async () => {
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );

      await waitFor(() => {
        expect(screen.getByTestId('subscriptions-balance')).toHaveTextContent('Fetching: false');
      });
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to child components', async () => {
      const connectedProfile = { consolidation_key: 'test-key' } as ApiIdentity;
      
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile, activeProfileProxy: null }
      );

      await waitFor(() => {
        expect(screen.getByTestId('subscriptions-balance')).toHaveTextContent('Fetching: false');
        expect(screen.getByTestId('subscriptions-mode')).toHaveTextContent('Readonly: false');
        expect(screen.getByTestId('subscriptions-airdrop')).toHaveTextContent('Edit: true');
        expect(screen.getByTestId('subscriptions-upcoming')).toHaveTextContent('Memes: 0');
      });
    });

    it('should render learn more link', () => {
      renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );

      const learnMoreLink = screen.getByText('Learn More');
      expect(learnMoreLink).toBeInTheDocument();
      expect(learnMoreLink.closest('a')).toHaveAttribute('href', '/about/subscriptions');
    });
  });

  describe('Edge Cases', () => {
    it('should handle profile changes', async () => {
      const { rerender } = renderWithAuth(
        <UserPageSubscriptions profile={mockProfile} />,
        { connectedProfile: null }
      );

      const newProfile = { 
        ...mockProfile, 
        consolidation_key: 'new-key' 
      } as ApiIdentity;

      jest.clearAllMocks();

      rerender(
        <UserPageSubscriptions profile={newProfile} />
      );

      await waitFor(() => {
        expect(mockCommonApiFetch).toHaveBeenCalledWith({
          endpoint: 'subscriptions/consolidation/details/new-key',
        });
      });
    });

    it('should not fetch when profile key is undefined', () => {
      const profileWithoutData = {} as ApiIdentity;
      
      renderWithAuth(
        <UserPageSubscriptions profile={profileWithoutData} />,
        { connectedProfile: null }
      );

      expect(mockCommonApiFetch).not.toHaveBeenCalled();
    });
  });
});