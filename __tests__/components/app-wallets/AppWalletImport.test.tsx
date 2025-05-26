import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppWalletImport from '../../../components/app-wallets/AppWalletImport';
import { renderWithAuth } from '../../utils/testContexts';

jest.mock('../../../components/app-wallets/AppWalletsUnsupported', () => () => (
  <div data-testid="unsupported" />
));

jest.mock('../../../components/app-wallets/AppWalletsContext', () => ({
  useAppWallets: jest.fn(),
}));

jest.mock('../../../components/app-wallets/AppWalletModal', () => ({
  CreateAppWalletModal: (props: any) =>
    props.show ? (
      <div data-testid="modal">
        <button onClick={() => props.onHide(true)}>close</button>
      </div>
    ) : null,
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));


const { useAppWallets } = require('../../../components/app-wallets/AppWalletsContext');

function mockSupport(supported: boolean) {
  (useAppWallets as jest.Mock).mockReturnValue({ appWalletsSupported: supported });
}

describe('AppWalletImport', () => {
  it('renders unsupported message when wallets not supported', () => {
    mockSupport(false);
    renderWithAuth(<AppWalletImport />);
    expect(screen.getByTestId('unsupported')).toBeInTheDocument();
  });

  it('switches to private key input', async () => {
    mockSupport(true);
    const user = userEvent.setup();
    renderWithAuth(<AppWalletImport />);
    await user.click(screen.getByRole('button', { name: 'Private Key' }));
    expect(screen.getByPlaceholderText('private key')).toBeInTheDocument();
  });

  it('clears private key input', async () => {
    mockSupport(true);
    const user = userEvent.setup();
    renderWithAuth(<AppWalletImport />);
    await user.click(screen.getByRole('button', { name: 'Private Key' }));
    const input = screen.getByPlaceholderText('private key');
    await user.type(input, '0xabc');
    expect(input).toHaveValue('0xabc');
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(input).toHaveValue('');
  });
});
