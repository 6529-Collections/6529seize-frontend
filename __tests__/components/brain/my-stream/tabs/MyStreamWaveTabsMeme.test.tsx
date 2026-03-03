import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import MyStreamWaveTabsMeme from "@/components/brain/my-stream/tabs/MyStreamWaveTabsMeme";
import { SidebarProvider } from "@/hooks/useSidebarState";

const mockPush = jest.fn();
const mockUseBreakpoint = jest.fn(() => "LG");
const mockShare = jest.fn();
const mockWriteText = jest.fn();
const mockCopyToClipboard = jest.fn();

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

jest.mock("@/components/waves/memes/MemesArtSubmissionModal", () => ({
  __esModule: true,
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="modal">open</div> : null,
}));

jest.mock(
  "@/components/brain/my-stream/tabs/MyStreamWaveTabsMemeSubmit",
  () => ({
    __esModule: true,
    default: ({ handleMemesSubmit }: any) => (
      <button onClick={handleMemesSubmit}>submit</button>
    ),
  })
);

jest.mock("@/hooks/useWave", () => ({
  useWave: () => ({
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
    mockPush.mockClear();
    mockUseBreakpoint.mockReturnValue("LG");
    useContentTab.mockReset();
    mockShare.mockReset();
    mockWriteText.mockReset();
    mockCopyToClipboard.mockReset();
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

  it("renders share-mode action for non-DM meme waves", () => {
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });

    render(
      <SidebarProvider>
        <MyStreamWaveTabsMeme wave={createWave(false)} />
      </SidebarProvider>
    );

    expect(screen.getByRole("button", { name: "Share wave" })).toHaveAttribute(
      "data-wave-link-action-mode",
      "share"
    );
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

  it("renders copy-mode action when native share is unavailable", () => {
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

    expect(
      screen.getByRole("button", { name: "Copy wave link" })
    ).toHaveAttribute("data-wave-link-action-mode", "copy");

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
});
