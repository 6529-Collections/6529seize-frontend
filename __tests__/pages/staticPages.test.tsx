import { render, screen } from '@testing-library/react';
import React from 'react';
import AboutRules from '../../pages/about/rules';
import CasaBatllo from '../../pages/casabatllo';
import Museum from '../../pages/museum';
import ElementColumns from '../../pages/element_category/columns';
import MemeLabDistribution from '../../pages/meme-lab/[id]/distribution';
import CryptoAdPunks from '../../pages/museum/6529-fund-szn1/cryptoad-punks';
import CryptoPunks from '../../pages/museum/6529-fund-szn1/cryptopunks';
import QueensKings from '../../pages/museum/6529-fund-szn1/queens-kings';
import AckBar from '../../pages/museum/ack-bar';
import EarlyNftArt from '../../pages/museum/early-nft-art';
import Autology from '../../pages/museum/genesis/autology';
import CryptoBlots from '../../pages/museum/genesis/cryptoblots';
import Dreams from '../../pages/museum/genesis/dreams';
import DynamicSlices from '../../pages/museum/genesis/dynamic-slices';
import Edifice from '../../pages/museum/genesis/edifice';
import ElevatedDeconstructions from '../../pages/museum/genesis/elevated-deconstructions';
import Ringers from '../../pages/museum/genesis/ringers';
import Screens from '../../pages/museum/genesis/screens';
import Skulptuur from '../../pages/museum/genesis/skulptuur';
import Synapses from '../../pages/museum/genesis/synapses';
import TheBlocksOfArt from '../../pages/museum/genesis/the-blocks-of-art';
import Vortex from '../../pages/museum/genesis/vortex';
import { getServerSideProps } from '../../pages/my-stream/notifications';
import OmIndex from '../../pages/om/OM';
import TheMemesPage from '../../pages/the-memes';
import { QueryKey } from '../../components/react-query-wrapper/ReactQueryWrapper';
import { getCommonHeaders } from '../../helpers/server.helpers';
import { prefetchAuthenticatedNotifications } from '../../helpers/stream.helpers';
import { Time } from '../../helpers/time';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);
jest.mock('../../helpers/server.helpers');
jest.mock('../../helpers/stream.helpers');

describe('static pages render', () => {
  it('renders about rules page', () => {
    render(<AboutRules />);
    expect(screen.getAllByText(/6529 FAM RULES/i).length).toBeGreaterThan(0);
  });

  it('renders casa batllo page', () => {
    render(<CasaBatllo />);
    expect(screen.getAllByText(/CASA BATLLO/i).length).toBeGreaterThan(0);
  });

  it('renders museum page', () => {
    render(<Museum />);
    expect(screen.getAllByText(/MUSEUM OF ART/i).length).toBeGreaterThan(0);
  });

  it('element columns page redirects', () => {
    render(<ElementColumns />);
    expect(screen.getByText(/You are being redirected/i)).toBeInTheDocument();
  });

  it('meme lab distribution page loads', () => {
    render(<MemeLabDistribution />);
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });

  const museumPages: Array<[string, JSX.Element, RegExp]> = [
    ['cryptoad punks page', <CryptoAdPunks />, /CRYPTOAD PUNKS/i],
    ['cryptopunks page', <CryptoPunks />, /CRYPTOPUNKS/i],
    ['queens and kings page', <QueensKings />, /QUEENS \+ KINGS/i],
    ['ack bar page', <AckBar />, /ACK BAR/i],
    ['early nft art page', <EarlyNftArt />, /EARLY NFT ART/i],
    ['autology page', <Autology />, /AUTOLOGY/i],
    ['cryptoblots page', <CryptoBlots />, /CRYPTOBLOTS/i],
    ['dreams page', <Dreams />, /DREAMS/i],
    ['dynamic slices page', <DynamicSlices />, /DYNAMIC SLICES/i],
    ['edifice page', <Edifice />, /EDIFICE/i],
    ['elevated deconstructions page', <ElevatedDeconstructions />, /ELEVATED DECONSTRUCTIONS/i],
    ['ringers page', <Ringers />, /RINGERS/i],
    ['screens page', <Screens />, /SCREENS/i],
    ['skulptuur page', <Skulptuur />, /SKULPTUUR/i],
    ['synapses page', <Synapses />, /SYNAPSES/i],
    ['the blocks of art page', <TheBlocksOfArt />, /THE BLOCKS OF ART/i],
    ['vortex page', <Vortex />, /VORTEX/i],
  ];

  it.each(museumPages)('renders %s', (_name, component, titleRegex) => {
    render(component);
    expect(screen.getAllByText(titleRegex).length).toBeGreaterThan(0);
  });

  it('redirects om index page', () => {
    render(<OmIndex />);
    expect(screen.getByText(/You are being redirected/i)).toBeInTheDocument();
  });

  it('renders the memes page', () => {
    render(<TheMemesPage />);
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });

  describe('notifications getServerSideProps', () => {
    const headers = { h: '1' } as any;
    const context = { req: { cookies: {} } } as unknown as any;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('prefetches when cookie is stale', async () => {
      context.req.cookies[QueryKey.IDENTITY_NOTIFICATIONS.toString()] = '0';
      (getCommonHeaders as jest.Mock).mockReturnValue(headers);
      const result = await getServerSideProps(context);
      expect(prefetchAuthenticatedNotifications as jest.Mock).toHaveBeenCalled();
      expect(result).toHaveProperty('props.metadata.title', 'Notifications | My Stream');
    });

    it('skips prefetch when cookie is recent', async () => {
      const now = Time.now().toMillis();
      context.req.cookies[QueryKey.IDENTITY_NOTIFICATIONS.toString()] = String(now);
      (getCommonHeaders as jest.Mock).mockReturnValue(headers);
      const result = await getServerSideProps(context);
      expect(prefetchAuthenticatedNotifications as jest.Mock).not.toHaveBeenCalled();
      expect(result).toHaveProperty('props.metadata.title', 'Notifications | My Stream');
    });
  });
});
