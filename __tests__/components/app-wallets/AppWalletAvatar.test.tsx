import { render, screen } from '@testing-library/react';
import AppWalletAvatar from '../../../components/app-wallets/AppWalletAvatar';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

describe('AppWalletAvatar', () => {
  it('renders img with default size when no size prop is provided', () => {
    render(<AppWalletAvatar address="0xabc" />);
    const img = screen.getByRole('img', { name: '0xabc' });
    expect(img).toHaveAttribute('src', 'https://robohash.org/0xabc.png');
    expect(img).toHaveAttribute('width', '36');
    expect(img).toHaveAttribute('height', '36');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchPriority', 'high');
  });

  it('renders img with custom size', () => {
    render(<AppWalletAvatar address="0xdef" size={50} />);
    const img = screen.getByRole('img', { name: '0xdef' });
    expect(img).toHaveAttribute('width', '50');
    expect(img).toHaveAttribute('height', '50');
  });
});
