import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ContentTabProvider, useContentTab, WaveVotingState } from '../../../components/brain/ContentTabContext';
import { MyStreamWaveTab } from '../../../types/waves.types';

function setup() {
  const wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <ContentTabProvider>{children}</ContentTabProvider>
  );
  return renderHook(() => useContentTab(), { wrapper });
}

describe('ContentTabContext', () => {
  it('defaults to CHAT when params null', () => {
    const { result } = setup();
    act(() => result.current.updateAvailableTabs(null));
    expect(result.current.availableTabs).toEqual([MyStreamWaveTab.CHAT]);
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it('prevents setting unavailable tab', () => {
    const { result } = setup();
    act(() => result.current.updateAvailableTabs({ isChatWave: true, isMemesWave: false, votingState: WaveVotingState.NOT_STARTED, hasFirstDecisionPassed: false }));
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.WINNERS));
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it('sets meme wave tabs correctly', () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        isChatWave: false,
        isMemesWave: true,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.MY_VOTES,
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.FAQ,
    ]);
  });
});
