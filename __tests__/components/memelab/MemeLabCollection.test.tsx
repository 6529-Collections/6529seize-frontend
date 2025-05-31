import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import LabCollection from '../../../components/memelab/MemeLabCollection';
import { useRouter } from 'next/router';
import { fetchAllPages } from '../../../services/6529api';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../services/6529api', () => ({ fetchAllPages: jest.fn() }));

jest.mock('../../../components/nft-image/NFTImage', () => (props: any) => <div data-testid={`nft-${props.nft.id}`}>{props.nft.name}</div>);
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (props: any) => <svg data-testid="icon" onClick={props.onClick} /> }));
jest.mock('../../../components/nothingHereYet/NothingHereYetSummer', () => () => <div data-testid="nothing" />);

const routerReplace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ isReady: true, query: { collection: 'cool-collection' }, replace: routerReplace });
  process.env.API_ENDPOINT = 'https://api.test';
});

function renderComponent() {
  return render(
    <AuthContext.Provider value={{ connectedProfile: null } as any}>
      <LabCollection wallets={[]} />
    </AuthContext.Provider>
  );
}

describe('MemeLabCollection', () => {
  it('renders nft data and website links', async () => {
    (fetchAllPages as jest.Mock)
      .mockResolvedValueOnce([{ id: 1, website: 'example.com', name: 'meta' }])
      .mockResolvedValueOnce([{ id: 1, contract: '0x', name: 'NFT', artist: 'artist' }]);
    renderComponent();
    await waitFor(() => expect(fetchAllPages).toHaveBeenCalledTimes(2));
    expect(screen.getByText('cool collection')).toBeInTheDocument();
    expect(screen.getByTestId('nft-1')).toHaveTextContent('NFT');
    expect(screen.getByRole('link', { name: 'example.com' })).toHaveAttribute('href', 'https://example.com');
  });

  it('shows placeholder when no nfts', async () => {
    (fetchAllPages as jest.Mock).mockResolvedValueOnce([]);
    renderComponent();
    await waitFor(() => expect(fetchAllPages).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('nothing')).toBeInTheDocument();
  });
});
