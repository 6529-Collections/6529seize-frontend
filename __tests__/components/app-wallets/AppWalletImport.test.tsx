import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppWalletImport from '../../../components/app-wallets/AppWalletImport';
import { useRouter } from 'next/router';
import { useAppWallets } from '../../../components/app-wallets/AppWalletsContext';
import { useAuth } from '../../../components/auth/Auth';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../components/app-wallets/AppWalletsContext', () => ({ useAppWallets: jest.fn() }));
jest.mock('../../../components/auth/Auth', () => ({ useAuth: jest.fn() }));

jest.mock('../../../components/app-wallets/AppWalletsUnsupported', () => () => <div data-testid="unsupported" />);

let modalProps: any = {};
jest.mock('../../../components/app-wallets/AppWalletModal', () => ({
  CreateAppWalletModal: (props: any) => {
    modalProps = props;
    return props.show ? <div data-testid="modal" /> : null;
  },
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props: any) => <svg data-testid="icon" {...props} />,
}));

// Mock minimal ethers implementation
jest.mock('ethers', () => {
  const walletConstructor: any = jest.fn(function (this: any, pk: string) {
    this.privateKey = pk;
    this.address = '0x123';
  });
  walletConstructor.fromPhrase = jest.fn(() => ({
    address: '0x123',
    privateKey: 'fromPhrase',
  }));
  return { ethers: { Wallet: walletConstructor }, Wallet: walletConstructor };
});

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseAppWallets = useAppWallets as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  modalProps = {};
});

describe('AppWalletImport', () => {
  it('renders unsupported notice when wallets are not supported', () => {
    mockedUseAppWallets.mockReturnValue({ appWalletsSupported: false });
    render(<AppWalletImport />);
    expect(screen.getByTestId('unsupported')).toBeInTheDocument();
  });

  it('validates private key and navigates after import', async () => {
    const push = jest.fn();
    mockedUseRouter.mockReturnValue({ push });
    mockedUseAppWallets.mockReturnValue({ appWalletsSupported: true });
    mockedUseAuth.mockReturnValue({ setToast: jest.fn() });

    const user = userEvent.setup();
    render(<AppWalletImport />);

    await user.click(screen.getByRole('button', { name: /Private Key/i }));

    const input = screen.getByPlaceholderText(/private key/i);
    await user.type(input, '0xabc');
    await user.click(screen.getByRole('button', { name: /Validate/i }));

    await waitFor(() => expect(screen.getByText(/Private Key is Valid!/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Import Wallet/i }));
    expect(modalProps.show).toBe(true);

    await act(async () => {
      modalProps.onHide(true);
    });

    await waitFor(() => expect(push).toHaveBeenCalledWith('/tools/app-wallets'));
  });
});

