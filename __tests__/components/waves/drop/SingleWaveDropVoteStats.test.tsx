import { render, screen } from '@testing-library/react';
import { SingleWaveDropVoteStats } from '@/components/waves/drop/SingleWaveDropVoteStats';
import { ApiWaveCreditType } from '@/generated/models/ApiWaveCreditType';

describe('SingleWaveDropVoteStats', () => {
  it('displays current and max rating with credit type', () => {
    render(
      <SingleWaveDropVoteStats currentRating={1234} maxRating={5678} creditType={ApiWaveCreditType.Rep} />
    );
    expect(screen.getByText('Your votes:')).toBeInTheDocument();
    expect(screen.getByText(/1,234\s*REP/i)).toBeInTheDocument();
    expect(screen.getByText(/5,678\s*REP/i)).toBeInTheDocument();
  });
});
