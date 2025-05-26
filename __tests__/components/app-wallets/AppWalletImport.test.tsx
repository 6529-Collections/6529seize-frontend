import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppWalletImport from '../../../components/app-wallets/AppWalletImport';
import { useAppWallets } from '../../../components/app-wallets/AppWalletsContext';
import { useAuth } from '../../../components/auth/Auth';
import { ethers } from 'ethers';

jest.mock('../../../components/app-wallets/AppWalletsContext');
jest.mock('../../../components/auth/Auth');
jest.mock('../../../components/app-wallets/AppWalletModal', () => ({
  CreateAppWalletModal: () => <div data-testid="modal" />,
}));
jest.mock('../../../hooks/useCapacitor', () => () => ({ isCapacitor: false }));
jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const mockUseAppWallets = useAppWallets as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

describe('AppWalletImport', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ setToast: jest.fn() });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders unsupported message when wallets not supported', () => {
    mockUseAppWallets.mockReturnValue({ appWalletsSupported: false });
    render(<AppWalletImport />);
    expect(
      screen.getByText(/App Wallets are not supported on this platform/i)
    ).toBeInTheDocument();
  });

  it('allows switching between mnemonic and private key views', async () => {
    mockUseAppWallets.mockReturnValue({ appWalletsSupported: true });
    render(<AppWalletImport />);

    expect(screen.getAllByPlaceholderText(/word \d+/i)).toHaveLength(12);

    await userEvent.click(screen.getByRole('button', { name: /Private Key/i }));
    expect(screen.getByPlaceholderText(/private key/i)).toBeInTheDocument();
  });

  it('validates mnemonic and shows wallet info', async () => {
    mockUseAppWallets.mockReturnValue({ appWalletsSupported: true });
    const wallet = { address: '0xabc', privateKey: '0xpk' };
    jest.spyOn(ethers.Wallet, 'fromPhrase').mockReturnValue(wallet as any);

    render(<AppWalletImport />);
    const words = [
      'alpha','bravo','charlie','delta','echo','foxtrot',
      'golf','hotel','india','juliett','kilo','lima'
    ];
    for (let i = 0; i < words.length; i++) {
      const input = screen.getByPlaceholderText(`word ${i + 1}`);
      await userEvent.type(input, words[i]);
    }

    await userEvent.click(screen.getByRole('button', { name: /Validate/i }));

    await waitFor(() => {
      expect(screen.getByText(/Private Key is Valid!/i)).toBeInTheDocument();
    });
  });
});
