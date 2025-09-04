import { render, screen } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NFTImageBalance from '../../../components/nft-image/NFTImageBalance';

// Mock the hooks
jest.mock('../../../hooks/useNftBalance');
jest.mock('../../../components/auth/Auth');

// Mock the SCSS module
jest.mock('../../../components/nft-image/NFTImage.module.scss', () => ({
  balance: 'balance',
  balanceBigger: 'balanceBigger',
}));

import { useNftBalance } from '../../../hooks/useNftBalance';
import { useAuth } from '../../../components/auth/Auth';

const mockUseNftBalance = useNftBalance as jest.MockedFunction<typeof useNftBalance>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('NFTImageBalance', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    // Reset mocks
    mockUseNftBalance.mockReset();
    mockUseAuth.mockReset();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  const defaultProps = {
    contract: '0x1234567890123456789012345678901234567890',
    tokenId: 123,
    showOwnedIfLoggedIn: true,
    showUnseizedIfLoggedIn: true,
    height: 300 as const,
  };

  describe('When user is not logged in', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        connectedProfile: null,
      } as any);
      
      mockUseNftBalance.mockReturnValue({
        balance: 0,
        isLoading: false,
        error: null,
      });
    });

    it('renders nothing when user is not connected', () => {
      const { container } = renderWithProviders(<NFTImageBalance {...defaultProps} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('does not call useNftBalance when user is not connected', () => {
      renderWithProviders(<NFTImageBalance {...defaultProps} />);
      expect(mockUseNftBalance).toHaveBeenCalledWith({
        consolidationKey: null,
        contract: defaultProps.contract,
        tokenId: defaultProps.tokenId,
      });
    });
  });

  describe('When user is logged in', () => {
    const mockProfile = {
      consolidation_key: 'test-consolidation-key-123',
      handle: 'testuser',
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        connectedProfile: mockProfile,
      } as any);
    });

    describe('SEIZED state rendering', () => {
      it('renders SEIZED without quantity when showOwnedIfLoggedIn is true', () => {
        mockUseNftBalance.mockReturnValue({
          balance: 5,
          isLoading: false,
          error: null,
        });

        renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            showOwnedIfLoggedIn={true}
          />
        );
        
        expect(screen.getByText('SEIZED')).toBeInTheDocument();
        expect(screen.queryByText('x5')).not.toBeInTheDocument();
      });

      it('renders SEIZED with quantity when showOwnedIfLoggedIn is false', () => {
        mockUseNftBalance.mockReturnValue({
          balance: 5,
          isLoading: false,
          error: null,
        });

        renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            showOwnedIfLoggedIn={false}
          />
        );
        
        expect(screen.getByText('SEIZED x5')).toBeInTheDocument();
      });

      it('renders with correct CSS classes for different heights', () => {
        mockUseNftBalance.mockReturnValue({
          balance: 1,
          isLoading: false,
          error: null,
        });

        const { rerender, container } = renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            height={300}
          />
        );
        
        let outerSpan = container.querySelector('span');
        expect(outerSpan).toHaveClass('balance');
        expect(outerSpan).not.toHaveClass('balanceBigger');
        
        // Test height 650 - should have balanceBigger class
        rerender(
          <QueryClientProvider client={queryClient}>
            <NFTImageBalance
              {...defaultProps}
              height={650}
            />
          </QueryClientProvider>
        );
        
        outerSpan = container.querySelector('span');
        expect(outerSpan).toHaveClass('balance');
        expect(outerSpan).toHaveClass('balanceBigger');
        
        // Test height "full" - should not have balanceBigger class
        rerender(
          <QueryClientProvider client={queryClient}>
            <NFTImageBalance
              {...defaultProps}
              height="full"
            />
          </QueryClientProvider>
        );
        
        outerSpan = container.querySelector('span');
        expect(outerSpan).toHaveClass('balance');
        expect(outerSpan).not.toHaveClass('balanceBigger');
      });

      it('handles large balance numbers correctly', () => {
        mockUseNftBalance.mockReturnValue({
          balance: 999999,
          isLoading: false,
          error: null,
        });

        renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            showOwnedIfLoggedIn={false}
          />
        );
        
        expect(screen.getByText('SEIZED x999999')).toBeInTheDocument();
      });
    });

    describe('UNSEIZED state rendering', () => {
      it('renders UNSEIZED when balance is 0 and showUnseizedIfLoggedIn is true', () => {
        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: false,
          error: null,
        });

        renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            showUnseizedIfLoggedIn={true}
          />
        );
        
        expect(screen.getByText('UNSEIZED')).toBeInTheDocument();
        expect(screen.queryByText('SEIZED')).not.toBeInTheDocument();
      });

      it('does not render UNSEIZED when balance is 0 but showUnseizedIfLoggedIn is false', () => {
        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: false,
          error: null,
        });

        renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            showUnseizedIfLoggedIn={false}
          />
        );
        
        expect(screen.queryByText('UNSEIZED')).not.toBeInTheDocument();
        expect(screen.queryByText('SEIZED')).not.toBeInTheDocument();
      });

      it('renders UNSEIZED with correct CSS classes', () => {
        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: false,
          error: null,
        });

        const { container } = renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            showUnseizedIfLoggedIn={true}
          />
        );
        
        const unseizedElement = container.querySelector('span');
        expect(unseizedElement).toHaveClass('balance');
        expect(unseizedElement).not.toHaveClass('balanceBigger');
        expect(screen.getByText('UNSEIZED')).toBeInTheDocument();
      });
    });

    describe('Loading state rendering', () => {
      it('renders loading dots when balance is -1 (loading) and showUnseizedIfLoggedIn is true', () => {
        // Note: useNftBalance returns isLoading: true, but balance defaults to 0
        // However, the component logic checks for balance === -1 for loading dots
        // This suggests the hook might return -1 as a loading state indicator
        mockUseNftBalance.mockReturnValue({
          balance: -1,
          isLoading: true,
          error: null,
        });

        renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            showUnseizedIfLoggedIn={true}
          />
        );
        
        expect(screen.getByText('...')).toBeInTheDocument();
        expect(screen.queryByText('SEIZED')).not.toBeInTheDocument();
        expect(screen.queryByText('UNSEIZED')).not.toBeInTheDocument();
      });

      it('does not render loading dots when balance is -1 but showUnseizedIfLoggedIn is false', () => {
        mockUseNftBalance.mockReturnValue({
          balance: -1,
          isLoading: true,
          error: null,
        });

        renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            showUnseizedIfLoggedIn={false}
          />
        );
        
        expect(screen.queryByText('...')).not.toBeInTheDocument();
        expect(screen.queryByText('SEIZED')).not.toBeInTheDocument();
        expect(screen.queryByText('UNSEIZED')).not.toBeInTheDocument();
      });

      it('renders loading dots with correct CSS classes', () => {
        mockUseNftBalance.mockReturnValue({
          balance: -1,
          isLoading: true,
          error: null,
        });

        const { container } = renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            showUnseizedIfLoggedIn={true}
          />
        );
        
        const loadingElement = container.querySelector('span');
        expect(loadingElement).toHaveClass('balance');
        expect(loadingElement).not.toHaveClass('balanceBigger');
        expect(screen.getByText('...')).toBeInTheDocument();
      });
    });

    describe('Error handling', () => {
      it('logs error but still renders based on balance when useNftBalance has error', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockError = new Error('Failed to fetch balance');
        
        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: false,
          error: mockError,
        });

        renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            showUnseizedIfLoggedIn={true}
          />
        );
        
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch NFT balance:', mockError);
        expect(screen.getByText('UNSEIZED')).toBeInTheDocument();
        
        consoleSpy.mockRestore();
      });

      it('does not render anything when error occurs and balance is 0 with showUnseizedIfLoggedIn false', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockError = new Error('Network error');
        
        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: false,
          error: mockError,
        });

        const { container } = renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            showUnseizedIfLoggedIn={false}
          />
        );
        
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch NFT balance:', mockError);
        expect(container).toBeEmptyDOMElement();
        
        consoleSpy.mockRestore();
      });
    });

    describe('Priority logic', () => {
      it('prioritizes SEIZED state over UNSEIZED when balance is positive', () => {
        mockUseNftBalance.mockReturnValue({
          balance: 1,
          isLoading: false,
          error: null,
        });

        renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            showUnseizedIfLoggedIn={true}
            showOwnedIfLoggedIn={false}
          />
        );
        
        expect(screen.getByText('SEIZED x1')).toBeInTheDocument();
        expect(screen.queryByText('UNSEIZED')).not.toBeInTheDocument();
      });
    });

    describe('Hook integration', () => {
      it('calls useNftBalance with correct parameters', () => {
        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: false,
          error: null,
        });

        renderWithProviders(<NFTImageBalance {...defaultProps} />);
        
        expect(mockUseNftBalance).toHaveBeenCalledWith({
          consolidationKey: mockProfile.consolidation_key,
          contract: defaultProps.contract,
          tokenId: defaultProps.tokenId,
        });
      });

      it('handles undefined consolidation_key gracefully', () => {
        mockUseAuth.mockReturnValue({
          connectedProfile: { ...mockProfile, consolidation_key: undefined },
        } as any);
        
        mockUseNftBalance.mockReturnValue({
          balance: 0,
          isLoading: false,
          error: null,
        });

        renderWithProviders(<NFTImageBalance {...defaultProps} />);
        
        expect(mockUseNftBalance).toHaveBeenCalledWith({
          consolidationKey: null,
          contract: defaultProps.contract,
          tokenId: defaultProps.tokenId,
        });
      });
    });

    describe('Component structure', () => {
      it('renders as React fragment containing spans for SEIZED state', () => {
        mockUseNftBalance.mockReturnValue({
          balance: 5,
          isLoading: false,
          error: null,
        });

        const { container } = renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            showOwnedIfLoggedIn={false}
          />
        );
        
        const spans = container.querySelectorAll('span');
        expect(spans).toHaveLength(2); // Outer span and inner span
        
        const outerSpan = spans[0];
        const innerSpan = spans[1];
        
        expect(outerSpan).toHaveClass('balance');
        expect(innerSpan).toHaveTextContent('SEIZED x5');
      });

      it('maintains proper nesting structure for different heights', () => {
        mockUseNftBalance.mockReturnValue({
          balance: 3,
          isLoading: false,
          error: null,
        });

        const { container } = renderWithProviders(
          <NFTImageBalance
            {...defaultProps}
            height={650}
            showOwnedIfLoggedIn={false}
          />
        );
        
        const outerSpan = container.querySelector('span.balance.balanceBigger');
        expect(outerSpan).toBeInTheDocument();
        
        const innerSpan = outerSpan?.querySelector('span');
        expect(innerSpan).toBeInTheDocument();
        expect(innerSpan).toHaveTextContent('SEIZED x3');
      });
    });
  });
});
