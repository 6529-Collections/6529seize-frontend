import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FeedItemWaveCreated from '@/components/brain/feed/items/wave-created/FeedItemWaveCreated';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/components/waves/drops/Drop', () => ({
  __esModule: true,
  default: ({ onReplyClick, onQuoteClick }: any) => (
    <div>
      <button onClick={() => onReplyClick(42)}>reply</button>
      <button onClick={() => onQuoteClick({ wave: { id: 'w' }, serial_no: 7 })}>quote</button>
    </div>
  ),
  DropLocation: { MY_STREAM: 'MY_STREAM' },
}));

describe('FeedItemWaveCreated', () => {
  const baseItem = {
    item: {
      id: 'w',
      author: { handle: 'user' },
      description_drop: { id: 'd' },
    },
    serial_no: 1,
    type: 'WAVE_CREATED',
  } as any;

  it('renders author handle and calls router on interactions', () => {
    render(
      <FeedItemWaveCreated
        item={baseItem}
        showWaveInfo={false}
        activeDrop={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
      />
    );
    expect(screen.getByText(/user/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('reply'));
    expect(push).toHaveBeenCalledWith('/waves?wave=w&serialNo=42/', { scroll: false });
    fireEvent.click(screen.getByText('quote'));
    expect(push).toHaveBeenCalledWith('/waves?wave=w&serialNo=7/', { scroll: false });
  });
});
