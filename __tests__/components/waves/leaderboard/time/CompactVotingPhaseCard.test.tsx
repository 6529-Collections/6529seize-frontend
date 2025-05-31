import React from 'react';
import { render, screen } from '@testing-library/react';
import { CompactVotingPhaseCard } from '../../../../../components/waves/leaderboard/time/CompactVotingPhaseCard';

const useWaveTimers = jest.fn();
jest.mock('../../../../../hooks/useWaveTimers', () => ({
  useWaveTimers: (...args: any[]) => useWaveTimers(...args),
}));
const useWave = jest.fn();
jest.mock('../../../../../hooks/useWave', () => ({
  useWave: (...args: any[]) => useWave(...args),
}));

const wave: any = { id: 'w1' };

beforeEach(() => jest.clearAllMocks());

test('shows countdown when not completed', () => {
  useWaveTimers.mockReturnValue({ voting: { isCompleted: false, isUpcoming: true, timeLeft: { days: 1, hours: 2, minutes: 3 } } });
  useWave.mockReturnValue({ voting: { startTime: 0, endTime: 100 } });
  render(<CompactVotingPhaseCard wave={wave} />);
  expect(screen.getByText('Voting starts in')).toBeInTheDocument();
  expect(screen.getByText('1d 2h 3m')).toBeInTheDocument();
});

test('shows completion message when completed', () => {
  useWaveTimers.mockReturnValue({ voting: { isCompleted: true, isUpcoming: false, timeLeft: { days: 0, hours: 0, minutes: 0 } } });
  useWave.mockReturnValue({ voting: { startTime: 0, endTime: 1000 } });
  render(<CompactVotingPhaseCard wave={wave} />);
  expect(screen.getByText('Voting complete')).toBeInTheDocument();
});
