import React from 'react';
import { render } from '@testing-library/react';
import WaveDrop from '../../../../components/waves/drops/WaveDrop';
import useIsMobileDevice from '../../../../hooks/isMobileDevice';

jest.mock('../../../../components/waves/drops/WaveDropActions', () => (props: any) => <div data-testid="actions" />);
jest.mock('../../../../components/waves/drops/WaveDropReply', () => () => <div data-testid="reply" />);
jest.mock('../../../../components/waves/drops/WaveDropContent', () => () => <div data-testid="content" />);
jest.mock('../../../../components/waves/drops/WaveDropHeader', () => () => <div data-testid="header" />);
jest.mock('../../../../components/waves/drops/WaveDropAuthorPfp', () => () => <div data-testid="pfp" />);
jest.mock('../../../../components/waves/drops/WaveDropMetadata', () => () => <div data-testid="meta" />);
jest.mock('../../../../components/waves/drops/WaveDropRatings', () => () => <div data-testid="ratings" />);
jest.mock('../../../../components/waves/drops/WaveDropMobileMenu', () => () => <div data-testid="mobile" />);

jest.mock('../../../../hooks/isMobileDevice');

const isMobileMock = useIsMobileDevice as jest.Mock;

const drop: any = {
  id: '1',
  serial_no: 1,
  drop_type: 'Chat',
  rank: null,
  wave: { id: 'w1' },
  reply_to: null,
  author: { handle: 'alice' },
  created_at: 0,
  updated_at: null,
  title: null,
  parts: [{ part_id: 1, content: 'c', media: [], quoted_drop: null, replies_count:0, quotes_count:0 }],
  parts_count: 1,
  referenced_nfts: [],
  mentioned_users: [],
  metadata: [],
  rating: 0,
  realtime_rating: 0,
  rating_prediction: 0,
  top_raters: [],
  raters_count: 0,
  context_profile_context: null,
  subscribed_actions: [],
  is_signed: false,
  type: 'FULL',
  stableKey: '',
  stableHash: ''
};

describe('WaveDrop', () => {
  it('shows actions on desktop', () => {
    isMobileMock.mockReturnValue(false);
    const { getByTestId } = render(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );
    expect(getByTestId('actions')).toBeInTheDocument();
  });

  it('hides actions on mobile', () => {
    isMobileMock.mockReturnValue(true);
    const { queryByTestId } = render(
      <WaveDrop
        drop={drop}
        previousDrop={null}
        nextDrop={null}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={true}
        location={0 as any}
        dropViewDropId={null}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );
    expect(queryByTestId('actions')).not.toBeInTheDocument();
  });
});
