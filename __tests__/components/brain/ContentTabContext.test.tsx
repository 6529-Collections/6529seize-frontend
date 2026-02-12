import React from "react";
import { renderHook, act } from "@testing-library/react";
import {
  ContentTabProvider,
  useContentTab,
  WaveVotingState,
} from "@/components/brain/ContentTabContext";
import { MyStreamWaveTab } from "@/types/waves.types";

function setup() {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ContentTabProvider>{children}</ContentTabProvider>
  );
  return renderHook(() => useContentTab(), { wrapper });
}

describe("ContentTabContext", () => {
  it("defaults to CHAT when params null", () => {
    const { result } = setup();
    act(() => result.current.updateAvailableTabs(null));
    expect(result.current.availableTabs).toEqual([MyStreamWaveTab.CHAT]);
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("prevents setting unavailable tab", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "chat-wave",
        isChatWave: true,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.WINNERS));
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("sets meme wave tabs correctly", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.MY_VOTES,
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.FAQ,
    ]);
  });

  it("defaults to LEADERBOARD for memes waves", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.LEADERBOARD);
  });

  it("defaults to CHAT for non-memes waves", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "default-wave",
        isChatWave: false,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("omits OUTCOME for curation waves", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "curation-wave",
        isChatWave: false,
        isMemesWave: false,
        isCurationWave: true,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );

    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.MY_VOTES,
    ]);
  });

  it("restores stored tab for memes wave even when it is CHAT", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.CHAT));
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "default-wave",
        isChatWave: false,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("falls back to default when stored tab is unavailable", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "default-wave",
        isChatWave: false,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: true,
      })
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.WINNERS));
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "default-wave",
        isChatWave: false,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("falls back to CHAT when stored OUTCOME becomes unavailable for curation wave", () => {
    const { result } = setup();

    act(() =>
      result.current.updateAvailableTabs({
        waveId: "wave-1",
        isChatWave: false,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.OUTCOME));

    act(() =>
      result.current.updateAvailableTabs({
        waveId: "wave-1",
        isChatWave: false,
        isMemesWave: false,
        isCurationWave: true,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );

    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
    expect(result.current.availableTabs).not.toContain(MyStreamWaveTab.OUTCOME);
  });
});
