import React from "react";
import { renderHook, act } from "@testing-library/react";
import {
  ContentTabProvider,
  useContentTab,
  WaveVotingState,
} from "@/components/brain/ContentTabContext";
import { MyStreamWaveTab } from "@/types/waves.types";
import { CompetitionNavigationContext } from "@/contexts/CompetitionNavigationContext";

let mockPathname = "/waves";
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearch = new URLSearchParams();
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearch,
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
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
    mockSearch = new URLSearchParams();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it.each([
    ["leaderboard", MyStreamWaveTab.LEADERBOARD],
    ["decisions", MyStreamWaveTab.WINNERS],
    ["votes", MyStreamWaveTab.MY_VOTES],
    ["outcomes", MyStreamWaveTab.OUTCOME],
    ["rules", MyStreamWaveTab.CONFIGURATION],
  ])(
    "selects the wave-level %s tab on a flat default route",
    (tab, expected) => {
      mockPathname = "/waves/hub/competitions/alpha";
      mockSearch = new URLSearchParams({ tab });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CompetitionNavigationContext.Provider
          value={{ flat: true, nativeCompetition: null }}
        >
          <ContentTabProvider>{children}</ContentTabProvider>
        </CompetitionNavigationContext.Provider>
      );
      const { result } = renderHook(() => useContentTab(), { wrapper });
      act(() =>
        result.current.updateAvailableTabs({
          waveId: "hub",
          isChatWave: true,
          hasCompetitions: true,
          defaultCompetitionId: "alpha",
          hasCompetitionConfiguration: true,
          defaultSelectionEnabled: true,
          hasAuthenticatedProfile: true,
          isMemesWave: false,
          isCurationWave: false,
          votingState: WaveVotingState.ONGOING,
          hasFirstDecisionPassed: false,
        })
      );
      expect(result.current.activeContentTab).toBe(expected);
      act(() => result.current.setActiveContentTab(MyStreamWaveTab.CHAT));
      expect(mockPush).toHaveBeenCalledWith(
        "/waves/hub?tab=chat&competition=alpha",
        { scroll: false }
      );
    }
  );

  it("keeps a competition deep link selected and navigates Chat back to its wave", () => {
    mockPathname = "/waves/chat-wave/competitions/first";
    const { result, rerender } = setup();
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.COMPETITIONS);
    expect(result.current.availableTabs).toContain(
      MyStreamWaveTab.COMPETITIONS
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.CHAT));
    expect(mockPush).toHaveBeenCalledWith(
      "/waves/chat-wave?tab=chat&competition=first",
      {
        scroll: false,
      }
    );
    mockPathname = "/waves/chat-wave";
    rerender();
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
    mockPathname = "/waves/chat-wave/competitions/first";
    rerender();
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.COMPETITIONS);
  });

  it.each([
    ["rules", MyStreamWaveTab.CONFIGURATION],
    ["decisions", MyStreamWaveTab.WINNERS],
    ["votes", MyStreamWaveTab.MY_VOTES],
    ["outcomes", MyStreamWaveTab.OUTCOME],
  ])(
    "renders flat legacy %s before desktop tab availability is registered",
    (tab, expected) => {
      mockPathname = "/waves/hub/competitions/alpha";
      mockSearch = new URLSearchParams({ tab });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CompetitionNavigationContext.Provider
          value={{ flat: true, nativeCompetition: null }}
        >
          <ContentTabProvider>{children}</ContentTabProvider>
        </CompetitionNavigationContext.Provider>
      );
      const { result } = renderHook(() => useContentTab(), { wrapper });
      expect(result.current.activeContentTab).toBe(expected);
    }
  );

  it.each<[boolean, MyStreamWaveTab]>([
    [true, MyStreamWaveTab.CONFIGURATION],
    [false, MyStreamWaveTab.LEADERBOARD],
  ])(
    "applies registered Configuration availability to flat legacy rules (available=%s)",
    (hasCompetitionConfiguration, expected) => {
      mockPathname = "/waves/hub/competitions/alpha";
      mockSearch = new URLSearchParams({ tab: "rules" });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CompetitionNavigationContext.Provider
          value={{ flat: true, nativeCompetition: null }}
        >
          <ContentTabProvider>{children}</ContentTabProvider>
        </CompetitionNavigationContext.Provider>
      );
      const { result } = renderHook(() => useContentTab(), { wrapper });
      expect(result.current.activeContentTab).toBe(
        MyStreamWaveTab.CONFIGURATION
      );

      act(() =>
        result.current.updateAvailableTabs({
          waveId: "hub",
          isChatWave: false,
          hasCompetitions: true,
          hasCompetitionConfiguration,
          defaultCompetitionId: "alpha",
          defaultSelectionEnabled: true,
          hasAuthenticatedProfile: true,
          isMemesWave: false,
          isCurationWave: false,
          votingState: WaveVotingState.ONGOING,
          hasFirstDecisionPassed: false,
        })
      );

      expect(
        result.current.availableTabs.includes(MyStreamWaveTab.CONFIGURATION)
      ).toBe(hasCompetitionConfiguration);
      expect(result.current.activeContentTab).toBe(expected);
    }
  );

  it.each([
    ["tab=chat&competition=older", "older"],
    ["tab=chat", "newer"],
  ])(
    "routes familiar tabs using explicit selection before default (%s)",
    (query, competitionId) => {
      mockPathname = "/waves/hub";
      mockSearch = new URLSearchParams(query);
      const { result } = setup();
      act(() =>
        result.current.updateAvailableTabs({
          waveId: "hub",
          isChatWave: true,
          hasCompetitions: true,
          hasAuthenticatedProfile: true,
          isMemesWave: false,
          isCurationWave: false,
          votingState: WaveVotingState.ONGOING,
          hasFirstDecisionPassed: false,
          defaultCompetitionId: "newer",
          defaultSelectionEnabled: true,
        })
      );
      expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
      act(() => result.current.setActiveContentTab(MyStreamWaveTab.WINNERS));
      expect(mockPush).toHaveBeenCalledWith(
        `/waves/hub/competitions/${competitionId}?tab=decisions`,
        { scroll: false }
      );
      expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
    }
  );

  it("retains an intentional competition view while the default is still loading", () => {
    mockPathname = "/waves/hub";
    const { result, rerender } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "hub",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.ONGOING,
        hasFirstDecisionPassed: true,
        defaultCompetitionId: null,
        defaultSelectionEnabled: true,
      })
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.WINNERS));
    expect(mockPush).toHaveBeenCalledWith("/waves/hub?tab=winners", {
      scroll: false,
    });
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
    mockSearch = new URLSearchParams("tab=winners");
    rerender();
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.WINNERS);
  });

  it("opens Chat when a fresh wave route changes only its competition context", () => {
    mockPathname = "/waves/hub";
    mockSearch = new URLSearchParams({ competition: "older" });
    const { result, rerender } = setup();
    const waveTabs = {
      waveId: "hub",
      isChatWave: false,
      hasAuthenticatedProfile: true,
      isMemesWave: false,
      isCurationWave: false,
      votingState: WaveVotingState.ONGOING,
      hasFirstDecisionPassed: true,
    };
    act(() => result.current.updateAvailableTabs(waveTabs));
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.ABOUT));
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.ABOUT);

    mockSearch = new URLSearchParams({ competition: "newer" });
    rerender();
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
    act(() => result.current.updateAvailableTabs(waveTabs));
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("defaults to CHAT when params null", () => {
    const { result } = setup();
    act(() => result.current.updateAvailableTabs(null));
    expect(result.current.availableTabs).toEqual([MyStreamWaveTab.CHAT]);
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
  });

  it("keeps familiar wave tabs visible on competition routes", () => {
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
      MyStreamWaveTab.SUBMISSIONS,
      MyStreamWaveTab.WINNERS,
      MyStreamWaveTab.OUTCOME,
      MyStreamWaveTab.MY_VOTES,
      MyStreamWaveTab.COMPETITIONS,
      MyStreamWaveTab.ABOUT,
    ]);
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.COMPETITIONS);
  });

  it("preserves a legacy competition view when its entry link includes a serial target", () => {
    mockPathname = "/waves/legacy/competitions/primary";
    mockSearch = new URLSearchParams("tab=decisions&serialNo=42");
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ContentTabProvider competitionOnly>{children}</ContentTabProvider>
    );
    const { result } = renderHook(() => useContentTab(), { wrapper });
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "legacy",
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.ONGOING,
        hasFirstDecisionPassed: true,
      })
    );
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.WINNERS);
  });

  it("preserves tabs and explicit competition identity across route changes", () => {
    mockPathname = "/waves/hub";
    const { result, rerender } = setup();
    const updateTabs = () =>
      result.current.updateAvailableTabs({
        waveId: "hub",
        isChatWave: true,
        hasCompetitions: true,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.ONGOING,
        hasFirstDecisionPassed: false,
        defaultCompetitionId: "newer",
        defaultSelectionEnabled: true,
      });
    act(updateTabs);
    const familiarTabs = [...result.current.availableTabs];
    expect(familiarTabs).toContain(MyStreamWaveTab.WINNERS);
    mockPathname = "/waves/hub/competitions/older";
    mockSearch = new URLSearchParams("tab=leaderboard");
    rerender();
    act(updateTabs);
    expect(result.current.availableTabs).toEqual(familiarTabs);
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.WINNERS));
    expect(mockPush).toHaveBeenLastCalledWith(
      "/waves/hub/competitions/older?tab=decisions",
      { scroll: false }
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.COMPETITIONS));
    expect(mockPush).toHaveBeenLastCalledWith("/waves/hub/competitions", {
      scroll: false,
    });
    mockPathname = "/waves/hub/competitions";
    mockSearch = new URLSearchParams();
    rerender();
    act(updateTabs);
    expect(result.current.availableTabs).toEqual(familiarTabs);
  });

  it("records explicit Chat intent even on a bare wave URL", () => {
    mockPathname = "/waves/hub";
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "hub",
        isChatWave: true,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.ONGOING,
        hasFirstDecisionPassed: false,
        defaultCompetitionId: "first",
        defaultSelectionEnabled: true,
      })
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.CHAT));
    expect(mockReplace).toHaveBeenCalledWith("/waves/hub?tab=chat", {
      scroll: false,
    });
  });

  it("keeps the visible collection tab actionable before hub availability loads", () => {
    mockPathname = "/waves/hub/competitions/older";
    const { result } = setup();
    act(() =>
      result.current.updateAvailableTabs({
        waveId: "hub",
        isChatWave: true,
        hasCompetitions: false,
        hasAuthenticatedProfile: false,
        isMemesWave: false,
        isCurationWave: false,
        votingState: WaveVotingState.ONGOING,
        hasFirstDecisionPassed: false,
        defaultCompetitionId: "older",
        defaultSelectionEnabled: true,
      })
    );
    expect(result.current.availableTabs).toContain(
      MyStreamWaveTab.COMPETITIONS
    );
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.COMPETITIONS));
    expect(mockPush).toHaveBeenCalledWith("/waves/hub/competitions", {
      scroll: false,
    });
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
    expect(mockPush).toHaveBeenCalledWith(
      "/waves/legacy/competitions/primary?tab=decisions",
      { scroll: false }
    );
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
      MyStreamWaveTab.ABOUT,
    ]);
    act(() => result.current.setActiveContentTab(MyStreamWaveTab.COMPETITIONS));
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.COMPETITIONS);
    act(() =>
      result.current.updateAvailableTabs({ ...params, hasCompetitions: false })
    );
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
    expect(result.current.availableTabs).toEqual([
      MyStreamWaveTab.CHAT,
      MyStreamWaveTab.ABOUT,
    ]);
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
      MyStreamWaveTab.ABOUT,
    ]);
  });

  it.each([
    [MyStreamWaveTab.FAQ, "42"],
    [MyStreamWaveTab.FAQ, ""],
    [MyStreamWaveTab.SALES, "42"],
    [MyStreamWaveTab.SALES, ""],
  ])(
    "keeps a serial target on Chat ahead of %s (serialNo=%s)",
    (tab, serialNo) => {
      mockPathname = "/waves/serial-wave";
      mockSearch = new URLSearchParams({ tab: tab.toLowerCase(), serialNo });
      const { result, rerender } = setup();
      act(() =>
        result.current.updateAvailableTabs({
          waveId: "serial-wave",
          isChatWave: false,
          hasAuthenticatedProfile: true,
          isMemesWave: tab === MyStreamWaveTab.FAQ,
          isCurationWave: tab === MyStreamWaveTab.SALES,
          votingState: WaveVotingState.ONGOING,
          hasFirstDecisionPassed: false,
          transientPreferredTab: MyStreamWaveTab.CHAT,
        })
      );
      expect(result.current.availableTabs).toContain(tab);
      expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
      mockSearch = new URLSearchParams({ tab: tab.toLowerCase() });
      rerender();
      expect(result.current.activeContentTab).toBe(tab);
    }
  );

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
      MyStreamWaveTab.ABOUT,
    ]);
  });

  it("defaults to CHAT for memes waves", () => {
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
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
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
      MyStreamWaveTab.ABOUT,
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
      MyStreamWaveTab.ABOUT,
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
      MyStreamWaveTab.ABOUT,
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
      MyStreamWaveTab.ABOUT,
    ]);
  });

  it("offers SUBMISSIONS while opening completed waves in CHAT", () => {
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
      MyStreamWaveTab.ABOUT,
    ]);
    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
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
      MyStreamWaveTab.ABOUT,
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
      MyStreamWaveTab.ABOUT,
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

  it("opens a fresh visit in CHAT after a transient tab override", () => {
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

    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
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

  it("opens a fresh visit in CHAT after leaving a transient preferred tab", () => {
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

    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
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

  it("keeps the fallback CHAT when an unavailable tab becomes available again", () => {
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

    expect(result.current.activeContentTab).toBe(MyStreamWaveTab.CHAT);
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
  it.each(["/waves/hub?tab=competitions", "/waves/hub/competitions"])(
    "preserves an explicitly opened collection when its navigation becomes hidden (%s)",
    (url) => {
      const [pathname, query] = url.split("?");
      mockPathname = pathname!;
      mockSearch = new URLSearchParams(query);
      const { result } = setup();
      act(() =>
        result.current.updateAvailableTabs({
          waveId: "hub",
          isChatWave: true,
          hasCompetitions: true,
          hideCompetitionsTab: true,
          hasCompetitionConfiguration: true,
          defaultCompetitionId: "sole",
          defaultSelectionEnabled: true,
          hasAuthenticatedProfile: true,
          isMemesWave: false,
          isCurationWave: false,
          votingState: WaveVotingState.ONGOING,
          hasFirstDecisionPassed: false,
        })
      );
      expect(result.current.availableTabs).not.toContain(
        MyStreamWaveTab.COMPETITIONS
      );
      expect(result.current.availableTabs.slice(-2)).toEqual([
        MyStreamWaveTab.CONFIGURATION,
        MyStreamWaveTab.ABOUT,
      ]);
      expect(result.current.activeContentTab).toBe(
        MyStreamWaveTab.COMPETITIONS
      );
      expect(mockReplace).not.toHaveBeenCalled();
    }
  );
});
