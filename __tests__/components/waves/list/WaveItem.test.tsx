import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import WaveItem from '@/components/waves/list/WaveItem';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
  }),
}));

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
  beforeEach(() => {
    push.mockClear();
  });

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

  it('navigates when the card surface is clicked', () => {
    render(<WaveItem wave={wave} />);
    fireEvent.click(screen.getByLabelText('View wave My Wave'));
    expect(push).toHaveBeenCalledWith('/waves?wave=w1');
  });

  it('navigates when pressing Enter while the card is focused', () => {
    render(<WaveItem wave={wave} />);
    const card = screen.getByLabelText('View wave My Wave');
    card.focus();
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(push).toHaveBeenCalledWith('/waves?wave=w1');
  });

  it('navigates when pressing Space while the card is focused', () => {
    render(<WaveItem wave={wave} />);
    const card = screen.getByLabelText('View wave My Wave');
    card.focus();
    fireEvent.keyDown(card, { key: ' ' });
    expect(push).toHaveBeenCalledWith('/waves?wave=w1');
  });

  it('does not navigate when clicking on the follow button', () => {
    render(<WaveItem wave={wave} />);
    fireEvent.click(screen.getByTestId('follow'));
    expect(push).not.toHaveBeenCalled();
  });
});
