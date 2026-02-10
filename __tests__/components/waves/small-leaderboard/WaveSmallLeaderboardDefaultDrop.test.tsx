import { render } from '@testing-library/react';
import React from 'react';
import { WaveSmallLeaderboardDefaultDrop } from '@/components/waves/small-leaderboard/WaveSmallLeaderboardDefaultDrop';
import { CICType } from '@/entities/IProfile';

jest.mock('next/link', () => ({ __esModule: true, default: ({ children }: any) => <a>{children}</a> }));

jest.mock('@/components/waves/small-leaderboard/WaveSmallLeaderboardItemContent', () => ({
  __esModule: true,
  WaveSmallLeaderboardItemContent: (props: any) => (
    <div data-testid="content" onClick={() => props.onDropClick(props.drop)} />
  )
}));

jest.mock('@/components/waves/small-leaderboard/WaveSmallLeaderboardItemOutcomes', () => ({
  __esModule: true,
  WaveSmallLeaderboardItemOutcomes: () => <div data-testid="outcomes" />
}));

jest.mock('@/components/waves/drops/WaveDropActionsRate', () => ({ __esModule: true, default: () => <div data-testid="rate" /> }));

jest.mock('@/components/waves/drops/winner/WinnerDropBadge', () => ({ __esModule: true, default: () => <div data-testid="badge" /> }));

jest.mock('@/components/drops/view/utils/DropVoteProgressing', () => ({ __esModule: true, default: () => <div data-testid="progress" /> }));

jest.mock('@/helpers/Helpers', () => ({
  __esModule: true,
  cicToType: jest.fn(() => CICType.INACCURATE),
  formatNumberWithCommas: (n: number) => n.toString()
}));

describe('WaveSmallLeaderboardDefaultDrop', () => {
  const drop: any = { id: 'd', author: { handle: 'h', level: 1, cic: 0 }, rating: 1, rating_prediction: 2 };
  const wave: any = { id: 'w' };

  it('shows winner badge when rank present', () => {
    render(<WaveSmallLeaderboardDefaultDrop drop={{ ...drop, rank: 1 }} wave={wave} onDropClick={jest.fn()} />);
    expect(document.querySelector('[data-testid="badge"]')).toBeInTheDocument();
  });

  it('shows minus icon when rank missing', () => {
    const { container } = render(<WaveSmallLeaderboardDefaultDrop drop={{ ...drop, rank: null }} wave={wave} onDropClick={jest.fn()} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies CIC color class', () => {
    const { container } = render(<WaveSmallLeaderboardDefaultDrop drop={{ ...drop, rank: null }} wave={wave} onDropClick={jest.fn()} />);
    expect(container.querySelector('.tw-bg-\\[\\#F97066\\]')).toBeInTheDocument();
  });
});
