import React from "react";
import { renderHook, act } from "@testing-library/react";
import {
  ContentTabProvider,
  useContentTab,
  WaveVotingState,
} from "@/components/brain/ContentTabContext";
import { MyStreamWaveTab } from "@/types/waves.types";

let mockPathname = "/waves";
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));

function setup() {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ContentTabProvider>{children}</ContentTabProvider>
  );
  return renderHook(() => useContentTab(), { wrapper });
}

describe("ContentTabContext", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPathname = "/waves";
    mockPush.mockClear();
  });

  it("keeps a competition deep link selected and navigates Chat back to its wave", () => {
    mockPathname = "/waves/chat-wave/competitions/first";
    const { result, rerender } = setup();
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.COMPETITIONS);
    expect(result.current.availableTabs).toContain(
      MyStreamWaveTab.COMPETITIONS
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.CHAT));
    expect(mockPush).toHaveBeenCalledWith("/waves/chat-wave", {
      scroll: false,
    });
    mockPathname = "/waves/chat-wave";
    rerender();
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
    mockPathname = "/waves/chat-wave/competitions/first";
    rerender();
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.COMPETITIONS);
  });

  it("defaults to CHAT when params null", () => {
    const { result } = setup();
    act(() => result.current.updateAvailableTabs(null));
    expect(result.current.availableTabs).toEqual([MyStreamWaveTab.CHAT]);
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("keeps competition-specific tabs out of the outer wave navigation on competition routes", () => {
    mockPathname = "/waves/legacy/competitions/primary";
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "legacy",
        isChatWave: false,
        hasCompetitions: true,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.ENDED,
        hasFirstDecisionPassed: true,
      })
    );
    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.COMPETITIONS,
    ]);
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.COMPETITIONS);
  });

  it("keeps legacy competition tabs separate from the wave's remembered collection tab", () => {
    mockPathname = "/waves/legacy/competitions/primary";
    localStorage.setItem(
      "memes_wave_last_tab_by_id",
      JSON.stringify({ legacy: MyStreamWaveTab.COMPETITIONS })
    );
    const { result } = renderHook(() => useContentTab(), {
      wrapper: ({ children }) => (
        <ContentTabProvider competitionOnly>{children}</ContentTabProvider>
      ),
    });
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "legacy",
        isChatWave: false,
        hasCompetitions: true,
        hasPolls: true,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.ENDED,
        hasFirstDecisionPassed: true,
      })
    );
    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.SUBMISSIONS,
      MyStreamWaveTab.WINNERS,
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.MY_VOTES,
    ]);
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.SUBMISSIONS);
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.WINNERS));
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.WINNERS);
    expect(mockPush).not.toHaveBeenCalled();
    expect(
      JSON.parse(localStorage.getItem("memes_wave_last_tab_by_id")!)
    ).toEqual({
      legacy: MyStreamWaveTab.COMPETITIONS,
    });
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.COMPETITIONS));
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.SUBMISSIONS);
  });

  it("prevents setting unavailable tab", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "chat-wave",
        isChatWave: true,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.WINNERS));
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("places competitions beside chat and falls back when access disappears", () => {
    const { result } = setup();
    const params = {
      waveId: "chat-wave",
      isChatWave: true,
      hasAuthenticatedProfile: true,
      isMemesWave: false,
      isCurationWave: false,
      votingState: WaveVotingState.NOT_STARTED,
      hasFirstDecisionPassed: false,
    };
    act(() =>
      result.current.updateAvailableTabs({ ...params, hasCompetitions: true })
    );
    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.COMPETITIONS,
    ]);
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.COMPETITIONS));
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.COMPETITIONS);
    act(() =>
      result.current.updateAvailableTabs({ ...params, hasCompetitions: false })
    );
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
    expect(result.current.availableTabs).toEqual([MyStreamWaveTab.CHAT]);
  });

  it("sets meme wave tabs correctly", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        hasPolls: true,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.MY_VOTES,
      MyStreamWaveTab.POLLS,
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.FAQ,
    ]);
  });

  it("omits My Votes for guests on memes waves", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        hasAuthenticatedProfile: false,
        isMemesWave: true,
        isCurationWave: false,
        hasPolls: true,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.POLLS,
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
        hasAuthenticatedProfile: true,
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
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        hasPolls: true,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("adds My Votes for authenticated normal rank waves", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "rank-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        hasPolls: true,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );

    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.MY_VOTES,
      MyStreamWaveTab.POLLS,
    ]);
  });

  it("omits My Votes for guests on normal rank waves", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "rank-wave",
        isChatWave: false,
        hasAuthenticatedProfile: false,
        isMemesWave: false,
        isCurationWave: false,
        hasPolls: true,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );

    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.POLLS,
    ]);
  });

  it("omits Outcome and normalizes active tab when outcomes are hidden", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "rank-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        hasPolls: true,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.OUTCOME));

    act(() =>
      result.current.updateAvailableTabs({
        waveId: "rank-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        showOutcomeTab: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );

    expect(result.current.availableTabs).not.toContain(MyStreamWaveTab.OUTCOME);
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("forces CHAT for chat waves", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "default-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.LEADERBOARD));

    act(() =>
      result.current.updateAvailableTabs({
        waveId: "chat-wave",
        isChatWave: true,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        hasPolls: true,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );

    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.POLLS,
    ]);
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("adds SALES and omits OUTCOME for curation waves", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "curation-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: true,
        hasPolls: true,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );

    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.SALES,
      MyStreamWaveTab.MY_VOTES,
      MyStreamWaveTab.POLLS,
    ]);
  });

  it("shows SUBMISSIONS and defaults to it when voting ended", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "ended-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        hasPolls: true,
        votingState: WaveVotingState.ENDED,
        hasFirstDecisionPassed: true,
      })
    );

    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.SUBMISSIONS,
      MyStreamWaveTab.WINNERS,
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.MY_VOTES,
      MyStreamWaveTab.POLLS,
    ]);
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.SUBMISSIONS);
  });

  it("adds My Votes for authenticated normal approve waves", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "approve-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        isApproveWave: true,
        hasPolls: true,
        votingState: WaveVotingState.ENDED,
        hasFirstDecisionPassed: false,
      })
    );

    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.WINNERS,
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.MY_VOTES,
      MyStreamWaveTab.POLLS,
    ]);
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("omits My Votes for guests on normal approve waves", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "approve-wave",
        isChatWave: false,
        hasAuthenticatedProfile: false,
        isMemesWave: false,
        isCurationWave: false,
        isApproveWave: true,
        hasPolls: true,
        votingState: WaveVotingState.ENDED,
        hasFirstDecisionPassed: false,
      })
    );

    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.LEADERBOARD,
      MyStreamWaveTab.WINNERS,
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.POLLS,
    ]);
  });

  it("does not add My Votes for guest approve waves when outcomes are hidden", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "approve-wave",
        isChatWave: false,
        hasAuthenticatedProfile: false,
        isMemesWave: false,
        isCurationWave: false,
        isApproveWave: true,
        showOutcomeTab: false,
        votingState: WaveVotingState.ENDED,
        hasFirstDecisionPassed: false,
      })
    );

    expect(result.current.availableTabs).not.toContain(MyStreamWaveTab.OUTCOME);
    expect(result.current.availableTabs).not.toContain(
      MyStreamWaveTab.MY_VOTES
    );
  });

  it("normalizes stored LEADERBOARD to SUBMISSIONS once voting ends", () => {
    const { result } = setup();

    act(() =>
      result.current.updateAvailableTabs({
        waveId: "ended-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.LEADERBOARD));

    act(() =>
      result.current.updateAvailableTabs({
        waveId: "ended-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.ENDED,
        hasFirstDecisionPassed: false,
      })
    );

    expect(result.current.availableTabs).toContain(MyStreamWaveTab.SUBMISSIONS);
    expect(result.current.availableTabs).not.toContain(
      MyStreamWaveTab.LEADERBOARD
    );
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.SUBMISSIONS);
  });

  it("restores stored tab for memes wave even when it is CHAT", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
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
        hasAuthenticatedProfile: true,
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
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("does not persist transient tab overrides", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );

    act(() =>
      result.current.setActiveContentTab(MyStreamWaveTab.CHAT, {
        persist: false,
      })
    );

    act(() =>
      result.current.updateAvailableTabs({
        waveId: "other-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
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
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );

    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.LEADERBOARD);
  });

  it("uses transient preferred tab to override stored or default tab", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.OUTCOME));

    act(() =>
      result.current.updateAvailableTabs({
        waveId: "other-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
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
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
        transientPreferredTab: MyStreamWaveTab.CHAT,
      })
    );

    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("does not persist transient preferred tab after leaving the wave", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
        transientPreferredTab: MyStreamWaveTab.CHAT,
      })
    );

    act(() =>
      result.current.updateAvailableTabs({
        waveId: "other-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
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
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );

    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.LEADERBOARD);
  });

  it("keeps transient active tab during same-wave availability recalculations", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );

    act(() =>
      result.current.setActiveContentTab(MyStreamWaveTab.CHAT, {
        persist: false,
      })
    );
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: true,
      })
    );

    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("keeps transient preferred tab during same-wave availability recalculations", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
        transientPreferredTab: MyStreamWaveTab.CHAT,
      })
    );
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "meme-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: true,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: true,
      })
    );

    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("reapplies the stored tab on same-wave recalculation when there is no transient override", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "default-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
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
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: false,
      })
    );
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);

    act(() =>
      result.current.updateAvailableTabs({
        waveId: "default-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.NOT_STARTED,
        hasFirstDecisionPassed: true,
      })
    );

    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.WINNERS);
  });

  it("falls back to default when stored tab is unavailable", () => {
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "default-wave",
        isChatWave: false,
        hasAuthenticatedProfile: true,
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
        hasAuthenticatedProfile: true,
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
        hasAuthenticatedProfile: true,
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
        hasAuthenticatedProfile: true,
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
