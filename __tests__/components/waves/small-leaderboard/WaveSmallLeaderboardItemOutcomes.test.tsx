import React from 'react';
import { render, screen } from '@testing-library/react';
import { WaveSmallLeaderboardItemOutcomes } from '../../../../components/waves/small-leaderboard/WaveSmallLeaderboardItemOutcomes';
import { ApiWaveOutcomeCredit } from '../../../../generated/models/ApiWaveOutcomeCredit';
import { ApiWaveOutcomeType } from '../../../../generated/models/ApiWaveOutcomeType';


describe('WaveSmallLeaderboardItemOutcomes', () => {
  const drop: any = { rank: 1 };
  const wave: any = {
    outcomes: [
      { credit: ApiWaveOutcomeCredit.Cic, distribution: [{ amount: 1 }] },
      { credit: ApiWaveOutcomeCredit.Rep, distribution: [{ amount: 2 }] },
      { type: ApiWaveOutcomeType.Manual, distribution: [{ amount: 1, description: 'Award' }] },
    ],
  };

  it('renders button when outcomes exist', () => {
    render(<WaveSmallLeaderboardItemOutcomes drop={drop} wave={wave} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Outcome:')).toBeInTheDocument();
  });

  it('hides when no outcomes', () => {
    const waveEmpty = { outcomes: [] } as any;
    const { container } = render(<WaveSmallLeaderboardItemOutcomes drop={drop} wave={waveEmpty} />);
    expect(container.firstChild).toBeNull();
  });
});
