import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NextGenTokenOnChain from '../../../../components/nextGen/collections/NextGenTokenOnChain';

// Mock react-bootstrap
jest.mock('react-bootstrap', () => ({
  Container: (props: any) => <div {...props} />,
  Row: (props: any) => <div {...props} />,
  Col: (props: any) => <div {...props} />,
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useReadContract: jest.fn(),
  useEnsName: jest.fn(),
}));

// Mock other components
jest.mock('../../../../components/dotLoader/DotLoader', () => () => <div data-testid="dot-loader">Loading...</div>);
jest.mock('../../../../components/address/Address', () => (props: any) => <div data-testid="address">{props.display || 'Address'}</div>);
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props: any) => <svg data-testid={props.icon.iconName} />,
}));
jest.mock('@tippyjs/react', () => ({
  __esModule: true,
  default: ({ children }: any) => <span data-testid="tippy">{children}</span>,
}));

// Mock hooks
jest.mock('../../../../hooks/useCapacitor', () => () => ({ platform: 'web' }));
jest.mock('../../../../components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: () => ({ address: '0x123' }),
}));
jest.mock('../../../../hooks/useIdentity', () => ({
  useIdentity: () => ({ profile: { handle: 'testuser' } }),
}));
jest.mock('../../../../components/cookies/CookieConsentContext', () => ({ 
  useCookieConsent: jest.fn(() => ({
    showCookieConsent: false,
    country: 'US',
    consent: jest.fn(),
    reject: jest.fn()
  }))
}));

// Mock helpers
jest.mock('../../../../helpers/Helpers', () => ({
  areEqualAddresses: jest.fn((a, b) => a?.toLowerCase() === b?.toLowerCase()),
}));

jest.mock('../../../../components/nextGen/nextgen_helpers', () => ({
  formatNameForUrl: jest.fn((name) => name.toLowerCase().replace(/\s+/g, '-')),
  getOpenseaLink: jest.fn(() => 'https://opensea.io/test'),
}));

// Mock global fetch
global.fetch = jest.fn();

const mockUseReadContract = require('wagmi').useReadContract as jest.Mock;
const mockUseEnsName = require('wagmi').useEnsName as jest.Mock;

const baseCollection = {
  id: 1,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  name: 'Test Collection',
  artist: 'Test Artist',
  description: 'Test Description',
  website: 'https://test.com',
  licence: 'CC0',
  base_uri: 'https://test.com/metadata/',
  library: 'test-library',
  dependency_script: '',
  image: 'https://test.com/image.png',
  banner: 'https://test.com/banner.png',
  distribution_plan: 'test-plan',
  artist_address: '0xartist',
  artist_signature: '0xsignature',
  max_purchases: 1,
  total_supply: 1000,
  final_supply_after_mint: 1000,
  mint_count: 0,
  on_chain: true,
  allowlist_start: 0,
  allowlist_end: 0,
  public_start: 0,
  public_end: 0,
  merkle_root: '0x',
  opensea_link: 'https://opensea.io/test',
};

const baseProps = {
  collection: baseCollection,
  token_id: 10000000001,
};

describe('NextGenTokenOnChain', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReadContract.mockReturnValue({ data: null });
    mockUseEnsName.mockReturnValue({ data: null });
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ image: 'https://example.com/image.png' }),
    });
  });

  it('shows token not found when data is undefined', () => {
    // When data is undefined, component considers it not found
    mockUseReadContract.mockReturnValue({ data: undefined });
    
    render(<NextGenTokenOnChain {...baseProps} />);
    
    expect(screen.getByText('Token Not Found')).toBeInTheDocument();
  });

  it('shows token not found when token data is null', () => {
    mockUseReadContract.mockReturnValue({ data: null });
    
    render(<NextGenTokenOnChain {...baseProps} />);
    
    expect(screen.getByText('Token Not Found')).toBeInTheDocument();
  });

  it('renders token information when data is available', async () => {
    // Mock token URI and owner data
    mockUseReadContract.mockImplementation(({ functionName }) => {
      if (functionName === 'tokenURI') {
        return { data: 'https://example.com/metadata.json' };
      }
      if (functionName === 'ownerOf') {
        return { data: '0xowner' };
      }
      return { data: null };
    });

    mockUseEnsName.mockReturnValue({ data: 'owner.eth' });

    render(<NextGenTokenOnChain {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByText('Test Collection #1')).toBeInTheDocument();
    });

    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('#10000000001')).toBeInTheDocument();
    expect(screen.getByText('Test Collection')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('calculates normalized token ID correctly', async () => {
    mockUseReadContract.mockImplementation(({ functionName }) => {
      if (functionName === 'tokenURI') {
        return { data: 'https://example.com/metadata.json' };
      }
      return { data: null };
    });

    render(<NextGenTokenOnChain {...baseProps} />);

    await waitFor(() => {
      // Token ID 10000000001 with collection ID 1 should normalize to 1
      expect(screen.getByText('Test Collection #1')).toBeInTheDocument();
    });
  });

  it('shows on-chain metadata status', async () => {
    mockUseReadContract.mockImplementation(({ functionName }) => {
      if (functionName === 'tokenURI') {
        return { data: 'https://example.com/metadata.json' };
      }
      return { data: null };
    });

    render(<NextGenTokenOnChain {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByText('On-Chain')).toBeInTheDocument();
    });
  });

  it('shows off-chain metadata status for off-chain collections', async () => {
    const offChainCollection = { ...baseCollection, on_chain: false };
    
    mockUseReadContract.mockImplementation(({ functionName }) => {
      if (functionName === 'tokenURI') {
        return { data: 'https://example.com/metadata.json' };
      }
      return { data: null };
    });

    render(<NextGenTokenOnChain collection={offChainCollection} token_id={baseProps.token_id} />);

    await waitFor(() => {
      expect(screen.getByText('Off-Chain')).toBeInTheDocument();
    });
  });

  it('shows owner as "you" when user owns the token', async () => {
    mockUseReadContract.mockImplementation(({ functionName }) => {
      if (functionName === 'tokenURI') {
        return { data: 'https://example.com/metadata.json' };
      }
      if (functionName === 'ownerOf') {
        return { data: '0x123' }; // Same as mocked user address
      }
      return { data: null };
    });

    render(<NextGenTokenOnChain {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByText('(you)')).toBeInTheDocument();
    });
  });

  it('shows marketplace links on non-iOS platforms', async () => {
    mockUseReadContract.mockImplementation(({ functionName }) => {
      if (functionName === 'tokenURI') {
        return { data: 'https://example.com/metadata.json' };
      }
      return { data: null };
    });

    render(<NextGenTokenOnChain {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByText('Marketplaces')).toBeInTheDocument();
      expect(screen.getByTestId('tippy')).toBeInTheDocument();
    });
  });

  it('fetches and displays token image from metadata', async () => {
    const metadataUrl = 'https://example.com/metadata.json';
    const imageUrl = 'https://example.com/image.png';

    mockUseReadContract.mockImplementation(({ functionName }) => {
      if (functionName === 'tokenURI') {
        return { data: metadataUrl };
      }
      return { data: null };
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ image: imageUrl }),
    });

    render(<NextGenTokenOnChain {...baseProps} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(metadataUrl);
    });

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      const tokenImage = images.find(img => img.getAttribute('alt') === 'Test Collection #1');
      expect(tokenImage).toHaveAttribute('src', imageUrl);
    });
  });

  it('shows external link icon for metadata', async () => {
    mockUseReadContract.mockImplementation(({ functionName }) => {
      if (functionName === 'tokenURI') {
        return { data: 'https://example.com/metadata.json' };
      }
      return { data: null };
    });

    render(<NextGenTokenOnChain {...baseProps} />);

    await waitFor(() => {
      // The FontAwesome icon should be rendered
      expect(screen.getByTestId('square-arrow-up-right')).toBeInTheDocument();
    });
  });
});