import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import AppWallet from '../../../components/app-wallets/AppWallet';
import { useAppWallets } from '../../../components/app-wallets/AppWalletsContext';
import { useBalance, useChainId } from 'wagmi';
import { useRouter } from 'next/router';
import { useAuth } from '../../../components/auth/Auth';
import { useSeizeConnectContext } from '../../../components/auth/SeizeConnectContext';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('wagmi');
jest.mock('../../../components/app-wallets/AppWalletsContext');
jest.mock('../../../components/auth/Auth', () => ({ useAuth: jest.fn() }));
jest.mock('../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));
jest.mock('../../../components/dotLoader/DotLoader', () => ({ __esModule: true, default: () => <div data-testid="loader" />, Spinner: () => <div data-testid="spinner" /> }));
jest.mock('../../../components/app-wallets/AppWalletAvatar', () => ({ __esModule: true, default: ({ address }: any) => <div data-testid="avatar">{address}</div> }));
jest.mock('../../../components/app-wallets/AppWalletsUnsupported', () => ({ __esModule: true, default: () => <div data-testid="unsupported" /> }));
jest.mock('../../../components/app-wallets/AppWalletModal', () => ({ UnlockAppWalletModal: () => <div data-testid="unlock" /> }));
jest.mock('../../../helpers/Helpers', () => ({
  areEqualAddresses: (a: string, b: string) => a.toLowerCase() === b.toLowerCase(),
  fromGWEI: (n: number) => n,
  getAddressEtherscanLink: jest.fn(() => 'link')
}));

const mockUseAppWallets = useAppWallets as jest.Mock;
const mockUseBalance = useBalance as jest.Mock;
const mockUseChainId = useChainId as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;
const mockUseConnect = useSeizeConnectContext as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: jest.fn() });
  mockUseChainId.mockReturnValue(1);
  mockUseAuth.mockReturnValue({ setToast: jest.fn() });
  mockUseConnect.mockReturnValue({ address: '0xabc' });
});

describe('AppWallet component', () => {
  it('shows loading spinner when fetching', () => {
    mockUseAppWallets.mockReturnValue({ fetchingAppWallets: true, appWalletsSupported: true, appWallets: [] });
    render(<AppWallet address="0x1" />);
    expect(screen.getByText(/Fetching wallet/)).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('shows unsupported message when not supported', () => {
    mockUseAppWallets.mockReturnValue({ fetchingAppWallets: false, appWalletsSupported: false, appWallets: [] });
    render(<AppWallet address="0x1" />);
    expect(screen.getByTestId('unsupported')).toBeInTheDocument();
  });

  it('shows not found message when wallet missing', () => {
    mockUseAppWallets.mockReturnValue({ fetchingAppWallets: false, appWalletsSupported: true, appWallets: [] });
    render(<AppWallet address="0x1" />);
    expect(screen.getByText(/Wallet with address/)).toBeInTheDocument();
  });

  it('renders wallet info and balance loader', () => {
    mockUseAppWallets.mockReturnValue({
      fetchingAppWallets: false,
      appWalletsSupported: true,
      appWallets: [{ name: 'Wallet', address: '0x1', address_hashed: '', mnemonic: 'N/A', private_key: '0x', imported: false }]
    });
    mockUseBalance.mockReturnValue({ isFetching: true });
    render(<AppWallet address="0x1" />);
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('deletes wallet when confirmed', async () => {
    const deleteMock = jest.fn().mockResolvedValue(true);
    const push = jest.fn();
    const setToast = jest.fn();
    mockUseAppWallets.mockReturnValue({
      fetchingAppWallets: false,
      appWalletsSupported: true,
      appWallets: [{ name: 'Wallet', address: '0x1', address_hashed: '', mnemonic: 'N/A', private_key: '0x', imported: false }],
      deleteAppWallet: deleteMock
    });
    mockUseBalance.mockReturnValue({ isFetching: false, data: { value: BigInt(0), symbol: 'ETH' } });
    mockUseRouter.mockReturnValue({ push });
    mockUseAuth.mockReturnValue({ setToast });
    window.confirm = jest.fn(() => true);
    const user = userEvent.setup();
    render(<AppWallet address="0x1" />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(deleteMock).toHaveBeenCalledWith('0x1');
    expect(push).toHaveBeenCalledWith('/tools/app-wallets');
    expect(setToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });
});

