import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateAppWalletModal } from '@/components/app-wallets/AppWalletModal';

jest.mock('react-bootstrap', () => {
  const Modal = ({ show, children }: any) => (show ? <div data-testid="modal">{children}</div> : null);
  Modal.Header = ({ children }: any) => <div>{children}</div>;
  Modal.Title = ({ children }: any) => <h1>{children}</h1>;
  Modal.Body = ({ children }: any) => <div>{children}</div>;
  Modal.Footer = ({ children }: any) => <div>{children}</div>;
  return { Modal, Button: (props: any) => <button {...props}/> };
});

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg/> }));

jest.mock('@/components/app-wallets/AppWallet.module.scss', () => ({
  newWalletInput: 'input',
  modalHeader: 'header',
  modalContent: 'content'
}));

const createAppWallet = jest.fn();
const importAppWallet = jest.fn();
jest.mock('@/components/app-wallets/AppWalletsContext', () => ({
  useAppWallets: () => ({ createAppWallet: (...a:any[]) => createAppWallet(...a), importAppWallet: (...a:any[]) => importAppWallet(...a) })
}));

const setToast = jest.fn();
jest.mock('@/components/auth/Auth', () => ({ useAuth: () => ({ setToast }) }));

it('shows error for invalid wallet name', async () => {
  const onHide = jest.fn();
  const user = userEvent.setup();
  render(<CreateAppWalletModal show onHide={onHide} />);

  const input = screen.getByLabelText('Wallet Name');
  await user.type(input, 'Bad#');

  await waitFor(() => {
    expect(screen.getByText('Name can only contain alphanumeric characters and spaces')).toBeInTheDocument();
  });
});

it('shows error when password too short', async () => {
  createAppWallet.mockResolvedValue(true);
  const user = userEvent.setup();
  render(<CreateAppWalletModal show onHide={jest.fn()} />);
  await user.type(screen.getByLabelText('Wallet Name'), 'MyWallet');
  await user.type(screen.getByPlaceholderText('******'), '123');
  await user.click(screen.getByRole('button', { name: 'Create' }));
  expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
});

it('calls onHide on successful creation', async () => {
  createAppWallet.mockResolvedValue(true);
  const onHide = jest.fn();
  const user = userEvent.setup();
  render(<CreateAppWalletModal show onHide={onHide} />);
  await user.type(screen.getByLabelText('Wallet Name'), 'Wallet');
  await user.type(screen.getByPlaceholderText('******'), '123456');
  await user.click(screen.getByRole('button', { name: 'Create' }));
  await waitFor(() => expect(onHide).toHaveBeenCalledWith(true));
});
