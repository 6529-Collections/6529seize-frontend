import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RememePage from '../../../components/rememes/RememePage';
import { CookieConsentProvider } from '../../../components/cookies/CookieConsentContext';

jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props}/> }));
jest.mock('../../../components/nft-image/RememeImage', () => ({ __esModule: true, default: () => <div data-testid='rememe-image'/> }));
jest.mock('../../../components/nft-image/NFTImage', () => ({ __esModule: true, default: () => <div data-testid='nft-image'/> }));
jest.mock('../../../components/address/Address', () => ({ __esModule: true, default: (props: any) => <span>{props.wallets[0]}</span> }));
jest.mock('../../../components/nothingHereYet/NothingHereYetSummer', () => ({ __esModule: true, default: () => <div>Nothing here yet</div> }));
jest.mock('../../../components/dotLoader/DotLoader', () => ({ __esModule: true, default: () => <div data-testid='loader'/> }));
jest.mock('../../../hooks/useCapacitor', () => ({ __esModule: true, default: () => ({ platform: 'web' }) }));
jest.mock('wagmi', () => ({ useEnsName: () => ({ data: 'bob.eth' }) }));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg/> }));

const fetchUrl = jest.fn();
const fetchAllPages = jest.fn();
jest.mock('../../../services/6529api', () => ({
  fetchUrl: (...args: any[]) => fetchUrl(...args),
  fetchAllPages: (...args: any[]) => fetchAllPages(...args)
}));

const rememe = {
  id: '1',
  meme_references: [],
  metadata: { name: 'Meme Name', description: 'desc' },
  contract: '0xabc',
  deployer: '0x1',
  added_by: '0x2',
  token_uri: 'uri',
  token_type: 'ERC721',
  replicas: [],
  contract_opensea_data: { collectionName: null, externalUrl: null, twitterUsername: null }
};

it('loads data and switches tabs', async () => {
  fetchUrl.mockResolvedValue({ data: [rememe] });
  fetchAllPages.mockResolvedValue([]);
  render(
    <CookieConsentProvider>
      <RememePage contract="c" id="1" />
    </CookieConsentProvider>
  );

  await waitFor(() => expect(fetchUrl).toHaveBeenCalled());
  // Name from metadata should render
  await screen.findByText('Meme Name');

  await userEvent.click(screen.getByText('Metadata'));
  expect(await screen.findByText('Token URI')).toBeInTheDocument();
});
