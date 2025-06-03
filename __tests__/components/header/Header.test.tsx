import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));
jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../components/header/user/HeaderUser', () => ({ __esModule: true, default: () => <div data-testid="user" /> }));
jest.mock('../../../components/header/notifications/HeaderNotifications', () => ({ __esModule: true, default: () => <div data-testid="notify" /> }));
jest.mock('../../../components/header/share/HeaderShare', () => ({ __esModule: true, default: () => <div data-testid="share" /> }));
jest.mock('../../../components/header/share/HeaderQRScanner', () => ({ __esModule: true, default: () => <div data-testid="qr" /> }));
jest.mock('../../../components/header/open-mobile/HeaderOpenMobile', () => ({ __esModule: true, default: () => <div data-testid="mobile" /> }));
jest.mock('../../../components/header/header-search/HeaderSearchButton', () => ({ __esModule: true, default: () => <div data-testid="search" /> }));

import Header from '../../../components/header/Header';
import styles from '../../../components/header/Header.module.scss';

jest.mock('../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));
jest.mock('../../../hooks/useCapacitor', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../components/app-wallets/AppWalletsContext', () => ({ useAppWallets: jest.fn() }));
jest.mock('../../../components/auth/Auth', () => ({ useAuth: jest.fn() }));
jest.mock('../../../hooks/isMobileScreen', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../services/6529api', () => ({ fetchUrl: jest.fn() }));
jest.mock('../../../components/cookies/CookieConsentContext', () => ({ 
  useCookieConsent: jest.fn(() => ({
    showCookieConsent: false,
    country: 'US',
    consent: jest.fn(),
    reject: jest.fn()
  }))
}));

const { useRouter } = require('next/router');
const { useSeizeConnectContext } = require('../../../components/auth/SeizeConnectContext');
const useCapacitor = require('../../../hooks/useCapacitor').default as jest.Mock;
const { useAppWallets } = require('../../../components/app-wallets/AppWalletsContext');
const { useAuth } = require('../../../components/auth/Auth');
const useIsMobileScreen = require('../../../hooks/isMobileScreen').default as jest.Mock;
const { fetchUrl } = require('../../../services/6529api');

function setup(options: any = {}) {
  (useSeizeConnectContext as jest.Mock).mockImplementation(() => ({
    address: options.address,
    seizeConnectOpen: options.seizeConnectOpen || false,
  }));
  useCapacitor.mockReturnValue({ isCapacitor: !!options.capacitor });
  (useAppWallets as jest.Mock).mockReturnValue({ appWalletsSupported: false });
  (useAuth as jest.Mock).mockReturnValue({ showWaves: true });
  useIsMobileScreen.mockReturnValue(!!options.mobile);
  (fetchUrl as jest.Mock).mockResolvedValue({ data: options.consolidations });
  (useRouter as jest.Mock).mockReturnValue({ route: '/', pathname: '/', push: jest.fn(), prefetch: jest.fn(), query: {} });
  const onLoad = jest.fn();
  const onSetWallets = jest.fn();
  const utils = render(<Header isSmall={options.isSmall} onLoad={onLoad} onSetWallets={onSetWallets} />);
  return { onLoad, onSetWallets, ...utils };
}

afterEach(() => jest.clearAllMocks());

describe('Header', () => {
  it('calls onLoad and applies small container class', async () => {
    const { onLoad, container } = setup({ isSmall: true });
    await waitFor(() => expect(onLoad).toHaveBeenCalled());
    expect(container.querySelector('.' + styles.mainContainerSmall)).toBeInTheDocument();
  });

  it('fetches consolidations and passes them to onSetWallets', async () => {
    const consolidations = ['0x1', '0x2'];
    const { onSetWallets } = setup({ address: '0xabc', consolidations });
    await waitFor(() => expect(onSetWallets).toHaveBeenCalledWith(consolidations));
    expect(fetchUrl).toHaveBeenCalledWith(`${process.env.API_ENDPOINT}/api/consolidations/0xabc`);
  });

  it('opens burger menu and closes when seize connect opens', async () => {
    const context: any = { address: '0xabc', seizeConnectOpen: false };
    (useSeizeConnectContext as jest.Mock).mockImplementation(() => context);
    useCapacitor.mockReturnValue({ isCapacitor: false });
    (useAppWallets as jest.Mock).mockReturnValue({ appWalletsSupported: false });
    (useAuth as jest.Mock).mockReturnValue({ showWaves: false });
    useIsMobileScreen.mockReturnValue(false);
    (fetchUrl as jest.Mock).mockResolvedValue({});

    const { container, rerender } = render(<Header />);
    const btn = screen.getByRole('button', { name: 'Menu' });
    fireEvent.click(btn);
    expect(container.querySelector('.' + styles.burgerMenuOpen)).toBeInTheDocument();

    context.seizeConnectOpen = true;
    rerender(<Header />);
    await waitFor(() => expect(container.querySelector('.' + styles.burgerMenuOpen)).not.toBeInTheDocument());
  });

  it('applies capacitor class when running in capacitor', () => {
    const { container } = setup({ capacitor: true });
    expect(container.querySelector('.' + styles.capacitorMainContainer)).toBeInTheDocument();
  });
});
