import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import React from "react";
import MyStreamWaveTabsMeme from "@/components/brain/my-stream/tabs/MyStreamWaveTabsMeme";
import { SidebarProvider } from "@/hooks/useSidebarState";

const mockPush = jest.fn();
const mockUseBreakpoint = jest.fn(() => "LG");
const mockShare = jest.fn();
const mockWriteText = jest.fn();
const mockCopyToClipboard = jest.fn();
const mockOpenInformation = jest.fn();
let mockSubmissionEligible = true;
let mockSubmissionReady = true;
let mockSubmissionLimit = false;
let mockOpenSubmissionHelp = false;

jest.mock("@/contexts/WaveInformationContext", () => ({
  useWaveInformation: () => ({ open: mockOpenInformation }),
}));

const mockOpenWaveSearch = jest.fn();
jest.mock("@/components/brain/my-stream/tabs/MyStreamWaveSearch", () => ({
  useOpenMyStreamWaveSearch: () => ({
    open: mockOpenWaveSearch,
    trigger: { current: null },
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useSearchParams: () => new URLSearchParams("wave=w1"),
  usePathname: () => "/waves",
}));

jest.mock("react-use", () => {
  const actual = jest.requireActual("react-use");
  return {
    __esModule: true,
    ...actual,
    useCopyToClipboard: () => [
      { value: undefined, noUserInteraction: true },
      mockCopyToClipboard,
    ],
    createBreakpoint:
      () =>
      (...args: any[]) =>
        mockUseBreakpoint(...args),
  };
});

const useContentTab = jest.fn();

// The Join CTA owns its auth/query wiring and has dedicated tests.
jest.mock("@/components/waves/header/WaveJoinCta", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveDesktopTabs", () => ({
  __esModule: true,
  default: ({ activeTab }: any) => <div data-testid="desktop">{activeTab}</div>,
}));

jest.mock("@/components/waves/drops/search/WaveDropsSearchModal", () => ({
  __esModule: true,
  default: () => <div data-testid="wave-search-modal" />,
}));

jest.mock("@/components/brain/ContentTabContext", () => ({
  useContentTab: (...args: any[]) => useContentTab(...args),
}));

jest.mock("@/components/waves/header/WaveDescriptionPopover", () => ({
  __esModule: true,
  default: ({ children, ariaLabel }: any) => (
    <button type="button" aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/waves/memes/LazyMemesArtSubmissionModal", () => ({
  __esModule: true,
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="modal">open</div> : null,
}));

jest.mock(
  "@/components/brain/my-stream/tabs/MyStreamWaveTabsMemeSubmit",
  () => ({
    __esModule: true,
    default: ({
      handleMemesSubmit,
      onShowSubmissionHelp,
    }: {
      readonly handleMemesSubmit: () => void;
      readonly onShowSubmissionHelp?: (action: {
        label: string;
        restrictionMessage: string;
      }) => void;
    }) => (
      <button
        onClick={() =>
          mockOpenSubmissionHelp
            ? onShowSubmissionHelp?.({
                label: "Submission Limit Reached",
                restrictionMessage:
                  "You have already submitted the maximum allowed (3 submissions)",
              })
            : handleMemesSubmit()
        }
      >
        submit
      </button>
    ),
  })
);

jest.mock("@/hooks/useWave", () => ({
  SubmissionStatus: {
    ACTIVE: "ACTIVE",
    ENDED: "ENDED",
    NOT_STARTED: "NOT_STARTED",
  },
  useWave: () => ({
    participation: {
      status: "ACTIVE",
      isEligible: mockSubmissionEligible,
      canSubmitNow: mockSubmissionReady,
      hasReachedLimit: mockSubmissionLimit,
      maxSubmissions: 3,
    },
    isMemesWave: true,
    isRankWave: false,
    pauses: { filterDecisionsDuringPauses: (decisions: any) => decisions },
  }),
}));

jest.mock("@/hooks/waves/useDecisionPoints", () => ({
  useDecisionPoints: () => ({ allDecisions: [] }),
}));

jest.mock("@/helpers/waves/time.utils", () => ({
  calculateTimeLeft: () => ({ days: 0, hours: 0, minutes: 0, seconds: 0 }),
}));

jest.mock("@/helpers/time", () => ({
  Time: { currentMillis: () => Date.now() },
}));

jest.mock("@/components/waves/leaderboard/time/CompactTimeCountdown", () => ({
  CompactTimeCountdown: () => <div data-testid="countdown" />,
}));

describe("MyStreamWaveTabsMeme", () => {
  const setNavigatorClipboard = (writeTextImpl = mockWriteText) => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: writeTextImpl },
    });
  };

  const setNavigatorShare = (shareImpl?: unknown) => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareImpl,
    });
  };

  const createWave = (isDirectMessage = false) =>
    ({
      id: "w1",
      name: "Wave",
      picture: null,
      description_drop: {
        id: "drop-1",
        parts: [{ content: "A chill place to discuss drops" }],
      },
      contributors_overview: [],
      voting: {
        authenticated_user_eligible: true,
      },
      participation: {
        authenticated_user_eligible: true,
      },
      chat: {
        authenticated_user_eligible: true,
        scope: {
          group: {
            is_direct_message: isDirectMessage,
          },
        },
      },
    }) as any;

  beforeEach(() => {
    mockSubmissionEligible = true;
    mockSubmissionReady = true;
    mockSubmissionLimit = false;
    mockOpenSubmissionHelp = false;
    mockPush.mockClear();
    mockUseBreakpoint.mockReturnValue("LG");
    useContentTab.mockReset();
    mockShare.mockReset();
    mockWriteText.mockReset();
    mockCopyToClipboard.mockReset();
    mockOpenInformation.mockReset();
    mockShare.mockResolvedValue(undefined);
    mockWriteText.mockResolvedValue(undefined);
    setNavigatorShare(mockShare);
    setNavigatorClipboard();
  });

  it("opens modal when submit clicked and passes active tab", () => {
    const setActiveContentTab = jest.fn();
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab,
    });
    const wave = createWave(false);
    render(
      <SidebarProvider>
        <MyStreamWaveTabsMeme wave={wave} />
      </SidebarProvider>
    );
    expect(screen.getByTestId("desktop")).toHaveTextContent("CHAT");
    fireEvent.click(screen.getByText("submit"));
    expect(screen.getByTestId("modal")).toHaveTextContent("open");
  });

  it("keeps live submission help open while blocked and closes it when submission becomes available", async () => {
    mockUseBreakpoint.mockReturnValue("S");
    mockSubmissionReady = false;
    mockSubmissionLimit = true;
    mockOpenSubmissionHelp = true;
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    const wave = createWave(false);
    const view = () => (
      <SidebarProvider>
        <MyStreamWaveTabsMeme
          wave={wave}
          activeCurationId={null}
          onSelectCuration={jest.fn()}
        />
      </SidebarProvider>
    );
    const { rerender } = render(view());
    fireEvent.click(screen.getByRole("button", { name: "More wave actions" }));
    fireEvent.click(screen.getByRole("button", { name: "submit" }));
    const help = await screen.findByRole("dialog", { name: "How to Submit" });
    expect(help).toHaveTextContent(
      "You have already submitted the maximum allowed (3 submissions)"
    );
    rerender(view());
    expect(
      screen.getByRole("dialog", { name: "How to Submit" })
    ).toHaveTextContent("3 submissions");
    mockSubmissionLimit = false;
    mockSubmissionReady = true;
    rerender(view());
    expect(screen.queryByRole("dialog", { name: "How to Submit" })).toBeNull();
  });

  it("keeps sharing out of the desktop Main Stage header", () => {
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });

    render(
      <SidebarProvider>
        <MyStreamWaveTabsMeme wave={createWave(false)} />
      </SidebarProvider>
    );

    expect(screen.queryByRole("button", { name: "Share wave" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Show right sidebar" }).textContent
    ).toBe("");
  });

  it("renders description subtitle and trigger for non-DM meme waves", () => {
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });

    render(
      <SidebarProvider>
        <MyStreamWaveTabsMeme wave={createWave(false)} />
      </SidebarProvider>
    );

    const subtitle = screen.getByText("A chill place to discuss drops");
    expect(subtitle).toBeInTheDocument();
    expect(subtitle).toHaveClass("tw-truncate");
    expect(subtitle).not.toHaveClass("tw-line-clamp-1");
    expect(
      screen.getByRole("button", { name: "Show wave description" })
    ).toBeInTheDocument();
  });

  it("keeps submit action available in compact mode", () => {
    mockUseBreakpoint.mockReturnValue("S");
    const setActiveContentTab = jest.fn();
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab,
    });
    const wave = createWave(false);

    render(
      <SidebarProvider>
        <MyStreamWaveTabsMeme wave={wave} />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "More wave actions" }));
    expect(screen.getByRole("button", { name: "submit" })).toBeInTheDocument();
  });

  it("keeps copy available from the compact overflow menu", () => {
    mockUseBreakpoint.mockReturnValue("S");
    setNavigatorShare(undefined);
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });

    render(
      <SidebarProvider>
        <MyStreamWaveTabsMeme wave={createWave(false)} />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "More wave actions" }));

    fireEvent.click(screen.getByRole("button", { name: "Copy wave link" }));

    expect(mockCopyToClipboard).toHaveBeenCalledWith(
      "http://localhost/waves/w1"
    );
    expect(
      screen.getByRole("button", { name: "Link copied" })
    ).toBeInTheDocument();
  });

  it("hides action for DM meme wave", () => {
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });

    render(
      <SidebarProvider>
        <MyStreamWaveTabsMeme wave={createWave(true)} />
      </SidebarProvider>
    );

    expect(
      screen.queryByRole("button", { name: /wave link|share wave/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show wave description" })
    ).not.toBeInTheDocument();
  });

  it("keeps desktop action set at medium breakpoint", () => {
    mockUseBreakpoint.mockReturnValue("MD");
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });

    render(
      <SidebarProvider>
        <MyStreamWaveTabsMeme wave={createWave(false)} />
      </SidebarProvider>
    );

    expect(
      screen.getByRole("button", { name: "Show right sidebar" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Search messages in this wave" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Go back" })
    ).toBeInTheDocument();
  });

  it("keeps compact actions right-aligned and opens information from the title", async () => {
    mockUseBreakpoint.mockReturnValue("S");
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });

    render(
      <SidebarProvider>
        <MyStreamWaveTabsMeme wave={createWave(false)} />
      </SidebarProvider>
    );

    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
    const moreActionsButton = screen.getByRole("button", {
      name: "More wave actions",
    });
    fireEvent.click(screen.getByRole("button", { name: "About Wave" }));
    expect(mockOpenInformation).toHaveBeenCalledWith("w1");
    fireEvent.click(moreActionsButton);
    const moreActionsDialog = screen.getByRole("dialog", {
      name: "More wave actions",
    });
    expect(moreActionsDialog).toBeInTheDocument();
    expect(
      within(moreActionsDialog).getByRole("button", {
        name: "Search messages",
      })
    ).toBeInTheDocument();
    expect(
      within(moreActionsDialog).getByRole("button", { name: "submit" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Share wave" })
    ).toBeInTheDocument();
    expect(
      within(moreActionsDialog).getByRole("button", {
        name: "Wave details",
      })
    ).toBeInTheDocument();
    fireEvent.click(
      within(moreActionsDialog).getByRole("button", { name: "Close panel" })
    );
    await waitFor(() => expect(moreActionsDialog).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "About Wave" }));
    expect(mockOpenInformation).toHaveBeenCalledWith("w1");
  });
});
