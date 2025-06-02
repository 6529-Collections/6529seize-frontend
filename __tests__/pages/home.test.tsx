import React from 'react';
import { render, screen } from '@testing-library/react';
import Home, { getServerSideProps } from '../../pages/index';
import { AuthContext } from '../../components/auth/Auth';
import { commonApiFetch } from '../../services/api/common-api';
import { getCommonHeaders } from '../../helpers/server.helpers';
import { CookieConsentProvider } from '../../components/cookies/CookieConsentContext';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);
jest.mock('next/image', () => ({ __esModule: true, default: (p:any) => <img {...p} /> }));
jest.mock('../../components/nextGen/collections/collectionParts/NextGenCollectionSlideshow', () => () => <div data-testid="slideshow" />);
jest.mock('../../services/api/common-api');
jest.mock('../../helpers/server.helpers');
jest.mock('../../hooks/useCapacitor', () => ({ __esModule: true, default: jest.fn(() => ({ platform: 'web' })) }));

const mockNft = {
  id: 1,
  name: 'Mock NFT',
  contract: '0x1',
  collection: 'COL',
  season: 1,
  meme_name: 'Meme',
  artist: 'Artist',
  mint_date: '2020-01-01',
  metadata: { image_details: { format: 'png', width: 1, height: 1 } }
} as any;
const mockCollection = { name: 'Collection' } as any;

const TestProvider: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <CookieConsentProvider>
    <AuthContext.Provider value={{ setTitle: jest.fn(), connectedProfile: null } as any}>
      {children}
    </AuthContext.Provider>
  </CookieConsentProvider>
);

describe('Home page', () => {
  it('renders main sections', () => {
    render(
      <TestProvider>
        <Home pageProps={{ nft: mockNft, nextGenFeatured: mockCollection }} />
      </TestProvider>
    );
    expect(screen.getByText(/Latest/i)).toBeInTheDocument();
    expect(screen.getByText(/Drop/i)).toBeInTheDocument();
    expect(screen.getByText(`Card ${mockNft.id} - ${mockNft.name}`)).toBeInTheDocument();
    expect(screen.getByText(/Discover/i)).toBeInTheDocument();
  });
});

describe('Home getServerSideProps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCommonHeaders as jest.Mock).mockReturnValue({});
  });

  it('returns props on success', async () => {
    (commonApiFetch as jest.Mock)
      .mockResolvedValueOnce(mockNft)
      .mockResolvedValueOnce(mockCollection);
    const result = await getServerSideProps({} as any, null as any, null as any);
    expect(result).toEqual({ props: { nft: mockNft, nextGenFeatured: mockCollection } });
    expect(commonApiFetch).toHaveBeenCalledTimes(2);
  });

  it('redirects to 404 on error', async () => {
    (commonApiFetch as jest.Mock).mockRejectedValue(new Error('fail'));
    const result = await getServerSideProps({} as any, null as any, null as any);
    expect(result).toEqual({ redirect: { permanent: false, destination: '/404' }, props: {} });
  });
});
