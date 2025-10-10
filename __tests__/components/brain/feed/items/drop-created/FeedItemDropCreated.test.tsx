import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FeedItemDropCreated from '@/components/brain/feed/items/drop-created/FeedItemDropCreated';

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
      <button onClick={() => onReplyClick(5)}>reply</button>
      <button onClick={() => onQuoteClick({ wave: { id: 'wave1' }, serial_no: 3 })}>quote</button>
    </div>
  ),
  DropLocation: { MY_STREAM: 'MY_STREAM' },
  DropSize: { FULL: 'FULL' }
}));

describe('FeedItemDropCreated', () => {
  const baseItem = {
    item: { wave: { id: 'wave1' } },
    serial_no: 2,
    type: 'DROP_CREATED'
  } as any;

  it('navigates to reply and quote targets', () => {
    render(
      <FeedItemDropCreated
        item={baseItem}
        showWaveInfo={false}
        activeDrop={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('reply'));
    expect(push).toHaveBeenCalledWith('/waves?wave=wave1&serialNo=5/');
    fireEvent.click(screen.getByText('quote'));
    expect(push).toHaveBeenCalledWith('/waves?wave=wave1&serialNo=3/');
  });
});
