import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import NextGenCollectionHeader, {
  NextGenBackToCollectionPageLink,
  NextGenCountdown,
} from '@/components/nextGen/collections/collectionParts/NextGenCollectionHeader';
import { fetchUrl } from '@/services/6529api';
import { usePathname } from 'next/navigation';
import {
  AllowlistType,
  type CollectionWithMerkle,
} from '@/components/nextGen/nextgen_entities';

jest.mock('@/services/6529api', () => ({ fetchUrl: jest.fn(() => Promise.resolve({})) }));
jest.mock('@/components/cookies/CookieConsentContext', () => ({ 
  useCookieConsent: jest.fn(() => ({
    showCookieConsent: false,
    country: 'US',
    consent: jest.fn(),
    reject: jest.fn()
  }))
}));

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/test/path'),
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
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(usePathname).mockReturnValue('/test/path');
  });

  it('renders back link text depending on path', () => {
    window.history.pushState({}, '', '/x/art');
    render(<NextGenBackToCollectionPageLink collection={collection} />);
    expect(screen.getByText('Back to collection page')).toBeInTheDocument();
  });

  it('shows countdown when mint window approaching', () => {
    render(<NextGenCollectionHeader collection={collection} show_links={false} collection_link={false} />);
    expect(screen.getByText(collection.name)).toBeInTheDocument();
    // countdown from allowlist_start should render
    expect(screen.getByText(/Allowlist Starting/)).toBeInTheDocument();
  });

  it('does not load the Merkle response after all mint phases complete', () => {
    const completedCollection = {
      ...collection,
      allowlist_start: 1,
      allowlist_end: 2,
      public_start: 3,
      public_end: 4,
    };

    render(<NextGenCountdown collection={completedCollection} />);

    expect(fetchUrl).not.toHaveBeenCalled();
  });

  it('loads the Merkle response when a mint countdown is visible', async () => {
    render(<NextGenCountdown collection={collection} />);

    await waitFor(() => expect(fetchUrl).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('button', { name: 'MINT' })).toBeInTheDocument();
  });

  it('keeps the burn-to-mint label for active external burn collections', async () => {
    jest.mocked(fetchUrl).mockResolvedValueOnce({
      collection_id: collection.id,
      merkle_root: collection.merkle_root,
      merkle_tree: [],
      al_type: AllowlistType.EXTERNAL_BURN,
      phase: 'allowlist',
      burn_collection: '',
      burn_collection_id: 0,
      min_token_index: 0,
      max_token_index: 0,
      burn_address: '',
      status: true,
    } satisfies CollectionWithMerkle);

    render(<NextGenCountdown collection={collection} />);

    expect(await screen.findByRole('button', { name: 'BURN TO MINT' })).toBeInTheDocument();
  });

  it('does not load the Merkle response on the mint route', () => {
    jest.mocked(usePathname).mockReturnValue('/nextgen/collection/my-collection/mint');

    render(<NextGenCountdown collection={collection} />);

    expect(fetchUrl).not.toHaveBeenCalled();
  });
});
