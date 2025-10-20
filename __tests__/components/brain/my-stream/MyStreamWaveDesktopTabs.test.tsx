import { render, screen } from '@testing-library/react';
import React from 'react';
import { MyStreamWaveTab } from '@/types/waves.types';
import { ApiWaveType } from '@/generated/models/ApiWaveType';
import { Time } from '@/helpers/time';

const setActiveTab = jest.fn();
const setActiveContentTab = jest.fn();
const updateAvailableTabs = jest.fn();

jest.mock('@/components/brain/ContentTabContext', () => {
  const actual = jest.requireActual('../../../../components/brain/ContentTabContext');
  return {
    __esModule: true,
    ...actual,
    useContentTab: () => ({
      availableTabs: mockAvailableTabs,
      setActiveContentTab,
      updateAvailableTabs,
    }),
  };
});

jest.mock('@/hooks/useWave', () => ({
  useWave: () => ({
    ...mockWaveInfo,
    pauses: {
      isPaused: false,
      currentPause: null,
      nextPause: null,
      showPause: jest.fn(() => null),
      hasDecisionsBeforePause: jest.fn(() => false),
      filterDecisionsDuringPauses: jest.fn((decisions) => decisions),
      getNextValidDecision: jest.fn(() => null),
    },
  }),
}));

jest.mock('@/hooks/useWaveTimers', () => ({
  useWaveTimers: () => ({
    voting: mockVoting,
    decisions: { firstDecisionDone: false },
  }),
}));

jest.mock('@/hooks/waves/useDecisionPoints', () => ({
  useDecisionPoints: () => ({
    allDecisions: mockDecisions,
    hasMoreFuture: false,
    loadMoreFuture: jest.fn(),
  }),
}));

jest.mock('@/components/waves/leaderboard/time/CompactTimeCountdown', () => ({
  __esModule: true,
  CompactTimeCountdown: ({ timeLeft }: any) => (
    <div data-testid="countdown">{timeLeft.seconds}</div>
  ),
}));

import MyStreamWaveDesktopTabs from '@/components/brain/my-stream/MyStreamWaveDesktopTabs';

let mockAvailableTabs: MyStreamWaveTab[] = [];
let mockWaveInfo: any = { isChatWave: false, isMemesWave: false, isRankWave: false };
let mockVoting = { isUpcoming: false, isCompleted: false, isInProgress: true };
let mockDecisions: { timestamp: number }[] = [];

function renderComponent(activeTab: MyStreamWaveTab = MyStreamWaveTab.CHAT) {
  return render(
    <MyStreamWaveDesktopTabs
      activeTab={activeTab}
      wave={{ wave: { type: ApiWaveType.Approve } } as any}
      setActiveTab={setActiveTab}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAvailableTabs = [MyStreamWaveTab.CHAT];
  mockWaveInfo = { isChatWave: false, isMemesWave: false, isRankWave: false };
  mockVoting = { isUpcoming: false, isCompleted: false, isInProgress: true };
  mockDecisions = [];
});

describe('MyStreamWaveDesktopTabs', () => {
  it('returns null for chat waves', () => {
    mockWaveInfo = { isChatWave: true, isMemesWave: false, isRankWave: false };
    const { container } = renderComponent();
    expect(container.firstChild).toBeNull();
  });

  it('filters options and corrects invalid active tab', () => {
    mockAvailableTabs = [
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.MY_VOTES,
      MyStreamWaveTab.LEADERBOARD,
    ];
    renderComponent(MyStreamWaveTab.MY_VOTES);
    expect(setActiveTab).toHaveBeenCalledWith(MyStreamWaveTab.CHAT);
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.queryByText('My Votes')).toBeNull();
  });

  it('does not render countdown; parent header handles it', () => {
    const spy = jest.spyOn(Time, 'currentMillis').mockReturnValue(0);
    mockWaveInfo = { isChatWave: false, isMemesWave: true, isRankWave: false };
    mockAvailableTabs = [MyStreamWaveTab.CHAT];
    mockDecisions = [{ timestamp: 10000 }];
    renderComponent(MyStreamWaveTab.CHAT);
    expect(screen.queryByTestId('countdown')).toBeNull();
    spy.mockRestore();
  });
});
