import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppWallets from '../../../components/app-wallets/AppWallets';
import { useAppWallets } from '../../../components/app-wallets/AppWalletsContext';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));

jest.mock('../../../components/app-wallets/AppWalletsContext');
jest.mock('../../../components/app-wallets/AppWalletCard', () => (props: any) => <div data-testid="card">{props.wallet.address}</div>);
jest.mock('../../../components/app-wallets/AppWalletsUnsupported', () => () => <div data-testid="unsupported" />);
jest.mock('../../../components/app-wallets/AppWalletModal', () => ({ CreateAppWalletModal: (props: any) => <div data-testid="modal">{props.show ? 'open' : 'closed'}</div> }));

const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push });

const mockUseAppWallets = useAppWallets as jest.Mock;

function setup(value: any) {
  mockUseAppWallets.mockReturnValue(value);
  return render(<AppWallets />);
}

describe('AppWallets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows unsupported message when not supported', () => {
    setup({ appWalletsSupported: false, fetchingAppWallets: false, appWallets: [] });
    expect(screen.getByTestId('unsupported')).toBeInTheDocument();
  });

  it('shows loading state when fetching', () => {
    setup({ appWalletsSupported: true, fetchingAppWallets: true, appWallets: [] });
    expect(screen.getByText(/Fetching wallets/)).toBeInTheDocument();
  });

  it('shows no wallets message when list empty', () => {
    setup({ appWalletsSupported: true, fetchingAppWallets: false, appWallets: [] });
    expect(screen.getByText('No wallets found')).toBeInTheDocument();
  });

  it('renders wallets and handles buttons', async () => {
    const user = userEvent.setup();
    setup({ appWalletsSupported: true, fetchingAppWallets: false, appWallets: [{ address: '0x1' }] });
    expect(screen.getByTestId('card')).toHaveTextContent('0x1');
    expect(screen.getByTestId('modal')).toHaveTextContent('closed');
    await user.click(screen.getByRole('button', { name: /Create Wallet/i }));
    expect(screen.getByTestId('modal')).toHaveTextContent('open');
    await user.click(screen.getByRole('button', { name: /Import Wallet/i }));
    expect(push).toHaveBeenCalledWith('/tools/app-wallets/import-wallet');
  });
});
