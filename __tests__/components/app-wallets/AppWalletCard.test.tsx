import { render, screen } from '@testing-library/react';
import React from 'react';
import AppWalletCard from '../../../components/app-wallets/AppWalletCard';

jest.mock('../../../components/app-wallets/AppWalletAvatar', () => (props: any) => (
  <div data-testid="avatar" data-address={props.address} />
));

describe('AppWalletCard', () => {
  const wallet = { address: '0xABC', name: 'Main Wallet', imported: false } as any;

  it('renders wallet details and link', () => {
    render(<AppWalletCard wallet={wallet} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tools/app-wallets/0xABC');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-address', '0xABC');
    expect(screen.getByText('Main Wallet')).toBeInTheDocument();
    expect(screen.getByText('0xabc')).toBeInTheDocument();
  });

  it('shows imported label when wallet.imported is true', () => {
    render(<AppWalletCard wallet={{ ...(wallet as any), imported: true }} />);
    expect(screen.getByText('(imported)')).toBeInTheDocument();
  });
});
