import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppWalletImport from '../../../components/app-wallets/AppWalletImport';
import { useAppWallets } from '../../../components/app-wallets/AppWalletsContext';
import { useAuth } from '../../../components/auth/Auth';
import { ethers } from 'ethers';

jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../../../hooks/useCapacitor', () => ({ __esModule: true, default: () => ({ isCapacitor: false }) }));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));
jest.mock('../../../components/app-wallets/AppWalletsContext');
jest.mock('../../../components/auth/Auth');
jest.mock('ethers', () => ({ ethers: { Wallet: jest.fn() } }));

const mockedUseAppWallets = useAppWallets as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const walletMock = ethers.Wallet as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseAuth.mockReturnValue({ setToast: jest.fn() });
  walletMock.mockReturnValue({ address: '0xabc', privateKey: '0x123' });
});

describe('AppWalletImport', () => {
  it('renders unsupported message when app wallets are not supported', () => {
    mockedUseAppWallets.mockReturnValue({ appWalletsSupported: false });
    render(<AppWalletImport />);
    expect(screen.getByText(/App Wallets are not supported on this platform/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /take me home/i })).toHaveAttribute('href', '/');
  });

  it('can switch between mnemonic and private key input', async () => {
    mockedUseAppWallets.mockReturnValue({ appWalletsSupported: true });
    const user = userEvent.setup();
    render(<AppWalletImport />);
    expect(screen.getByPlaceholderText('word 1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /private key/i }));
    expect(screen.getByPlaceholderText(/private key/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /mnemonic/i }));
    expect(screen.getByPlaceholderText('word 1')).toBeInTheDocument();
  });

  it('shows error when validating invalid private key', async () => {
    mockedUseAppWallets.mockReturnValue({ appWalletsSupported: true });
    walletMock.mockImplementationOnce(() => { throw new Error('invalid'); });
    const user = userEvent.setup();
    render(<AppWalletImport />);
    await user.click(screen.getByRole('button', { name: /private key/i }));
    await user.type(screen.getByPlaceholderText(/private key/i), 'badkey');
    await user.click(screen.getByRole('button', { name: /^validate$/i }));
    expect(screen.getByText(/Error: invalid/i)).toBeInTheDocument();
  });
});
