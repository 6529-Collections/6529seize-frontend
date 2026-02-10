import { render, screen } from '@testing-library/react';
import AppWalletCard from '@/components/app-wallets/AppWalletCard';

// Mock next/link to simply render an anchor
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

// Mock AppWalletAvatar to avoid image complexities
jest.mock('@/components/app-wallets/AppWalletAvatar', () => ({
  __esModule: true,
  default: ({ address }: any) => <div data-testid="avatar">{address}</div>,
}));

describe('AppWalletCard', () => {
  const wallet = {
    name: 'Test Wallet',
    created_at: 0,
    address: '0xABCDEF',
    address_hashed: '',
    mnemonic: '',
    private_key: '',
    imported: false,
  };

  it('renders wallet info and link', () => {
    render(<AppWalletCard wallet={wallet} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/tools/app-wallets/${wallet.address}`);
    expect(screen.getByText(wallet.name)).toBeInTheDocument();
    expect(screen.queryByText('(imported)')).not.toBeInTheDocument();
    expect(screen.getByTestId('avatar')).toHaveTextContent(wallet.address);
    expect(screen.getByText(wallet.address.toLowerCase())).toBeInTheDocument();
  });

  it('shows imported label when wallet is imported', () => {
    render(<AppWalletCard wallet={{ ...wallet, imported: true }} />);
    expect(screen.getByText('(imported)')).toBeInTheDocument();
  });
});
