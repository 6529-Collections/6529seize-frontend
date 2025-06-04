import { render, screen } from '@testing-library/react';
import React from 'react';
import NextGenCollectionHeader, {
  NextGenBackToCollectionPageLink,
} from '../../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader';

jest.mock('../../../../../services/6529api', () => ({ fetchUrl: jest.fn(() => Promise.resolve({})) }));
jest.mock('../../../../../components/cookies/CookieConsentContext', () => ({ 
  useCookieConsent: jest.fn(() => ({
    showCookieConsent: false,
    country: 'US',
    consent: jest.fn(),
    reject: jest.fn()
  }))
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    query: {},
    asPath: '',
    route: '',
    pathname: '/test/path',
  })),
}));

// Mock WagmiProvider and related hooks
jest.mock('wagmi', () => ({
  useReadContract: jest.fn(() => ({
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: jest.fn(),
  })),
  useConfig: jest.fn(() => ({})),
}));

const collection: any = {
  id: 1,
  name: 'My Collection',
  artist: 'Artist',
  artist_address: 'artist',
  mint_count: 0,
  total_supply: 10,
  allowlist_start: Math.floor(Date.now()/1000) + 3600,
  allowlist_end: Math.floor(Date.now()/1000) + 7200,
  public_start: Math.floor(Date.now()/1000) + 10000,
  public_end: Math.floor(Date.now()/1000) + 20000,
  image: '',
  banner: '',
  distribution_plan: '',
  website: '',
  licence: '',
  base_uri: '',
  library: '',
  dependency_script: '',
  artist_signature: '',
  final_supply_after_mint: 10,
  on_chain: false,
  merkle_root: 'root',
  opensea_link: '',
  description: ''
};

describe('NextGenCollectionHeader', () => {
  it('renders back link text depending on path', () => {
    Object.defineProperty(window, 'location', { value: { pathname: '/x/art' }, writable: true });
    render(<NextGenBackToCollectionPageLink collection={collection} />);
    expect(screen.getByText('Back to collection page')).toBeInTheDocument();
  });

  it('shows countdown when mint window approaching', () => {
    render(<NextGenCollectionHeader collection={collection} show_links={false} collection_link={false} />);
    expect(screen.getByText(collection.name)).toBeInTheDocument();
    // countdown from allowlist_start should render
    expect(screen.getByText(/Allowlist Starting/)).toBeInTheDocument();
  });
});
