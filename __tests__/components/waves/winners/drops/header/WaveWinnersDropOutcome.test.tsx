import React from 'react';
import { render, screen } from '@testing-library/react';
import WaveWinnersDropOutcome from '@/components/waves/winners/drops/header/WaveWinnersDropOutcome';
import { ApiWaveOutcomeCredit } from '@/generated/models/ApiWaveOutcomeCredit';
import { ApiWaveOutcomeType } from '@/generated/models/ApiWaveOutcomeType';

describe('WaveWinnersDropOutcome', () => {
  it('returns null when there are no awards', () => {
    const { container } = render(<WaveWinnersDropOutcome winner={{ awards: [] } as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nic, rep and manual outcomes', () => {
    const winner = {
      awards: [
        { credit: ApiWaveOutcomeCredit.Cic, amount: 420, type: ApiWaveOutcomeType.Automatic },
        { credit: ApiWaveOutcomeCredit.Rep, amount: 10, rep_category: 'gold', type: ApiWaveOutcomeType.Automatic },
        { type: ApiWaveOutcomeType.Manual, description: 'Special' },
      ],
    } as any;

    render(<WaveWinnersDropOutcome winner={winner} />);

    expect(screen.getByText('NIC')).toBeInTheDocument();
    expect(screen.getByText('Rep')).toBeInTheDocument();
    expect(screen.getByText('Special')).toBeInTheDocument();
    expect(screen.getByText('420')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
