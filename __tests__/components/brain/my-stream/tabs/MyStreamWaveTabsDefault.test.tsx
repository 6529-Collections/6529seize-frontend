import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import React from "react";
import MyStreamWaveTabsDefault from "@/components/brain/my-stream/tabs/MyStreamWaveTabsDefault";
import { AuthContext } from "@/components/auth/Auth";
import { SidebarProvider } from "@/hooks/useSidebarState";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseBreakpoint = jest.fn(() => "LG");
const mockShare = jest.fn();
const mockWriteText = jest.fn();
const mockCopyToClipboard = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
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
  default: ({ activeTab, setActiveTab }: any) => (
    <div>
      <span data-testid="active">{activeTab}</span>
      <button onClick={() => setActiveTab("NEW")}>change</button>
    </div>
  ),
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

describe("MyStreamWaveTabsDefault", () => {
  const mockToggleViewMode = jest.fn();
  const createSubmitDropAction = (
    overrides: Partial<{
      isVisible: boolean;
      canOpen: boolean;
      label: string;
      compactLabel: string;
      restrictionMessage: string | null;
      onOpen: jest.Mock;
    }> = {}
  ) => ({
    isVisible: true,
    canOpen: true,
    label: "Submit drop",
    compactLabel: "Drop",
    restrictionMessage: null,
    onOpen: jest.fn(),
    onOpenWithCurationUrl: jest.fn(),
    ...overrides,
  });
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
  const createWave = (
    isDirectMessage = false,
    overrides: Record<string, any> = {}
  ) =>
    ({
      id: overrides?.id ?? "w1",
      name: overrides?.name ?? "Wave",
      picture: null,
      description_drop: {
        id: "drop-1",
        parts: [{ content: "A chill place to discuss drops" }],
      },
      author: { id: "author-1", handle: "author" },
      contributors_overview: [],
      ...overrides,
      voting: {
        authenticated_user_eligible: true,
      },
      participation: {
        authenticated_user_eligible: true,
      },
      chat:
        overrides.chat ?? {
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
    mockReplace.mockClear();
    mockShare.mockReset();
    mockWriteText.mockReset();
    mockCopyToClipboard.mockReset();
    mockShare.mockResolvedValue(undefined);
    mockWriteText.mockResolvedValue(undefined);
    setNavigatorShare(mockShare);
    setNavigatorClipboard();
    mockUseBreakpoint.mockReturnValue("LG");
    useContentTab.mockReset();
    mockToggleViewMode.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("passes active tab and handles tab change", () => {
    const setActiveContentTab = jest.fn();
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab,
    });
    const wave = createWave();
    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={wave}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );
    expect(screen.getByTestId("active")).toHaveTextContent("CHAT");
    fireEvent.click(screen.getByText("change"));
    expect(setActiveContentTab).toHaveBeenCalledWith("NEW");
  });

  it("renders share action for non-DM waves", () => {
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    expect(screen.getByRole("button", { name: "Share wave" })).toHaveAttribute(
      "data-wave-link-action-mode",
      "share"
    );
  });

  it("renders description subtitle and trigger on desktop", () => {
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });

    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
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

  it("hides share action for DM waves", () => {
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(true)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    expect(
      screen.queryByRole("button", { name: "Share wave" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show wave description" })
    ).not.toBeInTheDocument();
  });

  it("links 1:1 DM header to the other participant profile", () => {
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    const wave = createWave(true, {
      name: "prxt0",
      contributors_overview: [
        { contributor_identity: "id-0xabc", contributor_pfp: "/me.png" },
      ],
    });

    render(
      <AuthContext.Provider
        value={
          {
            connectedProfile: {
              handle: "me",
              normalised_handle: "me",
              primary_wallet: "0xabc",
              query: "id-0xabc",
              wallets: [{ wallet: "0xabc" }],
            },
            activeProfileProxy: null,
          } as any
        }
      >
        <SidebarProvider>
          <MyStreamWaveTabsDefault
            wave={wave}
            viewMode="chat"
            onToggleViewMode={mockToggleViewMode}
            showGalleryToggle={false}
          />
        </SidebarProvider>
      </AuthContext.Provider>
    );

    expect(screen.getByRole("link", { name: "View prxt0's profile" }))
      .toHaveAttribute("href", "/prxt0");
    expect(
      screen.queryByRole("button", { name: "Share wave" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show wave description" })
    ).not.toBeInTheDocument();
  });

  it("uses native share when available", async () => {
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    const shareActionButton = screen.getByRole("button", {
      name: "Share wave",
    });
    expect(shareActionButton).toHaveAttribute(
      "data-wave-link-action-mode",
      "share"
    );
    fireEvent.click(shareActionButton);

    await waitFor(() =>
      expect(mockShare).toHaveBeenCalledWith({
        title: "Wave",
        url: "http://localhost/waves/w1",
      })
    );
    expect(mockWriteText).not.toHaveBeenCalled();
  });

  it("falls back to clipboard copy when native share is unavailable", async () => {
    setNavigatorShare(undefined);
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    const copyActionButton = screen.getByRole("button", {
      name: "Copy wave link",
    });
    expect(copyActionButton).toHaveAttribute(
      "data-wave-link-action-mode",
      "copy"
    );
    fireEvent.click(copyActionButton);

    await waitFor(() =>
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        "http://localhost/waves/w1"
      )
    );
  });

  it("does not fallback to copy when native share is cancelled", async () => {
    const abortError = new Error("Cancelled");
    Object.defineProperty(abortError, "name", { value: "AbortError" });
    mockShare.mockRejectedValue(abortError);
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Share wave" }));

    await waitFor(() => expect(mockShare).toHaveBeenCalledTimes(1));
    expect(mockCopyToClipboard).not.toHaveBeenCalled();
  });

  it("demotes to copy mode for the current wave when share fails", async () => {
    mockShare.mockRejectedValue(new Error("Share failed"));
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    const { container } = render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Share wave" }));

    await waitFor(() => expect(mockShare).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        "http://localhost/waves/w1"
      )
    );
    expect(
      container.querySelector('[data-wave-link-action-mode="copy"]')
    ).toBeInTheDocument();
  });

  it("returns to share mode when wave URL changes after a share failure", async () => {
    mockShare.mockRejectedValue(new Error("Share failed"));
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    const { container, rerender } = render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false, { id: "w1", name: "Wave One" })}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Share wave" }));

    await waitFor(() => expect(mockShare).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        "http://localhost/waves/w1"
      )
    );
    expect(
      container.querySelector('[data-wave-link-action-mode="copy"]')
    ).toBeInTheDocument();

    rerender(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false, { id: "w2", name: "Wave Two" })}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    expect(
      container.querySelector('[data-wave-link-action-mode="share"]')
    ).toBeInTheDocument();
  });

  it("shows temporary share feedback and resets", async () => {
    jest.useFakeTimers();
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Share wave" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByRole("button", { name: "Link shared" })
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(
      screen.getByRole("button", { name: "Share wave" })
    ).toBeInTheDocument();
  });

  it("renders compact overflow actions and keeps search trigger", () => {
    mockUseBreakpoint.mockReturnValue("S");
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    expect(
      screen.getByRole("button", { name: "More wave actions" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Search messages in this wave" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "More wave actions" }));
    expect(
      screen.getByRole("menuitem", { name: "Share wave" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Switch to gallery view" })
    ).toBeInTheDocument();
  });

  it("toggles chat/gallery in compact mode", () => {
    mockUseBreakpoint.mockReturnValue("S");
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "More wave actions" }));
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Switch to gallery view" })
    );

    expect(mockToggleViewMode).toHaveBeenCalledTimes(1);
  });

  it("keeps tablet action set at medium breakpoint", () => {
    mockUseBreakpoint.mockReturnValue("MD");
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    expect(
      screen.getByRole("button", { name: "Switch to gallery view" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Search messages in this wave" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go back" })
    ).toBeInTheDocument();
  });

  it("keeps compact title trigger and search action", () => {
    mockUseBreakpoint.mockReturnValue("S");
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    expect(
      screen.getByRole("button", { name: "Search messages in this wave" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Wave" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show wave description" })
    ).toBeInTheDocument();
  });

  it("shows compact Drop on the Chat tab and opens the submit flow", () => {
    const submitDropAction = createSubmitDropAction();
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });

    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
          chatSubmitDropAction={submitDropAction}
        />
      </SidebarProvider>
    );

    const button = screen.getByRole("button", { name: "Submit drop" });

    expect(button).toHaveTextContent("Drop");
    expect(screen.queryByText("Submit drop")).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(submitDropAction.onOpen).toHaveBeenCalledTimes(1);
  });

  it("shows compact Proposal for quorum submit actions", () => {
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });

    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
          chatSubmitDropAction={createSubmitDropAction({
            label: "Create proposal",
            compactLabel: "Proposal",
          })}
        />
      </SidebarProvider>
    );

    const button = screen.getByRole("button", { name: "Create proposal" });

    expect(button).toHaveTextContent("Proposal");
    expect(screen.queryByText("Create proposal")).not.toBeInTheDocument();
  });

  it("shows a disabled Submit drop reason", () => {
    const restrictionMessage = "Please log in to make submissions";

    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });

    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
          chatSubmitDropAction={createSubmitDropAction({
            canOpen: false,
            restrictionMessage,
          })}
        />
      </SidebarProvider>
    );

    const button = screen.getByRole("button", { name: "Submit drop" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", restrictionMessage);
    expect(button.parentElement).toHaveAttribute(
      "data-tooltip-content",
      restrictionMessage
    );
  });

  it("copies in mobile right action cluster when share is unavailable", () => {
    mockUseBreakpoint.mockReturnValue("S");
    setNavigatorShare(undefined);
    useContentTab.mockReturnValue({
      activeContentTab: "CHAT",
      setActiveContentTab: jest.fn(),
    });
    render(
      <SidebarProvider>
        <MyStreamWaveTabsDefault
          wave={createWave(false)}
          viewMode="chat"
          onToggleViewMode={mockToggleViewMode}
          showGalleryToggle={true}
        />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "More wave actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Copy wave link" }));

    expect(mockCopyToClipboard).toHaveBeenCalledWith(
      "http://localhost/waves/w1"
    );
  });
});
