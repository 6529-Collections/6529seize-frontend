import { render, screen } from '@testing-library/react';
import React from 'react';
import { ApiWaveType } from '@/generated/models/ApiWaveType';
import { Mode, SidebarTab } from '@/components/brain/right-sidebar/BrainRightSidebar';
import { WaveContent } from '@/components/brain/right-sidebar/WaveContent';

const useWaveTimers = jest.fn();

jest.mock('@/hooks/useWaveTimers', () => ({ useWaveTimers: (...args: any[]) => useWaveTimers(...args) }));

jest.mock('@/components/waves/header/WaveHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="header">header</div>,
  WaveHeaderPinnedSide: { LEFT: 'LEFT' }
}));

jest.mock('@/components/common/TabToggleWithOverflow', () => ({
  __esModule: true,
  TabToggleWithOverflow: ({ options, activeKey }: any) => (
    <div data-testid="tabs">{activeKey}-{options.length}</div>
  )
}));

jest.mock('@/components/waves/winners/WaveWinnersSmall', () => ({ __esModule: true, WaveWinnersSmall: () => <div>winners</div> }));
jest.mock('@/components/waves/small-leaderboard/WaveSmallLeaderboard', () => ({ __esModule: true, WaveSmallLeaderboard: () => <div>leaderboard</div> }));
jest.mock('@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoters', () => ({ __esModule: true, WaveLeaderboardRightSidebarVoters: () => <div>voters</div> }));
jest.mock('@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLogs', () => ({ __esModule: true, WaveLeaderboardRightSidebarActivityLogs: () => <div>logs</div> }));
jest.mock('@/components/brain/right-sidebar/BrainRightSidebarContent', () => ({ __esModule: true, default: () => <div>content</div> }));
jest.mock('@/components/brain/right-sidebar/BrainRightSidebarFollowers', () => ({ __esModule: true, default: () => <div>followers</div> }));

describe('WaveContent', () => {
  const wave = { wave: { type: ApiWaveType.Chat }, name: 'Wave' } as any;

  it('renders non-rank wave without tabs', () => {
    useWaveTimers.mockReturnValue({ voting: { isCompleted: false }, decisions: { firstDecisionDone: false } });
    render(
      <WaveContent wave={wave} mode={Mode.CONTENT} setMode={jest.fn()} activeTab={SidebarTab.ABOUT} setActiveTab={jest.fn()} onDropClick={jest.fn()} />
    );
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.queryByTestId('tabs')).toBeNull();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('switches tab to about when voting completed', () => {
    const setActiveTab = jest.fn();
    useWaveTimers.mockReturnValue({ voting: { isCompleted: true }, decisions: { firstDecisionDone: true } });
    render(
      <WaveContent wave={{ wave: { type: ApiWaveType.Rank }, name: 'Wave' } as any} mode={Mode.CONTENT} setMode={jest.fn()} activeTab={SidebarTab.LEADERBOARD} setActiveTab={setActiveTab} onDropClick={jest.fn()} />
    );
    expect(setActiveTab).toHaveBeenCalledWith(SidebarTab.ABOUT);
  });
});
