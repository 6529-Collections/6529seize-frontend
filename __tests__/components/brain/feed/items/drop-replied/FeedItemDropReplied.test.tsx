import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FeedItemDropReplied from '../../../../../../components/brain/feed/items/drop-replied/FeedItemDropReplied';

const push = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ push }) }));

jest.mock('../../../../../../components/waves/drops/Drop', () => ({
  __esModule: true,
  default: ({ onReplyClick, onQuoteClick }: any) => (
    <div>
      <button onClick={() => onReplyClick(1)}>reply</button>
      <button onClick={() => onQuoteClick({ wave: { id: 'w2' }, serial_no: 8 })}>quote</button>
    </div>
  ),
  DropLocation: { MY_STREAM: 'MY_STREAM' },
  DropSize: { FULL: 'FULL' }
}));

describe('FeedItemDropReplied', () => {
  const baseItem = {
    item: { reply: { wave: { id: 'w1' } } }
  } as any;

  it('navigates to reply and quote targets', () => {
    render(
      <FeedItemDropReplied
        item={baseItem}
        showWaveInfo={false}
        activeDrop={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('reply'));
    expect(push).toHaveBeenCalledWith('/my-stream?wave=w1&serialNo=1/');
    fireEvent.click(screen.getByText('quote'));
    expect(push).toHaveBeenCalledWith('/my-stream?wave=w2&serialNo=8/');
  });
});
