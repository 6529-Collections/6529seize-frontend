import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import WaveItem from '@/components/waves/list/WaveItem';

jest.mock('@/components/waves/list/WaveItemDropped', () => () => <a data-testid="dropped" href="#dropped">Dropped</a>);
jest.mock('@/components/waves/list/WaveItemFollow', () => () => (
  <button data-testid="follow" type="button">
    Follow
  </button>
));

const wave = {
  id: 'w1',
  name: 'My Wave',
  picture: 'pic.jpg',
  metrics: { subscribers_count: 10 },
  author: {
    handle: 'alice',
    pfp: 'pfp.jpg',
    level: 85,
    banner1_color: '#000',
    banner2_color: '#111',
  },
  chat: { scope: { group: { is_direct_message: false } } },
} as any;

describe('WaveItem', () => {
  it('renders wave data', () => {
    render(<WaveItem wave={wave} />);
    expect(screen.getByText('My Wave')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByTestId('dropped')).toBeInTheDocument();
    expect(screen.getByTestId('follow')).toBeInTheDocument();
  });

  it('renders placeholders when no wave', () => {
    render(<WaveItem userPlaceholder="user" titlePlaceholder="title" />);
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('exposes the card surface as an anchor element', () => {
    render(<WaveItem wave={wave} />);
    const card = screen.getByRole('link', { name: 'View wave My Wave' });
    expect(card.tagName).toBe('A');
    expect(card).toHaveAttribute('href', '/waves?wave=w1');
    const clickHandler = jest.fn();
    card.addEventListener('click', clickHandler);
    fireEvent.click(card);
    expect(clickHandler).toHaveBeenCalled();
  });

  it('does not navigate when clicking on the follow button', () => {
    render(<WaveItem wave={wave} />);
    const card = screen.getByRole('link', { name: 'View wave My Wave' });
    const clickHandler = jest.fn();
    card.addEventListener('click', clickHandler);
    fireEvent.click(screen.getByTestId('follow'));
    expect(clickHandler).not.toHaveBeenCalled();
  });
});
