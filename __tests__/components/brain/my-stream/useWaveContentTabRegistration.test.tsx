import { createMockApiWave } from "@/__tests__/utils/mockFactories";
import type * as ContentTabContext from "@/components/brain/ContentTabContext";
import { WaveVotingState } from "@/components/brain/ContentTabContext";
import { useWaveContentTabRegistration } from "@/components/brain/my-stream/useWaveContentTabRegistration";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWavePollSummary } from "@/hooks/useWaveHasPolls";
import { MyStreamWaveTab } from "@/types/waves.types";
import { renderHook } from "@testing-library/react";

const updateAvailableTabs = jest.fn();
const setActiveTab = jest.fn();
const createWaveInfo = () => ({
  isChatWave: false,
  isApproveWave: false,
  isMemesWave: false,
  isCurationWave: false,
  isRankWave: false,
});
let mockWaveInfo = createWaveInfo();
let mockPathname = "/waves/wave-1";
let mockSearch = new URLSearchParams();
let mockConnectedHandle: string | null = "alice";
let mockVoting = { isUpcoming: false, isCompleted: false };
let mockFirstDecisionDone = false;
let mockOutcomesVisible = true;
let mockHasPolls = false;
let mockFlat = false;

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearch,
}));

jest.mock("@/components/brain/ContentTabContext", () => {
  const actual = jest.requireActual<typeof ContentTabContext>(
    "@/components/brain/ContentTabContext"
  );
  return {
    ...actual,
    useContentTab: () => ({
      activeContentTab: MyStreamWaveTab.LEADERBOARD,
      availableTabs: [MyStreamWaveTab.CHAT, MyStreamWaveTab.LEADERBOARD],
      updateAvailableTabs,
      setActiveContentTab: setActiveTab,
    }),
  };
});

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile:
      mockConnectedHandle === null ? null : { handle: mockConnectedHandle },
  }),
}));

jest.mock("@/contexts/CompetitionNavigationContext", () => ({
  useCompetitionNavigation: () => ({ flat: mockFlat, nativeCompetition: null }),
}));

jest.mock("@/hooks/competitions/useWaveCompetitionsTab", () => ({
  useWaveCompetitionsTab: () => ({
    hasCompetitions: false,
    hideCompetitionsTab: false,
    defaultCompetitionId: null,
    defaultSelectionEnabled: false,
  }),
}));

jest.mock("@/hooks/useWave", () => ({
  useWave: () => mockWaveInfo,
}));

jest.mock("@/hooks/useWaveHasPolls", () => ({
  useWavePollSummary: jest.fn(() => ({ hasPolls: mockHasPolls })),
}));

jest.mock("@/hooks/useWaveTimers", () => ({
  useWaveTimers: () => ({
    voting: mockVoting,
    decisions: { firstDecisionDone: mockFirstDecisionDone },
  }),
}));

jest.mock("@/hooks/waves/useWaveMetadata", () => ({
  useWaveMetadata: () => ({ isPending: false }),
  useWaveOutcomeVisibility: () => mockOutcomesVisible,
}));

const wave = createMockApiWave({ id: "wave-1" });

describe("useWaveContentTabRegistration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWaveInfo = createWaveInfo();
    mockPathname = "/waves/wave-1";
    mockSearch = new URLSearchParams();
    mockConnectedHandle = "alice";
    mockVoting = { isUpcoming: false, isCompleted: false };
    mockFirstDecisionDone = false;
    mockOutcomesVisible = true;
    mockHasPolls = false;
    mockFlat = false;
  });

  it.each(["isRankWave", "isApproveWave"] as const)(
    "registers Configuration for a flat legacy app rules route (%s)",
    (waveType) => {
      mockFlat = true;
      mockPathname = "/waves/wave-1/competitions/legacy";
      mockSearch.set("tab", "rules");
      mockWaveInfo[waveType] = true;

      renderHook(() => useWaveContentTabRegistration(wave, false));

      expect(updateAvailableTabs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          waveId: "wave-1",
          hasCompetitionConfiguration: true,
          defaultCompetitionId: "legacy",
        })
      );
    }
  );

  it("retains a directly selected competition while default data is unavailable", () => {
    mockPathname = "/waves/wave-1/competitions/older";
    mockWaveInfo.isChatWave = true;
    mockSearch.set("competition", "stale");

    renderHook(() => useWaveContentTabRegistration(wave, false));

    expect(updateAvailableTabs).toHaveBeenLastCalledWith(
      expect.objectContaining({
        defaultCompetitionId: "older",
      })
    );
  });

  it("registers an explicitly selected chat competition from the query without default data", () => {
    mockWaveInfo.isChatWave = true;
    mockSearch.set("competition", "older");

    renderHook(() => useWaveContentTabRegistration(wave, false));

    expect(updateAvailableTabs).toHaveBeenLastCalledWith(
      expect.objectContaining({
        defaultCompetitionId: "older",
        hasCompetitionConfiguration: true,
      })
    );
  });

  it("passes curation flag into tab availability update", () => {
    mockWaveInfo.isCurationWave = true;

    renderHook(() => useWaveContentTabRegistration(wave, false));

    expect(updateAvailableTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        isChatWave: false,
        hasAuthenticatedProfile: true,
        isMemesWave: false,
        isCurationWave: true,
        isApproveWave: false,
      })
    );
  });

  it("forces a transient switch to Chat when serialNo is present", () => {
    mockSearch.set("serialNo", "42");

    renderHook(() => useWaveContentTabRegistration(wave, false));

    expect(updateAvailableTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        transientPreferredTab: MyStreamWaveTab.CHAT,
      })
    );
    expect(setActiveTab).not.toHaveBeenCalled();
  });

  it("registers ended voting and hidden Outcome with the current authentication state", () => {
    mockWaveInfo.isRankWave = true;
    mockConnectedHandle = null;
    mockVoting.isCompleted = true;
    mockFirstDecisionDone = true;
    mockOutcomesVisible = false;
    mockHasPolls = true;

    const { rerender } = renderHook(() =>
      useWaveContentTabRegistration(wave, false)
    );

    expect(updateAvailableTabs).toHaveBeenLastCalledWith(
      expect.objectContaining({
        waveId: "wave-1",
        hasAuthenticatedProfile: false,
        showOutcomeTab: false,
        votingState: WaveVotingState.ENDED,
        hasFirstDecisionPassed: true,
        hasPolls: true,
      })
    );

    mockConnectedHandle = "alice";
    rerender();

    expect(updateAvailableTabs).toHaveBeenLastCalledWith(
      expect.objectContaining({
        hasAuthenticatedProfile: true,
        showOutcomeTab: false,
        votingState: WaveVotingState.ENDED,
      })
    );
  });

  it.each<[boolean, boolean, WaveVotingState]>([
    [true, false, WaveVotingState.NOT_STARTED],
    [false, false, WaveVotingState.ONGOING],
    [false, true, WaveVotingState.ENDED],
  ])(
    "registers voting state for upcoming=%s completed=%s",
    (isUpcoming, isCompleted, votingState) => {
      mockVoting = { isUpcoming, isCompleted };

      renderHook(() => useWaveContentTabRegistration(wave, false));

      expect(updateAvailableTabs).toHaveBeenLastCalledWith(
        expect.objectContaining({ votingState })
      );
    }
  );

  it("waits for wave data before registering availability or enabling its polls", () => {
    const initialProps: { readonly loadedWave: ApiWave | undefined } = {
      loadedWave: undefined,
    };
    const { rerender } = renderHook(
      ({ loadedWave }) => useWaveContentTabRegistration(loadedWave, false),
      { initialProps }
    );

    expect(updateAvailableTabs).not.toHaveBeenCalled();
    expect(useWavePollSummary).toHaveBeenLastCalledWith({
      waveId: undefined,
      enabled: false,
    });

    rerender({ loadedWave: wave });

    expect(updateAvailableTabs).toHaveBeenLastCalledWith(
      expect.objectContaining({ waveId: "wave-1" })
    );
    expect(useWavePollSummary).toHaveBeenLastCalledWith({
      waveId: "wave-1",
      enabled: true,
    });
  });
});
