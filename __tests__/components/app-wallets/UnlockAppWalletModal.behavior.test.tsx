import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnlockAppWalletModal } from '@/components/app-wallets/AppWalletModal';

jest.mock('react-bootstrap', () => {
  const Modal = ({ show, children }: any) => (show ? <div data-testid="modal">{children}</div> : null);
  Modal.Header = ({ children }: any) => <div data-testid="modal-header">{children}</div>;
  Modal.Title = ({ children }: any) => <h1>{children}</h1>;
  Modal.Body = ({ children }: any) => <div data-testid="modal-body">{children}</div>;
  Modal.Footer = ({ children }: any) => <div data-testid="modal-footer">{children}</div>;
  
  return {
    Modal,
    Button: (props: any) => <button {...props} />,
  };
});

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (props: any) => <svg {...props} /> }));

jest.mock('@/components/app-wallets/AppWallet.module.scss', () => ({
  newWalletInput: 'newWalletInput',
  modalContent: 'modalContent',
}));

const decryptData = jest.fn();
const areEqualAddresses = jest.fn();

jest.mock('@/components/app-wallets/app-wallet-helpers', () => ({ decryptData: (...args: any[]) => decryptData(...args) }));
jest.mock('@/helpers/Helpers', () => ({ areEqualAddresses: (...args: any[]) => areEqualAddresses(...args) }));

jest.mock('@/components/auth/Auth', () => ({
  useAuth: () => ({ setToast: jest.fn() }),
}));

jest.mock('@/components/app-wallets/AppWalletsContext', () => ({
  useAppWallets: () => ({ setError: jest.fn() }),
}));

describe('UnlockAppWalletModal', () => {
  beforeEach(() => {
    decryptData.mockReset();
    areEqualAddresses.mockReset();
  });

  test('shows error when whitespace in password', async () => {
    const user = userEvent.setup();
    render(
      <UnlockAppWalletModal
        show
        address="0x1"
        address_hashed="enc"
        onUnlock={jest.fn()}
        onHide={jest.fn()}
      />
    );
    
    const input = screen.getByPlaceholderText('******');
    await user.type(input, 'bad pass');
    
    await waitFor(() => {
      expect(screen.getByText('Password must not contain any whitespace characters')).toBeInTheDocument();
    });
  }, 30000);

  test('calls onUnlock when password is correct', async () => {
    const user = userEvent.setup();
    decryptData.mockResolvedValue('0x1');
    areEqualAddresses.mockReturnValue(true);
    const onUnlock = jest.fn();
    const onHide = jest.fn();
    
    render(
      <UnlockAppWalletModal
        show
        address="0x1"
        address_hashed="enc"
        onUnlock={onUnlock}
        onHide={onHide}
      />
    );
    
    const input = screen.getByPlaceholderText('******');
    await user.type(input, 'secret');
    await user.click(screen.getByRole('button', { name: 'Unlock' }));
    
    await waitFor(() => {
      expect(decryptData).toHaveBeenCalledWith('0x1', 'enc', 'secret');
    });
    
    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalledWith('secret');
      expect(onHide).toHaveBeenCalled();
    });
  }, 30000);
});