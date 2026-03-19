import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import BrainMobile, { BrainView } from "@/components/brain/BrainMobile";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

let mockSearchParams = new URLSearchParams();
let mockPathname = "/";
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => mockPathname,
}));

let isApp = true;
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp }),
}));

let dropData: any = null;
let waveData: any = null;

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

const mockUseMemesWaveFooterStats = jest.fn();
jest.mock("@/hooks/useMemesWaveFooterStats", () => ({
  useMemesWaveFooterStats: () => mockUseMemesWaveFooterStats(),
}));

jest.mock("@/hooks/useWaveTimers", () => ({
  useWaveTimers: () => ({
    voting: { isCompleted: false },
    decisions: { firstDecisionDone: true },
  }),
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

jest.mock("@/components/brain/mobile/BrainMobileMessages", () => ({
  __esModule: true,
  default: () => <div data-testid="messages" />,
}));

jest.mock(
  "@/components/brain/left-sidebar/waves/MemesWaveQuickVoteTrigger",
  () => ({
    __esModule: true,
    default: ({
      onOpenQuickVote,
      unratedCount,
    }: {
      readonly onOpenQuickVote: () => void;
      readonly unratedCount: number;
    }) => (
      <button
        type="button"
        data-testid="quick-vote-trigger"
        onClick={onOpenQuickVote}
      >
        {unratedCount}
      </button>
    ),
  })
);

let mockDialogMountCount = 0;
jest.mock(
  "@/components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteDialog",
  () => ({
    __esModule: true,
    default: ({
      isOpen,
      onClose,
      sessionId,
    }: {
      readonly isOpen: boolean;
      readonly sessionId: number;
      readonly onClose: () => void;
    }) => {
      const React = require("react");

      React.useEffect(() => {
        mockDialogMountCount += 1;
      }, []);

      return isOpen ? (
        <div data-testid="quick-vote-dialog">
          <div>Session {sessionId}</div>
          <button type="button" onClick={onClose}>
            Close Quick Vote
          </button>
        </div>
      ) : null;
    },
  })
);

jest.mock("@/components/brain/notifications/NotificationsContainer", () => ({
  __esModule: true,
  default: () => <div data-testid="notifications" />,
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
    dropData = null;
    waveData = null;
    isApp = true;
    latestTabsProps = null;
    mockDialogMountCount = 0;
    mockUseWave.mockImplementation((incomingWave?: any) => ({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: true,
      isDm: incomingWave?.chat?.scope?.group?.is_direct_message ?? false,
    }));
    mockUseMemesWaveFooterStats.mockReturnValue({
      isReady: true,
      uncastPower: 5000,
      unratedCount: 3,
      votingLabel: "TDH",
    });
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
    expect(mockUseMemesWaveFooterStats).not.toHaveBeenCalled();
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

      expect(mockUseMemesWaveFooterStats).not.toHaveBeenCalled();
      expect(mockDialogMountCount).toBe(0);
    }
  );

  it("shows the floating quick-vote trigger for non-DM wave chat in app", async () => {
    mockSearchParams.set("wave", "1");
    waveData = createWave(false);

    render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("quick-vote-trigger")).toBeInTheDocument();
    });

    expect(mockUseMemesWaveFooterStats).toHaveBeenCalled();
    expect(mockDialogMountCount).toBe(1);
  });

  it("keeps the floating quick-vote trigger inside the flex pane wrapper", async () => {
    mockSearchParams.set("wave", "1");
    waveData = createWave(false);

    const { container } = render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("quick-vote-trigger")).toBeInTheDocument();
    });

    const activePane = container.querySelector(
      ".tw-relative.tw-min-w-0.tw-flex-1"
    );

    expect(activePane).not.toBeNull();
    expect(activePane).toContainElement(
      screen.getByTestId("quick-vote-trigger")
    );
  });

  it("hides the floating quick-vote trigger for DM wave chat", async () => {
    mockSearchParams.set("wave", "1");
    waveData = createWave(true);

    render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.queryByTestId("quick-vote-trigger")).toBeNull();
    });

    expect(mockUseMemesWaveFooterStats).not.toHaveBeenCalled();
    expect(mockDialogMountCount).toBe(0);
  });

  it("mounts the quick-vote dialog owner on the waves shell", async () => {
    mockPathname = "/waves";

    render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("waves")).toBeInTheDocument();
    });

    expect(mockDialogMountCount).toBe(1);
    expect(screen.queryByTestId("quick-vote-dialog")).toBeNull();
  });

  it("hides the floating quick-vote trigger when leaving chat view", async () => {
    mockSearchParams.set("wave", "1");
    waveData = createWave(false);

    render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("quick-vote-trigger")).toBeInTheDocument();
      expect(screen.getByTestId("tabs")).toBeInTheDocument();
    });

    act(() => {
      latestTabsProps.onViewChange(BrainView.ABOUT);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("quick-vote-trigger")).toBeNull();
      expect(screen.getByTestId("about")).toBeInTheDocument();
    });
  });

  it("reuses the page-owned quick-vote dialog across floating and waves entry points", async () => {
    mockSearchParams.set("wave", "1");
    waveData = createWave(false);

    const { rerender } = render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("quick-vote-trigger")).toBeInTheDocument();
    });

    expect(mockDialogMountCount).toBe(1);

    fireEvent.click(screen.getByTestId("quick-vote-trigger"));
    expect(screen.getByText("Session 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close Quick Vote" }));
    expect(screen.queryByTestId("quick-vote-dialog")).not.toBeInTheDocument();
    expect(mockDialogMountCount).toBe(1);

    mockSearchParams.delete("wave");
    mockPathname = "/waves";
    waveData = null;
    rerender(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.getByTestId("waves")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open quick vote from waves footer",
      })
    );

    expect(screen.getByText("Session 2")).toBeInTheDocument();
    expect(mockDialogMountCount).toBe(1);
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
});
