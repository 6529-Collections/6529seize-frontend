import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import BrainMobile from "@/components/brain/BrainMobile";
import { BrainView } from "@/components/brain/mobile/brainMobileViews";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, height, src, width }: any) => (
    <span
      aria-label={alt || undefined}
      data-next-image-height={height}
      data-next-image-src={typeof src === "string" ? src : src?.src}
      data-next-image-width={width}
      role={alt ? "img" : undefined}
    />
  ),
}));

let mockSearchParams = new URLSearchParams();
let mockPathname = "/";
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => mockPathname,
}));

let isApp = true;
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp }),
}));

let mockActiveWaveId: string | null = null;
const mockSetActiveWave = jest.fn();
const mockRequestMainWavesList = jest.fn(() => jest.fn());
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => ({
    activeWave: {
      id: mockActiveWaveId,
      set: mockSetActiveWave,
    },
    requestMainWavesList: mockRequestMainWavesList,
  }),
}));

const mockClearLastVisited = jest.fn();
jest.mock("@/components/navigation/ViewContext", () => ({
  useViewContext: () => ({
    clearLastVisited: mockClearLastVisited,
  }),
}));

let dropData: any = null;
let waveData: any = null;
let mockIsCompleted = false;
let mockFirstDecisionDone = true;

jest.mock("@tanstack/react-query", () => ({
  keepPreviousData: {},
  useQuery: jest.fn(() => ({ data: dropData })),
}));

jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: () => ({ data: waveData }),
}));

const mockUseWave = jest.fn();
jest.mock("@/hooks/useWave", () => ({
  useWave: (...args: any[]) => mockUseWave(...args),
}));

jest.mock("@/hooks/useWaveTimers", () => ({
  useWaveTimers: () => ({
    voting: { isCompleted: mockIsCompleted },
    decisions: { firstDecisionDone: mockFirstDecisionDone },
  }),
}));

let mockOutcomesVisible = true;
jest.mock("@/hooks/waves/useWaveMetadata", () => ({
  useWaveOutcomeVisibility: () => mockOutcomesVisible,
  useWaveSubmissionButtonLabelOverride: () => null,
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/brain/BrainDesktopDrop", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="drop" onClick={props.onClose}>
      drop
    </div>
  ),
}));

let latestTabsProps: any = null;
jest.mock("@/components/brain/mobile/BrainMobileTabs", () => ({
  __esModule: true,
  default: (props: any) => {
    latestTabsProps = props;
    return <div data-testid="tabs" />;
  },
}));

const mockMobileWaveSubwavesBar = jest.fn(() => (
  <div data-testid="mobile-subwaves-bar" />
));
jest.mock("@/components/brain/mobile/MobileWaveSubwavesBar", () => ({
  __esModule: true,
  default: (props: any) => mockMobileWaveSubwavesBar(props),
}));

jest.mock("@/components/brain/mobile/BrainMobileAbout", () => ({
  __esModule: true,
  default: () => <div data-testid="about" />,
}));

const mockBrainMobileWaves = jest.fn(
  ({ onOpenQuickVote }: { readonly onOpenQuickVote: () => void }) => (
    <div data-testid="waves">
      <button type="button" onClick={onOpenQuickVote}>
        Open quick vote from waves footer
      </button>
    </div>
  )
);
jest.mock("@/components/brain/mobile/BrainMobileWaves", () => ({
  __esModule: true,
  default: (props: any) => mockBrainMobileWaves(props),
}));

const mockCommunityCurations = jest.fn(() => (
  <div data-testid="profile-feed" />
));
jest.mock("@/components/community-curations/CommunityCurations", () => ({
  __esModule: true,
  default: (props: any) => mockCommunityCurations(props),
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ mobileWavesViewStyle: { height: "42px" } }),
}));

jest.mock("@/components/brain/mobile/BrainMobileMessages", () => ({
  __esModule: true,
  default: () => <div data-testid="messages" />,
}));

let mockDialogMountCount = 0;
jest.mock(
  "@/components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteRuntimeLoader",
  () => ({
    __esModule: true,
    LazyMemesQuickVoteRuntime: ({
      intent,
      onIdle,
    }: {
      readonly intent: { readonly id: number };
      readonly onIdle: () => void;
    }) => {
      const React = require("react");

      React.useEffect(() => {
        mockDialogMountCount += 1;
      }, []);

      return (
        <div data-testid="quick-vote-dialog">
          <div>Session {intent.id}</div>
          <button
            type="button"
            onClick={() => {
              onIdle();
            }}
          >
            Close Quick Vote
          </button>
        </div>
      );
    },
    useMemesQuickVoteRuntimeLauncher: () => {
      const React = require("react");
      const [runtimeIntent, setRuntimeIntent] = React.useState(null);
      const nextIntentIdRef = React.useRef(0);

      return {
        openQuickVote: () => {
          nextIntentIdRef.current += 1;
          setRuntimeIntent({
            action: "open",
            id: nextIntentIdRef.current,
          });
        },
        prefetchQuickVote: jest.fn(),
        resetQuickVoteRuntime: () => setRuntimeIntent(null),
        runtimeIntent,
        shouldMountRuntime: runtimeIntent !== null,
      };
    },
  })
);

jest.mock("@/components/brain/notifications/NotificationsContainer", () => ({
  __esModule: true,
  default: () => <div data-testid="notifications" />,
}));

const mockCreateWaveModal = jest.fn(
  ({
    isOpen,
    onClose,
  }: {
    readonly isOpen: boolean;
    readonly onClose: () => void;
  }) =>
    isOpen ? (
      <button type="button" onClick={onClose}>
        Close create wave
      </button>
    ) : null
);
jest.mock("@/components/waves/create-wave/CreateWaveModal", () => ({
  __esModule: true,
  default: (props: any) => mockCreateWaveModal(props),
}));

const mockCreateDirectMessageModal = jest.fn(
  ({
    isOpen,
    onClose,
  }: {
    readonly isOpen: boolean;
    readonly onClose: () => void;
  }) =>
    isOpen ? (
      <button type="button" onClick={onClose}>
        Close create dm
      </button>
    ) : null
);
jest.mock("@/components/waves/create-dm/CreateDirectMessageModal", () => ({
  __esModule: true,
  default: (props: any) => mockCreateDirectMessageModal(props),
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveLeaderboard", () => ({
  __esModule: true,
  default: () => <div data-testid="leaderboard" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveOutcome", () => ({
  __esModule: true,
  default: () => <div data-testid="outcome" />,
}));

const mockMyStreamWaveSales = jest.fn(() => <div data-testid="sales" />);
jest.mock("@/components/brain/my-stream/MyStreamWaveSales", () => ({
  __esModule: true,
  default: (props: any) => mockMyStreamWaveSales(props),
}));

jest.mock("@/components/waves/winners/WaveWinners", () => ({
  __esModule: true,
  WaveWinners: () => <div data-testid="winners" />,
}));

jest.mock("@/components/brain/my-stream/votes/MyStreamWaveMyVotes", () => ({
  __esModule: true,
  default: () => <div data-testid="myvotes" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveFAQ", () => ({
  __esModule: true,
  default: () => <div data-testid="faq" />,
}));

const { useAuth } = require("@/components/auth/Auth");

// Tests

describe("BrainMobile", () => {
  const createWave = (isDirectMessage = false) =>
    ({
      id: "1",
      chat: {
        scope: {
          group: {
            is_direct_message: isDirectMessage,
          },
        },
      },
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockPathname = "/";
    mockPush.mockClear();
    mockReplace.mockClear();
    dropData = null;
    waveData = null;
    isApp = true;
    mockActiveWaveId = null;
    mockSetActiveWave.mockClear();
    mockRequestMainWavesList.mockClear();
    mockClearLastVisited.mockClear();
    mockIsCompleted = false;
    mockFirstDecisionDone = true;
    mockOutcomesVisible = true;
    latestTabsProps = null;
    mockDialogMountCount = 0;
    mockCreateWaveModal.mockClear();
    mockCreateDirectMessageModal.mockClear();
    mockMobileWaveSubwavesBar.mockClear();
    globalThis.history.replaceState(null, "", "/");
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: { handle: "alice" },
    });
    mockUseWave.mockImplementation((incomingWave?: any) => ({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: true,
      isDm: incomingWave?.chat?.scope?.group?.is_direct_message ?? false,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    globalThis.history.replaceState(null, "", "/");
  });

  it("renders BrainDesktopDrop when drop is open", () => {
    mockSearchParams.set("drop", "d1");
    dropData = { id: "d1" };
    render(<BrainMobile>child</BrainMobile>);
    expect(screen.getByTestId("drop")).toBeInTheDocument();
  });

  it("shows notifications view when path matches", async () => {
    mockPathname = "/notifications";
    render(<BrainMobile>child</BrainMobile>);
    await waitFor(() => {
      expect(screen.getByTestId("notifications")).toBeInTheDocument();
    });
    expect(mockDialogMountCount).toBe(0);
  });

  it("shows tabs only when wave active or not in app", async () => {
    isApp = true;
    render(<BrainMobile>child</BrainMobile>);
    expect(screen.queryByTestId("tabs")).toBeNull();
    expect(mockDialogMountCount).toBe(0);

    mockSearchParams.set("wave", "1");
    const { rerender } = render(<BrainMobile>child</BrainMobile>);
    await waitFor(() => expect(screen.getByTestId("tabs")).toBeInTheDocument());
    rerender(<div />);
  });

  it.each([
    { pathname: "/messages", testId: "messages" },
    { pathname: "/notifications", testId: "notifications" },
  ])(
    "does not load quick-vote stats on the $pathname shell",
    async ({ pathname, testId }) => {
      mockPathname = pathname;

      render(<BrainMobile>child</BrainMobile>);

      await waitFor(() => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      });

      expect(mockDialogMountCount).toBe(0);
    }
  );

  it("keeps quick vote out of the default wave chat view in app", async () => {
    mockSearchParams.set("wave", "1");
    waveData = createWave(false);

    render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("tabs")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("waves")).toBeNull();
    expect(screen.queryByTestId("quick-vote-dialog")).toBeNull();
    expect(mockDialogMountCount).toBe(0);
    expect(screen.getByTestId("mobile-subwaves-bar")).toBeInTheDocument();
    expect(mockMobileWaveSubwavesBar).toHaveBeenCalledWith({
      wave: waveData,
    });
  });

  it("returns from an app wave detail to the waves list on edge swipe", async () => {
    mockPathname = "/waves/1";
    mockActiveWaveId = "1";
    waveData = createWave(false);

    render(<BrainMobile>child</BrainMobile>);

    const waveContent = await screen.findByText("child");
    fireEvent.touchStart(waveContent, {
      touches: [{ clientX: 10, clientY: 100 }],
    });
    fireEvent.touchMove(waveContent, {
      touches: [{ clientX: 60, clientY: 104 }],
    });
    fireEvent.touchEnd(waveContent, {
      changedTouches: [{ clientX: 100, clientY: 106 }],
    });

    expect(mockRequestMainWavesList).toHaveBeenCalledTimes(1);
    expect(mockClearLastVisited).toHaveBeenCalledWith("wave");
    expect(mockSetActiveWave).toHaveBeenCalledWith(null, {
      isDirectMessage: false,
    });
  });

  it.each([
    { app: false, pathname: "/waves/1", query: "" },
    { app: true, pathname: "/messages/1", query: "" },
    { app: true, pathname: "/waves/1", query: "drop=drop-1" },
    { app: true, pathname: "/waves/1", query: "create=wave" },
  ])(
    "does not enable wave-list swipe for app=$app path=$pathname query=$query",
    async ({ app, pathname, query }) => {
      isApp = app;
      mockPathname = pathname;
      mockSearchParams = new URLSearchParams(query);
      mockActiveWaveId = "1";
      waveData = createWave(pathname.startsWith("/messages/"));

      render(<BrainMobile>child</BrainMobile>);

      const waveContent = await screen.findByText("child");
      fireEvent.touchStart(waveContent, {
        touches: [{ clientX: 10, clientY: 100 }],
      });
      fireEvent.touchEnd(waveContent, {
        changedTouches: [{ clientX: 100, clientY: 100 }],
      });

      expect(mockRequestMainWavesList).not.toHaveBeenCalled();
      expect(mockClearLastVisited).not.toHaveBeenCalled();
      expect(mockSetActiveWave).not.toHaveBeenCalled();
    }
  );

  it("keeps My Votes unavailable for guests on memes waves", async () => {
    mockSearchParams.set("wave", "1");
    waveData = createWave(false);
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: null,
    });
    mockUseWave.mockReturnValue({
      isMemesWave: true,
      isCurationWave: false,
      isRankWave: true,
      isDm: false,
    });

    render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => expect(screen.getByTestId("tabs")).toBeInTheDocument());

    act(() => {
      latestTabsProps.onViewChange(BrainView.MY_VOTES);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("myvotes")).toBeNull();
      expect(screen.getByText("child")).toBeInTheDocument();
    });
  });

  it("keeps the quick-vote runtime off the idle waves shell", async () => {
    mockPathname = "/waves";

    render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("waves")).toBeInTheDocument();
    });

    expect(mockDialogMountCount).toBe(0);
    expect(screen.queryByTestId("quick-vote-dialog")).toBeNull();
  });

  it("shows the profile feed for app /waves?view=profile-feed without quick vote", async () => {
    mockPathname = "/waves";
    mockSearchParams = new URLSearchParams("view=profile-feed");

    render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("profile-feed")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("waves")).toBeNull();
    expect(mockBrainMobileWaves).not.toHaveBeenCalled();
    expect(mockDialogMountCount).toBe(0);
  });

  it("drops a stale local tab selection when navigation context changes", async () => {
    mockSearchParams.set("wave", "1");
    waveData = createWave(false);

    const { rerender } = render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => expect(screen.getByTestId("tabs")).toBeInTheDocument());

    act(() => {
      latestTabsProps.onViewChange(BrainView.ABOUT);
    });

    await waitFor(() => {
      expect(screen.getByTestId("about")).toBeInTheDocument();
    });

    mockSearchParams.delete("wave");
    mockPathname = "/messages";
    waveData = null;
    rerender(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("messages")).toBeInTheDocument();
      expect(screen.queryByTestId("about")).toBeNull();
    });
  });

  it("does not resurrect a stale tab selection when revisiting a wave", async () => {
    mockSearchParams.set("wave", "1");
    waveData = createWave(false);

    const { rerender } = render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => expect(screen.getByTestId("tabs")).toBeInTheDocument());

    act(() => {
      latestTabsProps.onViewChange(BrainView.ABOUT);
    });

    await waitFor(() => {
      expect(screen.getByTestId("about")).toBeInTheDocument();
    });

    mockSearchParams.set("wave", "2");
    waveData = { ...createWave(false), id: "2" };
    rerender(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.queryByTestId("about")).toBeNull();
      expect(screen.getByText("child")).toBeInTheDocument();
    });

    mockSearchParams.set("wave", "1");
    waveData = createWave(false);
    rerender(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.queryByTestId("about")).toBeNull();
      expect(screen.getByText("child")).toBeInTheDocument();
    });
  });

  it("keeps the selected shell tab when web create modal query changes", async () => {
    isApp = false;
    mockPathname = "/waves";

    const { rerender } = render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("waves")).toBeInTheDocument();
      expect(screen.getByTestId("tabs")).toBeInTheDocument();
    });

    act(() => {
      latestTabsProps.onViewChange(BrainView.MESSAGES);
    });

    await waitFor(() => {
      expect(screen.getByTestId("messages")).toBeInTheDocument();
      expect(screen.queryByTestId("waves")).toBeNull();
    });

    mockSearchParams.set("create", "wave");
    rerender(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("messages")).toBeInTheDocument();
      expect(screen.queryByTestId("waves")).toBeNull();
    });

    mockSearchParams.delete("create");
    rerender(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("messages")).toBeInTheDocument();
      expect(screen.queryByTestId("waves")).toBeNull();
    });
  });

  it("closes app create overlay by replacing only the create query param", () => {
    isApp = true;
    mockPathname = "/waves";
    mockSearchParams = new URLSearchParams(
      "view=following&create=wave&drop=d1"
    );
    globalThis.history.replaceState(
      null,
      "",
      "/waves?view=following&create=wave&drop=d1"
    );
    const replaceState = jest.spyOn(globalThis.history, "replaceState");

    render(<BrainMobile>child</BrainMobile>);

    fireEvent.click(screen.getByRole("button", { name: "Close create wave" }));

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/waves?view=following&drop=d1"
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("loads and reuses the page-owned quick-vote runtime across repeated waves footer openings", async () => {
    mockPathname = "/waves";

    render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("waves")).toBeInTheDocument();
    });

    expect(mockDialogMountCount).toBe(0);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open quick vote from waves footer",
      })
    );

    await waitFor(() => {
      expect(screen.getByText("Session 1")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Close Quick Vote" }));
    expect(screen.queryByTestId("quick-vote-dialog")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open quick vote from waves footer",
      })
    );

    await waitFor(() => {
      expect(screen.getByText("Session 2")).toBeInTheDocument();
    });
    expect(mockDialogMountCount).toBe(2);
  });

  it("renders the Sales view for non-rank curation waves and falls back when unavailable", async () => {
    mockSearchParams.set("wave", "1");
    waveData = { id: "1", wave: { type: "APPROVE" } };
    mockUseWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      isRankWave: false,
      isDm: false,
    });

    const { rerender } = render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => expect(screen.getByTestId("tabs")).toBeInTheDocument());

    act(() => {
      latestTabsProps.onViewChange(BrainView.SALES);
    });

    await waitFor(() =>
      expect(screen.getByTestId("sales")).toBeInTheDocument()
    );
    expect(mockMyStreamWaveSales).toHaveBeenCalledWith({ waveId: "1" });

    mockUseWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: false,
      isDm: false,
    });
    rerender(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.queryByTestId("sales")).toBeNull();
      expect(screen.getByText("child")).toBeInTheDocument();
    });
  });

  it("falls back to default when a rank-only view becomes unavailable", async () => {
    mockSearchParams.set("wave", "1");
    waveData = createWave(false);

    const { rerender } = render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => expect(screen.getByTestId("tabs")).toBeInTheDocument());

    act(() => {
      latestTabsProps.onViewChange(BrainView.OUTCOME);
    });

    await waitFor(() =>
      expect(screen.getByTestId("outcome")).toBeInTheDocument()
    );

    mockUseWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: false,
      isDm: false,
    });
    rerender(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.queryByTestId("outcome")).toBeNull();
      expect(screen.getByText("child")).toBeInTheDocument();
    });
  });

  it("falls back to default when winners becomes unavailable", async () => {
    mockSearchParams.set("wave", "1");
    waveData = createWave(false);
    mockFirstDecisionDone = true;

    const { rerender } = render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => expect(screen.getByTestId("tabs")).toBeInTheDocument());

    act(() => {
      latestTabsProps.onViewChange(BrainView.WINNERS);
    });

    await waitFor(() =>
      expect(screen.getByTestId("winners")).toBeInTheDocument()
    );

    mockFirstDecisionDone = false;
    rerender(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.queryByTestId("winners")).toBeNull();
      expect(screen.getByText("child")).toBeInTheDocument();
    });
  });
});
