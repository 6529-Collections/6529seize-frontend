import { render, screen } from '@testing-library/react';
import React from 'react';
import { CompactTimeCountdown } from '@/components/waves/leaderboard/time/CompactTimeCountdown';

const baseTime = { days: 0, hours: 1, minutes: 2, seconds: 3 };

describe('CompactTimeCountdown', () => {
  it('renders hours, minutes and seconds', () => {
    render(<CompactTimeCountdown timeLeft={baseTime} />);
    expect(screen.queryByText('days')).not.toBeInTheDocument();
    expect(screen.getByText('hrs')).toBeInTheDocument();
    expect(screen.getByText('min')).toBeInTheDocument();
    expect(screen.getByText('sec')).toBeInTheDocument();
  });

  it('includes days when value greater than zero', () => {
    render(<CompactTimeCountdown timeLeft={{ ...baseTime, days: 1 }} />);
    expect(screen.getByText('days')).toBeInTheDocument();
  });
});
