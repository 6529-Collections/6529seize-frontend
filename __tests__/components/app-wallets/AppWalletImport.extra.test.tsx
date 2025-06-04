import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppWalletImport from '../../../components/app-wallets/AppWalletImport';
import { useAppWallets } from '../../../components/app-wallets/AppWalletsContext';
import { useAuth } from '../../../components/auth/Auth';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';

jest.mock('next/image', () => ({ __esModule: true, default: (props:any) => <img {...props} /> }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }:any) => <a href={href}>{children}</a> }));
const push = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ push }) }));
jest.mock('../../../hooks/useCapacitor', () => ({ __esModule: true, default: () => ({ isCapacitor: false }) }));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));
jest.mock('../../../components/app-wallets/AppWalletsContext');
jest.mock('../../../components/auth/Auth');
jest.mock('ethers', () => ({ ethers: { Wallet: jest.fn() } }));
jest.mock('../../../components/app-wallets/AppWalletModal', () => ({
  CreateAppWalletModal: (props:any) => <div data-testid="modal" onClick={() => props.onHide(true)}>{props.show ? 'open' : 'closed'}</div>
}));

const mockedUseAppWallets = useAppWallets as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const walletMock = ethers.Wallet as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseAuth.mockReturnValue({ setToast: jest.fn() });
  walletMock.mockReturnValue({ address: '0xabc', privateKey: '0x123' });
});

it('opens modal and redirects after import', async () => {
  mockedUseAppWallets.mockReturnValue({ appWalletsSupported: true });
  const user = userEvent.setup();
  render(<AppWalletImport />);
  await user.click(screen.getByRole('button', { name: /private key/i }));
  await user.type(screen.getByPlaceholderText(/private key/i), '0x123');
  await user.click(screen.getByRole('button', { name: /^validate$/i }));
  const importBtn = await screen.findByRole('button', { name: /import wallet/i });
  expect(screen.getByTestId('modal')).toHaveTextContent('closed');
  await user.click(importBtn);
  expect(screen.getByTestId('modal')).toHaveTextContent('open');
  await user.click(screen.getByTestId('modal'));
  expect(push).toHaveBeenCalledWith('/tools/app-wallets');
});
