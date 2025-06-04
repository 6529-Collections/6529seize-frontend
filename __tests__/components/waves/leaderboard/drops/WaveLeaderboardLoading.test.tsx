import { render, screen } from '@testing-library/react';
import React from 'react';
import { WaveLeaderboardLoading } from '../../../../../components/waves/leaderboard/drops/WaveLeaderboardLoading';

describe('WaveLeaderboardLoading', () => {
  it('renders spinner and message', () => {
    render(<WaveLeaderboardLoading />);
    expect(screen.getByText('Loading drops...')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeTruthy();
  });
});
