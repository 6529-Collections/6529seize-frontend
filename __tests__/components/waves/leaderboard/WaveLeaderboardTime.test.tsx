import React from 'react';
import { render, screen } from '@testing-library/react';
import { WaveLeaderboardTime } from '@/components/waves/leaderboard/WaveLeaderboardTime';

jest.mock('@/hooks/waves/useDecisionPoints', () => ({ useDecisionPoints: jest.fn() }));
jest.mock('@/hooks/useWave', () => ({ useWave: jest.fn() }));
jest.mock('@/components/waves/leaderboard/time/TimelineToggleHeader', () => ({ TimelineToggleHeader: () => <div data-testid="header" /> }));
jest.mock('@/components/waves/leaderboard/time/ExpandedTimelineContent', () => ({ ExpandedTimelineContent: () => <div data-testid="expanded" /> }));
jest.mock('@/components/waves/leaderboard/time/CompactDroppingPhaseCard', () => ({ CompactDroppingPhaseCard: () => <div data-testid="drop" /> }));
jest.mock('@/components/waves/leaderboard/time/CompactVotingPhaseCard', () => ({ CompactVotingPhaseCard: () => <div data-testid="vote" /> }));
jest.mock('@/helpers/time', () => ({ Time: { currentMillis: jest.fn(() => 0) } }));

const useDecisionPoints = require('@/hooks/waves/useDecisionPoints').useDecisionPoints;
const useWave = require('@/hooks/useWave').useWave;

describe('WaveLeaderboardTime', () => {
  it('shows timeline when multi decision', () => {
    useWave.mockReturnValue({ 
      decisions: { multiDecision: true },
      pauses: {
        isPaused: false,
        currentPause: null,
        nextPause: null,
        showPause: jest.fn(() => null),
        hasDecisionsBeforePause: jest.fn(() => false),
        filterDecisionsDuringPauses: jest.fn((decisions) => decisions),
        getNextValidDecision: jest.fn(() => null),
      }
    });
    useDecisionPoints.mockReturnValue({
      allDecisions: [{ timestamp: 10 }],
      hasMorePast: false,
      hasMoreFuture: false,
      loadMorePast: jest.fn(),
      loadMoreFuture: jest.fn(),
      remainingPastCount: 0,
      remainingFutureCount: 0,
    });
    render(<WaveLeaderboardTime wave={{} as any} />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.queryByTestId('drop')).toBeNull();
  });

  it('shows compact cards when not multi decision', () => {
    useWave.mockReturnValue({ 
      decisions: { multiDecision: false },
      pauses: {
        isPaused: false,
        currentPause: null,
        nextPause: null,
        showPause: jest.fn(() => null),
        hasDecisionsBeforePause: jest.fn(() => false),
        filterDecisionsDuringPauses: jest.fn((decisions) => decisions),
        getNextValidDecision: jest.fn(() => null),
      }
    });
    useDecisionPoints.mockReturnValue({
      allDecisions: [],
      hasMorePast: false,
      hasMoreFuture: false,
      loadMorePast: jest.fn(),
      loadMoreFuture: jest.fn(),
      remainingPastCount: 0,
      remainingFutureCount: 0,
    });
    render(<WaveLeaderboardTime wave={{} as any} />);
    expect(screen.getByTestId('drop')).toBeInTheDocument();
    expect(screen.getByTestId('vote')).toBeInTheDocument();
    expect(screen.queryByTestId('header')).toBeNull();
  });
});
