import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WaveSmallLeaderboardTopThreeDrop } from '@/components/waves/small-leaderboard/WaveSmallLeaderboardTopThreeDrop';
import type { ExtendedDrop } from '@/helpers/waves/drop.helpers';
import type { ApiWave } from '@/generated/models/ApiWave';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, onClick, className }: any) => (
  <a href={href} onClick={onClick} className={className}>{children}</a>
)}));

jest.mock('@/components/waves/small-leaderboard/WaveSmallLeaderboardItemContent', () => ({
  WaveSmallLeaderboardItemContent: ({ drop, onDropClick }: any) => (
    <div data-testid="content" onClick={() => onDropClick(drop)} />
  ),
}));

jest.mock('@/components/waves/small-leaderboard/WaveSmallLeaderboardItemOutcomes', () => ({
  WaveSmallLeaderboardItemOutcomes: () => <div data-testid="outcomes" />,
}));

jest.mock('@/components/waves/drops/winner/WinnerDropBadge', () => ({
  __esModule: true,
  default: () => <div data-testid="badge" />,
}));

jest.mock('@/components/drops/view/utils/DropVoteProgressing', () => ({
  __esModule: true,
  default: () => <div data-testid="progress" />,
}));

jest.mock('@/helpers/Helpers', () => ({
  cicToType: (cic: number) => (cic >= 10000 ? 'ACCURATE' : 'PROBABLY_ACCURATE'),
  formatNumberWithCommas: (n: number) => String(n),
}));

jest.mock('@/helpers/AllowlistToolHelpers', () => ({ assertUnreachable: jest.fn() }));

describe('WaveSmallLeaderboardTopThreeDrop', () => {
  const wave: ApiWave = { id: 'w1', name: 'Wave' } as ApiWave;
  const drop: ExtendedDrop = {
    id: 'd1',
    rank: 1,
    rating: 10,
    rating_prediction: 12,
    author: { handle: 'alice', pfp: null, level: 3, cic: 5000 } as any,
    winning_context: { decision_time: 123 } as any,
  } as ExtendedDrop;

  it('renders winner badge when ranked', () => {
    render(<WaveSmallLeaderboardTopThreeDrop drop={drop} wave={wave} onDropClick={jest.fn()} />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('applies cic color class', () => {
    const { container } = render(
      <WaveSmallLeaderboardTopThreeDrop drop={drop} wave={wave} onDropClick={jest.fn()} />
    );
    expect(container.innerHTML).toContain('tw-bg-[#AAF0C4]');
  });

  it('calls onDropClick when content clicked', () => {
    const onClick = jest.fn();
    render(<WaveSmallLeaderboardTopThreeDrop drop={drop} wave={wave} onDropClick={onClick} />);
    fireEvent.click(screen.getByTestId('content'));
    expect(onClick).toHaveBeenCalledWith(drop);
  });
});
