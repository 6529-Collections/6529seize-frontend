import { render, screen } from '@testing-library/react';
import AppWalletAvatar from '../../../components/app-wallets/AppWalletAvatar';

// mock Next.js Image component to render plain img
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));

describe('AppWalletAvatar', () => {
  const address = '0x123';
  it('renders avatar with default size and robohash src', () => {
    render(<AppWalletAvatar address={address} />);
    const img = screen.getByRole('img', { name: address });
    expect(img).toHaveAttribute('src', `https://robohash.org/${address}.png`);
    expect(img).toHaveAttribute('height', '36');
    expect(img).toHaveAttribute('width', '36');
  });

  it('accepts custom size', () => {
    render(<AppWalletAvatar address={address} size={50} />);
    const img = screen.getByRole('img', { name: address });
    expect(img).toHaveAttribute('height', '50');
    expect(img).toHaveAttribute('width', '50');
  });
});
