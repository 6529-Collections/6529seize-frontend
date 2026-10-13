import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import MyStreamWave from "@/components/brain/my-stream/MyStreamWave";
import type * as ContentTabContext from "@/components/brain/ContentTabContext";
import { HeaderProvider, useHeaderContext } from "@/contexts/HeaderContext";
import { markMobileLaunchStep } from "@/utils/monitoring/mobileLaunchTiming";
import { useCompetitionEvents } from "@/hooks/competitions/useCompetitionEvents";
import { useWaveData } from "@/hooks/useWaveData";
import { CompetitionState } from "@/components/competitions/CompetitionState";

jest.mock("@/hooks/competitions/useCompetitionEvents", () => ({
  useCompetitionEvents: jest.fn(),
}));

jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  markMobileLaunchStep: jest.fn(),
}));

const markMobileLaunchStepMock = markMobileLaunchStep as jest.Mock;

const mockEditingDropState: {
  editingDropId: string | null;
  setEditingDropId: jest.Mock;
} = {
  editingDropId: null,
  setEditingDropId: jest.fn(),
};

jest.mock("@/contexts/EditingDropContext", () => ({
  useEditingDrop: () => mockEditingDropState,
  EditingDropProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

const mockRegisterWave = jest.fn();
const mockUpdateAvailableTabs = jest.fn();
const mockCompleteInitialRegistration = jest.fn();
const mockSetQueryData = jest.fn();
const mockSetWaveData = jest.fn();
const mockSetViewMode = jest.fn();
const mockToggleViewMode = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockMemesArtSubmissionModal = jest.fn((props: any) =>
  props.isOpen ? <div data-testid="memes-submit-modal" /> : null
);
let mockSearchParams = new URLSearchParams();
let mockPathname = "/waves/wave-1";
const mockWave = {
  id: "wave-1",
  name: "Wave 1",
  chat: { authenticated_user_eligible: true },
  voting: { authenticated_user_eligible: true },
  participation: {
    authenticated_user_eligible: true,
    submission_strategy: null,
  },
  wave: { authenticated_user_eligible_for_admin: false },
  metrics: {},
} as any;
let mockResolvedWave = mockWave;
let mockIsApp = false;
let mockWaveInfo: any;

const getDefaultMockWaveInfo = () => ({
  isRankWave: false,
  isApproveWave: false,
  isMemesWave: false,
  isCurationWave: false,
  isQuorumWave: false,
  isDm: false,
  isChatWave: false,
  participation: {
    canSubmitNow: true,
    currentSubmissions: 0,
    endTime: Date.now() + 60_000,
    hasReachedLimit: false,
    isEligible: true,
    isWithinPeriod: true,
    maxSubmissions: null,
    remainingSubmissions: null,
    startTime: Date.now() - 60_000,
    status: "ACTIVE",
  },
});

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useQueryClient: () => ({
    setQueryData: mockSetQueryData,
  }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock("react-use", () => ({
  createBreakpoint: () => () => "LG",
}));

jest.mock("@/contexts/TitleContext", () => ({
  useSetWaveData: (waveData: unknown) => mockSetWaveData(waveData),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    activeProfileProxy: null,
    connectedProfile: { handle: "tester" },
  }),
}));

jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: {
    DROP: "DROP",
  },
}));

jest.mock("@/components/brain/ContentTabContext", () => ({
  ...jest.requireActual<typeof ContentTabContext>(
    "@/components/brain/ContentTabContext"
  ),
  useContentTab: () => ({
    activeContentTab: "CHAT",
    updateAvailableTabs: mockUpdateAvailableTabs,
  }),
}));

jest.mock("@/hooks/competitions/useWaveCompetitionsTab", () => ({
  useWaveCompetitionsTab: () => ({
    hasCompetitions: false,
    hideCompetitionsTab: false,
    defaultCompetitionId: null,
    defaultSelectionEnabled: false,
  }),
}));

jest.mock("@/hooks/useWaveHasPolls", () => ({
  useWavePollSummary: () => ({ hasPolls: false }),
}));

jest.mock("@/hooks/useWaveTimers", () => ({
  useWaveTimers: () => ({
    voting: { isUpcoming: false, isCompleted: false },
    decisions: { firstDecisionDone: false },
  }),
}));

jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: jest.fn(() => ({
    data: mockResolvedWave,
  })),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    waves: { list: [] },
    directMessages: { list: [] },
    registerWave: mockRegisterWave,
    serverFeedSeed: {
      completeInitialRegistration: mockCompleteInitialRegistration,
    },
  }),
}));

jest.mock("@/hooks/useWaveViewMode", () => ({
  useWaveViewMode: () => ({
    viewMode: "chat",
    setViewMode: mockSetViewMode,
    toggleViewMode: mockToggleViewMode,
  }),
}));

jest.mock("@/hooks/useWave", () => ({
  SubmissionStatus: {
    ACTIVE: "ACTIVE",
    ENDED: "ENDED",
    NOT_STARTED: "NOT_STARTED",
  },
  useWave: () => mockWaveInfo,
}));

jest.mock("@/hooks/waves/useApprovalWaveStatus", () => ({
  useApprovalWaveStatus: () => ({
    isVotingControlsLocked: false,
  }),
}));

jest.mock("@/hooks/waves/useWaveMetadata", () => ({
  useWaveMetadata: () => ({ isPending: false }),
  useWaveOutcomeVisibility: () => true,
  useWaveSubmissionButtonLabelOverride: () => null,
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: mockIsApp }),
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveChat", () => ({
  __esModule: true,
  default: () => <div data-testid="chat" />,
}));

jest.mock(
  "@/components/brain/my-stream/curations/MyStreamWaveCurationContent",
  () => ({
    __esModule: true,
    default: () => <div data-testid="curation" />,
  })
);

jest.mock("@/components/brain/my-stream/MyStreamWaveLeaderboard", () => ({
  __esModule: true,
  default: () => <div data-testid="leaderboard" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveSubmissions", () => ({
  __esModule: true,
  default: () => <div data-testid="submissions" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveOutcome", () => ({
  __esModule: true,
  default: () => <div data-testid="outcome" />,
}));

jest.mock("@/components/waves/winners/WaveWinners", () => ({
  WaveWinners: () => <div data-testid="winners" />,
}));

jest.mock("@/components/brain/my-stream/tabs/MyStreamWaveTabs", () => ({
  MyStreamWaveTabs: () => <div data-testid="tabs" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveDesktopTabs", () => ({
  __esModule: true,
  default: () => <div data-testid="competition-tabs" />,
}));

jest.mock("@/components/waves/memes/MemesArtSubmissionModal", () => ({
  __esModule: true,
  default: (props: any) => mockMemesArtSubmissionModal(props),
}));

jest.mock("@/components/brain/my-stream/votes/MyStreamWaveMyVotes", () => ({
  __esModule: true,
  default: () => <div data-testid="my-votes" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveFAQ", () => ({
  __esModule: true,
  default: () => <div data-testid="faq" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveSales", () => ({
  __esModule: true,
  default: () => <div data-testid="sales" />,
}));

const HeaderActionProbe = () => {
  const { waveDropAction } = useHeaderContext();
  return (
    <div>
      <div data-testid="header-action">{waveDropAction?.label ?? "none"}</div>
      {waveDropAction && (
        <button
          type="button"
          disabled={!waveDropAction.canOpen}
          onClick={waveDropAction.onOpen}
        >
          Open header action
        </button>
      )}
    </div>
  );
};

const renderWave = (editingDropId: string | null = null) => {
  mockEditingDropState.editingDropId = editingDropId;

  return render(
    <HeaderProvider>
      <MyStreamWave waveId="wave-1" />
      <HeaderActionProbe />
    </HeaderProvider>
  );
};

describe("MyStreamWave registration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsApp = false;
    mockWaveInfo = getDefaultMockWaveInfo();
    mockResolvedWave = mockWave;
    mockSearchParams = new URLSearchParams();
    mockPathname = "/waves/wave-1";
    window.history.replaceState(null, "", mockPathname);
  });

  it("registers the mounted wave for direct URL loads", async () => {
    renderWave();
    expect(useCompetitionEvents).toHaveBeenCalledWith("wave-1", true);

    await waitFor(() => {
      expect(mockRegisterWave).toHaveBeenCalledWith("wave-1", true);
      expect(mockCompleteInitialRegistration).toHaveBeenCalledWith("wave-1");
      expect(mockUpdateAvailableTabs).toHaveBeenCalledWith(
        expect.objectContaining({ waveId: "wave-1" })
      );
    });
  });

  it.each([
    "/waves/wave-1/competitions",
    "/waves/wave-1/competitions/alpha",
    "/waves/wave-1/competitions/new",
  ])(
    "keeps the competition error route available on a missing wave (%s)",
    (pathname) => {
      mockPathname = pathname;
      renderWave();
      const options = jest.mocked(useWaveData).mock.calls.at(-1)![0];
      expect(options.onWaveNotFound).toBeUndefined();
      act(() => options.onWaveNotFound?.());
      expect(mockPush).not.toHaveBeenCalled();
    }
  );

  it("renders the competition error and Retry without wave metadata", () => {
    mockPathname = "/waves/wave-1/competitions/alpha";
    mockResolvedWave = undefined;
    const retry = jest.fn();
    render(
      <HeaderProvider>
        <MyStreamWave
          waveId="wave-1"
          competitionContent={<CompetitionState error retry={retry} />}
        />
      </HeaderProvider>
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This competition could not be loaded"
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("keeps ordinary absent-wave content empty", () => {
    mockResolvedWave = undefined;
    render(
      <HeaderProvider>
        <MyStreamWave
          waveId="wave-1"
          competitionContent={<CompetitionState error retry={jest.fn()} />}
        />
      </HeaderProvider>
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByTestId("chat")).toBeNull();
  });

  it.each([
    ["/waves/wave-1", "/waves"],
    ["/messages/wave-1", "/messages"],
  ])(
    "still clears an ordinary missing-wave route (%s)",
    (pathname, destination) => {
      mockPathname = pathname;
      mockSearchParams = new URLSearchParams("wave=wave-1&serialNo=23");
      window.history.replaceState(null, "", `${pathname}?${mockSearchParams}`);
      renderWave();
      const options = jest.mocked(useWaveData).mock.calls.at(-1)![0];
      expect(options.onWaveNotFound).toBeDefined();
      act(() => options.onWaveNotFound?.());
      expect(mockPush).toHaveBeenCalledWith(`${destination}?serialNo=23`, {
        scroll: false,
      });
    }
  );

  it.each([
    "/waves/wave-1/competitions/alpha?tab=leaderboard",
    "/waves/wave-2?tab=chat",
    "/network?wave=wave-1",
  ])(
    "ignores a captured missing-wave callback after moving to %s",
    (target) => {
      renderWave();
      const callback = jest.mocked(useWaveData).mock.calls.at(-1)![0]
        .onWaveNotFound;
      expect(callback).toBeDefined();
      window.history.replaceState(null, "", target);
      act(() => callback?.());
      expect(mockPush).not.toHaveBeenCalled();
    }
  );

  it("renders embedded competition tabs without a second wave header", () => {
    render(
      <HeaderProvider>
        <MyStreamWave waveId="wave-1" competitionOnly />
      </HeaderProvider>
    );
    expect(screen.getByTestId("competition-tabs")).toBeVisible();
    expect(useCompetitionEvents).toHaveBeenCalledWith("wave-1", false);
    expect(screen.queryByTestId("tabs")).not.toBeInTheDocument();
  });

  it("marks wave metadata as loaded for launch timing", async () => {
    renderWave();

    await waitFor(() => {
      expect(markMobileLaunchStepMock).toHaveBeenCalledWith(
        "wave_metadata_loaded"
      );
    });
  });

  it("exposes the app header drop action outside edit mode", async () => {
    mockIsApp = true;

    renderWave();

    await waitFor(() => {
      expect(screen.getByTestId("header-action")).toHaveTextContent(
        "Submit drop"
      );
    });
    expect(screen.queryByTestId("competition-tabs")).not.toBeInTheDocument();
    expect(mockUpdateAvailableTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        waveId: "wave-1",
        hasAuthenticatedProfile: true,
        votingState: "ONGOING",
      })
    );
  });

  it("does not expose the app header drop action while editing", async () => {
    mockIsApp = true;

    renderWave("drop-1");

    await waitFor(() => {
      expect(screen.getByTestId("header-action")).toHaveTextContent("none");
    });
  });

  it("exposes the app header memes submit action", async () => {
    mockIsApp = true;
    mockWaveInfo = {
      ...getDefaultMockWaveInfo(),
      isMemesWave: true,
    };

    renderWave();

    await waitFor(() => {
      expect(screen.getByTestId("header-action")).toHaveTextContent(
        "Submit Work to The Memes"
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Open header action" }));

    expect(screen.getByTestId("memes-submit-modal")).toBeInTheDocument();
  });
});
