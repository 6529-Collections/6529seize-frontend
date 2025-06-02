import { render, screen } from '@testing-library/react';
import React from 'react';
import { TimeCountdown } from '../../components/waves/leaderboard/time/TimeCountdown';

const base = { days:0, hours:1, minutes:2, seconds:3 };

describe('TimeCountdown', () => {
  it('renders hours minutes seconds', () => {
    render(<TimeCountdown timeLeft={base} />);
    expect(screen.queryByText('days')).not.toBeInTheDocument();
    expect(screen.getByText('hrs')).toBeInTheDocument();
    expect(screen.getByText('min')).toBeInTheDocument();
    expect(screen.getByText('sec')).toBeInTheDocument();
  });

  it('shows days when greater than zero', () => {
    render(<TimeCountdown timeLeft={{ ...base, days:1 }} />);
    expect(screen.getByText('days')).toBeInTheDocument();
  });
});
