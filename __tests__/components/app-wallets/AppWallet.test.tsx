import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppWalletComponent from '../../../components/app-wallets/AppWallet';
import { useRouter } from 'next/router';
import { useAppWallets } from '../../../components/app-wallets/AppWalletsContext';
import { useAuth } from '../../../components/auth/Auth';
import { useBalance, useChainId } from 'wagmi';
import { useSeizeConnectContext } from '../../../components/auth/SeizeConnectContext';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../components/app-wallets/AppWalletsContext', () => ({ useAppWallets: jest.fn() }));
jest.mock('../../../components/auth/Auth', () => ({ useAuth: jest.fn() }));
jest.mock('../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));
jest.mock('wagmi', () => ({ useBalance: jest.fn(), useChainId: jest.fn() }));

jest.mock('../../../components/dotLoader/DotLoader', () => ({ Spinner: () => <span data-testid="spinner" /> }));
jest.mock('../../../components/app-wallets/AppWalletModal', () => ({ UnlockAppWalletModal: () => <div data-testid="modal" /> }));
jest.mock('../../../components/app-wallets/AppWalletAvatar', () => () => <div data-testid="avatar" />);
jest.mock('../../../components/app-wallets/AppWalletsUnsupported', () => () => <div data-testid="unsupported" />);
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (props: any) => <svg data-testid="icon" onClick={props.onClick} /> }));
jest.mock('@tippyjs/react', () => (props: any) => <span>{props.children}</span>);

const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push });
(useChainId as jest.Mock).mockReturnValue(1);
(useBalance as jest.Mock).mockReturnValue({ isFetching: false, data: { value: BigInt(0), symbol: 'ETH' } });
(useSeizeConnectContext as jest.Mock).mockReturnValue({ address: '0xconnected' });
(useAuth as jest.Mock).mockReturnValue({ setToast: jest.fn() });

const sampleWallet = {
  name: 'Sample',
  address: '0xabc',
  address_hashed: 'hash',
  mnemonic: 'N/A',
  private_key: 'enc',
  imported: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AppWalletComponent', () => {
  it('shows loading state when fetching', () => {
    (useAppWallets as jest.Mock).mockReturnValue({
      appWalletsSupported: true,
      fetchingAppWallets: true,
      appWallets: [],
      deleteAppWallet: jest.fn(),
    });
    render(<AppWalletComponent address="0xabc" />);
    expect(screen.getByText(/Fetching wallet/i)).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('renders unsupported message when wallets are not supported', () => {
    (useAppWallets as jest.Mock).mockReturnValue({
      appWalletsSupported: false,
      fetchingAppWallets: false,
      appWallets: [],
      deleteAppWallet: jest.fn(),
    });
    render(<AppWalletComponent address="0xabc" />);
    expect(screen.getByTestId('unsupported')).toBeInTheDocument();
  });

  it('deletes wallet when confirmed', async () => {
    const deleteMock = jest.fn().mockResolvedValue(true);
    const toast = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ setToast: toast });
    (useAppWallets as jest.Mock).mockReturnValue({
      appWalletsSupported: true,
      fetchingAppWallets: false,
      appWallets: [sampleWallet],
      deleteAppWallet: deleteMock,
    });
    window.confirm = jest.fn(() => true);
    render(<AppWalletComponent address="0xabc" />);
    const btn = screen.getByRole('button', { name: /Delete/i });
    await userEvent.click(btn);
    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('0xabc'));
    expect(push).toHaveBeenCalledWith('/tools/app-wallets');
    expect(toast).toHaveBeenCalledWith({ message: "Wallet 'Sample' deleted successfully", type: 'success' });
  });
});
