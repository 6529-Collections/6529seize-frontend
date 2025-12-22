import React from 'react';
import { render, screen } from '@testing-library/react';
import { WaveSmallLeaderboardItemOutcomes } from '@/components/waves/small-leaderboard/WaveSmallLeaderboardItemOutcomes';

const mockUseWaveRankReward = jest.fn();

jest.mock('@/hooks/waves/useWaveRankReward', () => ({
  useWaveRankReward: (args: any) => mockUseWaveRankReward(args),
}));

describe('WaveSmallLeaderboardItemOutcomes', () => {
  const drop: any = { rank: 1, wave: { id: 'w1' } };

  beforeEach(() => {
    mockUseWaveRankReward.mockReset();
  });

  it('renders button when outcomes exist', () => {
    mockUseWaveRankReward.mockReturnValue({
      nicTotal: 10,
      repTotal: 20,
      manualOutcomes: ['Award'],
      isLoading: false
    });

    render(<WaveSmallLeaderboardItemOutcomes drop={drop} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Outcome:')).toBeInTheDocument();
  });

  it('hides when no outcomes and not loading', () => {
    mockUseWaveRankReward.mockReturnValue({
      nicTotal: 0,
      repTotal: 0,
      manualOutcomes: [],
      isLoading: false
    });

    const { container } = render(<WaveSmallLeaderboardItemOutcomes drop={drop} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows loading state', () => {
    mockUseWaveRankReward.mockReturnValue({
      nicTotal: 0,
      repTotal: 0,
      manualOutcomes: [],
      isLoading: true
    });
    const { container } = render(<WaveSmallLeaderboardItemOutcomes drop={drop} />);
    expect(container.querySelector('.tw-animate-pulse')).toBeInTheDocument();
  });
});
