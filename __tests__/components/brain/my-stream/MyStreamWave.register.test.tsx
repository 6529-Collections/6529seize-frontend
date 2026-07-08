import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MyStreamWave from "@/components/brain/my-stream/MyStreamWave";
import { HeaderProvider, useHeaderContext } from "@/contexts/HeaderContext";
import { markMobileLaunchStep } from "@/utils/monitoring/mobileLaunchTiming";

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
const mockSetQueryData = jest.fn();
const mockSetWaveData = jest.fn();
const mockSetViewMode = jest.fn();
const mockToggleViewMode = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockMemesArtSubmissionModal = jest.fn((props: any) =>
  props.isOpen ? <div data-testid="memes-submit-modal" /> : null
);
const mockSearchParams = {
  get: jest.fn(),
  toString: jest.fn(),
};
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
  usePathname: () => "/waves/wave-1",
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
  useContentTab: () => ({
    activeContentTab: "CHAT",
  }),
}));

jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: () => ({
    data: mockWave,
  }),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    waves: { list: [] },
    directMessages: { list: [] },
    registerWave: mockRegisterWave,
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
    mockSearchParams.get.mockReturnValue(null);
    mockSearchParams.toString.mockReturnValue("");
  });

  it("registers the mounted wave for direct URL loads", async () => {
    renderWave();

    await waitFor(() => {
      expect(mockRegisterWave).toHaveBeenCalledWith("wave-1", true);
    });
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
