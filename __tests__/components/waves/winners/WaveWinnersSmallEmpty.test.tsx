import React from 'react';
import { render, screen } from '@testing-library/react';
import { WaveWinnersSmallEmpty } from '@/components/waves/winners/WaveWinnersSmallEmpty';

describe('WaveWinnersSmallEmpty', () => {
  it('shows single decision message', () => {
    render(<WaveWinnersSmallEmpty />);
    expect(screen.getByText('No Winners Yet')).toBeInTheDocument();
    expect(screen.getByText('This wave ended without any winning submissions')).toBeInTheDocument();
  });

  it('shows multi decision message', () => {
    render(<WaveWinnersSmallEmpty isMultiDecision />);
    expect(screen.getByText('No winners have been announced for this wave yet. Check back later!')).toBeInTheDocument();
  });
});
