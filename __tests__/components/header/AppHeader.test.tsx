import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import React from "react";
import AppHeader from "@/components/header/AppHeader";

const mockShare = jest.fn();
const mockNativeShare = jest.fn();
const mockWriteText = jest.fn();
const mockCopyToClipboard = jest.fn();
const mockCapacitorIsNativePlatform = jest.fn();
let mockWaveDropAction: any = null;

jest.mock("@/components/header/AppSidebar", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="sidebar" {...props} />,
}));
jest.mock("@/components/header/header-search/HeaderSearchButton", () => ({
  __esModule: true,
  default: ({ wave }: { wave: { id: string } | null }) => (
    <div data-testid="search" data-wave-id={wave?.id ?? ""} />
  ),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/useIdentity", () => ({ useIdentity: jest.fn() }));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  useParams: jest.fn(),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: jest.fn(),
}));
jest.mock("@/hooks/useWaveById", () => ({ useWaveById: jest.fn() }));
jest.mock("@/hooks/useWave", () => ({ useWave: jest.fn() }));
jest.mock("@/hooks/useWaveViewMode", () => ({ useWaveViewMode: jest.fn() }));
jest.mock("@/components/navigation/BackButton", () => ({
  __esModule: true,
  default: () => <div data-testid="back" />,
}));
jest.mock("@/components/utils/Spinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}));
jest.mock("@/components/header/HeaderActionButtons", () => ({
  __esModule: true,
  default: () => <div data-testid="actions" />,
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@capacitor/share", () => ({
  Share: {
    share: (...args: unknown[]) => mockNativeShare(...args),
  },
}));
jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => mockCapacitorIsNativePlatform(),
  },
  WebPlugin: class WebPlugin {},
  registerPlugin: jest.fn(() => ({
    get: jest.fn(),
    remove: jest.fn(),
    set: jest.fn(),
  })),
}));
jest.mock("@/components/waves/header/WaveDescriptionPopover", () => ({
  __esModule: true,
  default: ({ children, ariaLabel }: any) => (
    <button type="button" aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));
jest.mock("@/components/waves/WavePicture", () => ({
  __esModule: true,
  default: ({ name, picture }: { name: string; picture: string | null }) => (
    <div
      data-testid="wave-picture"
      data-name={name}
      data-picture={picture ?? ""}
    />
  ),
}));
jest.mock("@/contexts/NavigationHistoryContext", () => ({
  useNavigationHistoryContext: jest.fn(),
}));
jest.mock("@/contexts/HeaderContext", () => ({
  useHeaderContext: () => ({
    headerRef: { current: null },
    setHeaderRef: jest.fn(),
    refState: null,
    waveDropAction: mockWaveDropAction,
    setWaveDropAction: jest.fn(),
  }),
}));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) => url,
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
  };
});

const {
  useSeizeConnectContext,
} = require("@/components/auth/SeizeConnectContext");
const {
  useNavigationHistoryContext,
} = require("@/contexts/NavigationHistoryContext");
const { useAuth } = require("@/components/auth/Auth");
const { useIdentity } = require("@/hooks/useIdentity");
const {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
} = require("next/navigation");
const { useMyStreamOptional } = require("@/contexts/wave/MyStreamContext");
const { useWaveById } = require("@/hooks/useWaveById");
const { useWave } = require("@/hooks/useWave");
const { useWaveViewMode } = require("@/hooks/useWaveViewMode");
const useCapacitor = require("@/hooks/useCapacitor").default;

function setup(opts: any) {
  const wave = opts.wave
    ? { picture: null, contributors_overview: [], ...opts.wave }
    : opts.wave;
  const activeWaveId = opts.activeWaveId ?? wave?.id ?? null;
  const toggleViewMode = opts.toggleViewMode ?? jest.fn();
  (useSeizeConnectContext as jest.Mock).mockReturnValue({
    address: opts.address ?? null,
    isAuthenticated: opts.isAuthenticated ?? false,
    isConnected: opts.isConnected ?? false,
    connectedAccounts: opts.connectedAccounts ?? [],
    seizeSwitchConnectedAccount: opts.seizeSwitchConnectedAccount ?? jest.fn(),
  });
  (useAuth as jest.Mock).mockReturnValue({
    connectedProfile: opts.connectedProfile ?? null,
    activeProfileProxy: opts.proxy ?? null,
  });
  (useIdentity as jest.Mock).mockReturnValue({ profile: opts.profile });
  (useMyStreamOptional as jest.Mock).mockReturnValue(
    Object.prototype.hasOwnProperty.call(opts, "myStream")
      ? opts.myStream
      : activeWaveId
        ? {
            activeWave: { id: activeWaveId },
            waves: { list: opts.wavesList ?? [] },
            directMessages: { list: opts.directMessagesList ?? [] },
          }
        : {
            activeWave: { id: null },
            waves: { list: opts.wavesList ?? [] },
            directMessages: { list: opts.directMessagesList ?? [] },
          }
  );
  (useWaveById as jest.Mock).mockReturnValue({
    wave,
    isLoading: opts.isLoading ?? false,
    isFetching: opts.isFetching ?? false,
  });
  (useWave as jest.Mock).mockReturnValue(
    opts.waveInfo ?? {
      isRankWave: false,
      isMemesWave: false,
      isDm: false,
    }
  );
  (useWaveViewMode as jest.Mock).mockReturnValue({
    viewMode: opts.viewMode ?? "chat",
    toggleViewMode,
  });
  (useRouter as jest.Mock).mockReturnValue({
    push: jest.fn(),
  });
  (usePathname as jest.Mock).mockReturnValue(opts.asPath);
  (useSearchParams as jest.Mock).mockReturnValue({
    get: (param: string) => opts.query?.[param],
  });
  (useParams as jest.Mock).mockReturnValue(opts.params ?? {});
  (useNavigationHistoryContext as jest.Mock).mockReturnValue({
    canGoBack: opts.canGoBack ?? false,
  });
  return render(<AppHeader />);
}

describe("AppHeader", () => {
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

  beforeEach(() => {
    mockShare.mockReset();
    mockNativeShare.mockReset();
    mockWriteText.mockReset();
    mockCopyToClipboard.mockReset();
    mockCapacitorIsNativePlatform.mockReset();
    mockShare.mockResolvedValue(undefined);
    mockNativeShare.mockResolvedValue(undefined);
    mockCapacitorIsNativePlatform.mockReturnValue(false);
    mockWriteText.mockResolvedValue(undefined);
    mockWaveDropAction = null;
    useCapacitor.mockReturnValue({ isCapacitor: true });
    setNavigatorShare(mockShare);
    setNavigatorClipboard();
    window.history.pushState({}, "", "/");
    document.title = "6529";
  });

  afterEach(() => jest.clearAllMocks());

  it("shows menu icon on root page even with history", () => {
    setup({ address: null, asPath: "/notifications", canGoBack: true });
    expect(screen.queryByTestId("back")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open menu" })
    ).toBeInTheDocument();
  });

  it("shows back button on profile page when canGoBack is true", () => {
    setup({
      address: "0xabc",
      asPath: "/johndoe",
      params: { user: "johndoe" },
      canGoBack: true,
    });
    expect(screen.getByTestId("back")).toBeInTheDocument();
  });

  it("shows menu icon on profile page when canGoBack is false", () => {
    setup({
      address: "0xabc",
      asPath: "/johndoe",
      params: { user: "johndoe" },
      canGoBack: false,
    });
    expect(screen.queryByTestId("back")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open menu" })
    ).toBeInTheDocument();
  });

  it("shows back button inside wave regardless of canGoBack", () => {
    const wave = {
      id: "w1",
      name: "WaveOne",
      chat: { scope: { group: { is_direct_message: false } } },
    };
    setup({
      address: "0xabc",
      wave,
      query: { wave: "w1" },
      asPath: "/waves/w1",
      canGoBack: false,
    });
    expect(screen.getByTestId("back")).toBeInTheDocument();
    expect(screen.getByText("WaveOne")).toBeInTheDocument();
  });

  it("shows profile image on waves root page", () => {
    setup({
      address: "0xabc",
      profile: { pfp: "/pfp.png" },
      asPath: "/waves",
      canGoBack: true,
    });
    const img = screen.getByRole("img", { name: "pfp" });
    expect(img).toBeInTheDocument();
  });

  it("uses the fallback avatar when an active proxy has no creator pfp", () => {
    setup({
      address: "0xabc",
      profile: { pfp: "/connected-wallet.png" },
      proxy: { created_by: { pfp: null } },
      asPath: "/waves",
    });

    const img = screen.getByRole("img", { name: "pfp" });
    expect(img).toHaveAttribute(
      "src",
      expect.stringContaining("intern-no-bg.png")
    );
    expect(img).not.toHaveAttribute(
      "src",
      expect.stringContaining("connected-wallet.png")
    );
  });

  it("formats meme titles from path", () => {
    setup({ address: "0x1", asPath: "/the-memes/123" });
    expect(screen.getByText("The Memes #123")).toBeInTheDocument();
  });

  it("shows Waves title on waves route without wave selected", () => {
    setup({ asPath: "/waves" });
    expect(screen.getByText("Waves")).toBeInTheDocument();
  });

  it("shows Messages title on messages route without wave selected", () => {
    setup({ asPath: "/messages" });
    expect(screen.getByText("Messages")).toBeInTheDocument();
  });

  it("does not show duplicate Create DM overflow on messages route", () => {
    setup({ asPath: "/messages" });

    expect(
      screen.queryByRole("button", { name: "More header actions" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Create DM" })
    ).not.toBeInTheDocument();
  });

  it("shows share-mode wave link action in app header for non-DM waves", () => {
    const wave = {
      id: "w1",
      name: "WaveOne",
      description_drop: {
        id: "drop-1",
        parts: [{ content: "A chill place to discuss drops" }],
      },
      chat: { scope: { group: { is_direct_message: false } } },
    };
    setup({
      wave,
      asPath: "/waves/w1",
      waveInfo: {
        isRankWave: true,
        isApproveWave: false,
        isMemesWave: false,
        isDm: false,
      },
    });

    expect(
      screen.queryByRole("button", { name: "More header actions" })
    ).not.toBeInTheDocument();

    const shareWaveButton = screen.getByRole("button", { name: "Share wave" });
    expect(shareWaveButton.querySelector("svg")).toHaveClass("tw-size-5");

    fireEvent.click(shareWaveButton);

    expect(mockShare).toHaveBeenCalledWith({
      title: "WaveOne",
      url: "http://localhost/waves/w1",
    });
  });

  it("keeps the direct wave share icon active while the share sheet is open", async () => {
    const wave = {
      id: "w1",
      name: "WaveOne",
      chat: { scope: { group: { is_direct_message: false } } },
    };
    let resolveShare: (value: unknown) => void = () => undefined;
    mockShare.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveShare = resolve;
      })
    );

    setup({
      wave,
      asPath: "/waves/w1",
      waveInfo: {
        isRankWave: true,
        isApproveWave: false,
        isMemesWave: false,
        isDm: false,
      },
    });

    const shareWaveButton = screen.getByRole("button", { name: "Share wave" });

    fireEvent.click(shareWaveButton);

    await waitFor(() =>
      expect(shareWaveButton).toHaveAttribute("aria-busy", "true")
    );

    fireEvent.click(shareWaveButton);

    expect(mockShare).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveShare({});
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(shareWaveButton).not.toHaveAttribute("aria-busy")
    );
    expect(screen.getByRole("button", { name: "Share wave" })).toBeVisible();
    expect(mockCopyToClipboard).not.toHaveBeenCalled();
  });

  it("copies the wave link when native direct wave share fails", async () => {
    mockCapacitorIsNativePlatform.mockReturnValue(true);
    mockNativeShare.mockRejectedValueOnce(new Error("Share failed"));
    const wave = {
      id: "w1",
      name: "WaveOne",
      chat: { scope: { group: { is_direct_message: false } } },
    };

    setup({
      wave,
      asPath: "/waves/w1",
      waveInfo: {
        isRankWave: true,
        isApproveWave: false,
        isMemesWave: false,
        isDm: false,
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Share wave" }));

    await waitFor(() =>
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        "https://test.6529.io/waves/w1"
      )
    );
  });

  it("shows matching wave drop action in app header", () => {
    const onOpen = jest.fn();
    const wave = {
      id: "w-drop",
      name: "Drop Wave",
      chat: { scope: { group: { is_direct_message: false } } },
    };
    mockWaveDropAction = {
      waveId: "w-drop",
      canOpen: true,
      label: "Submit drop",
      compactLabel: "Drop",
      restrictionMessage: null,
      onOpen,
    };

    setup({
      wave,
      asPath: "/waves/w-drop",
      waveInfo: { isRankWave: false, isMemesWave: false, isDm: false },
    });

    const button = screen.getByRole("button", { name: "Submit drop" });
    expect(button).toHaveTextContent("Drop");

    fireEvent.click(button);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("shows copy-mode wave link action when native share is unavailable", () => {
    setNavigatorShare(undefined);
    const wave = {
      id: "w1",
      name: "WaveOne",
      description_drop: {
        id: "drop-1",
        parts: [{ content: "A chill place to discuss drops" }],
      },
      chat: { scope: { group: { is_direct_message: false } } },
    };
    setup({
      wave,
      asPath: "/waves/w1",
      waveInfo: {
        isRankWave: true,
        isApproveWave: false,
        isMemesWave: false,
        isDm: false,
      },
    });

    expect(
      screen.queryByRole("button", { name: "More header actions" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy wave link" })
    ).toBeInTheDocument();
  });

  it("hides wave link action while active wave is still resolving", () => {
    const staleWave = {
      id: "w1",
      name: "WaveOne",
      description_drop: {
        id: "drop-1",
        parts: [{ content: "A chill place to discuss drops" }],
      },
      chat: { scope: { group: { is_direct_message: false } } },
    };

    setup({
      activeWaveId: "w2",
      wave: staleWave,
      asPath: "/waves/w2",
      waveInfo: { isRankWave: false, isMemesWave: false, isDm: false },
    });

    expect(screen.queryByTestId("spinner")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /copy wave link|share wave/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "More header actions" })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("search")).toHaveAttribute("data-wave-id", "");
  });

  it("handles a missing stream context without throwing", () => {
    setup({
      myStream: undefined,
      wave: undefined,
      isLoading: true,
      isFetching: true,
      asPath: "/waves/missing-stream",
    });

    expect(screen.getByText("Waves")).toBeInTheDocument();
    expect(screen.getByTestId("search")).toHaveAttribute("data-wave-id", "");
  });

  it("shows active wave title and avatar from the waves list while the full wave loads", () => {
    setup({
      activeWaveId: "w-preview",
      wave: undefined,
      isLoading: true,
      isFetching: true,
      asPath: "/waves/w-preview",
      wavesList: [
        {
          id: "w-preview",
          name: "Preview Wave",
          picture: "/preview-wave.png",
          contributors: [{ pfp: "/c1.png", identity: "alice" }],
        },
      ],
      waveInfo: { isRankWave: false, isMemesWave: false, isDm: false },
    });

    expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    expect(screen.getByText("Preview Wave")).toBeInTheDocument();
    expect(screen.getByTestId("wave-picture")).toHaveAttribute(
      "data-name",
      "Preview Wave"
    );
    expect(screen.getByTestId("wave-picture")).toHaveAttribute(
      "data-picture",
      "/preview-wave.png"
    );
    expect(
      screen.queryByRole("button", { name: "Show wave description" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /copy wave link|share wave/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "More header actions" })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("search")).toHaveAttribute("data-wave-id", "");
  });

  it("shows active DM title and avatar from the direct messages list while the full wave loads", () => {
    setup({
      activeWaveId: "dm-preview",
      wave: undefined,
      isLoading: true,
      isFetching: true,
      asPath: "/messages/dm-preview",
      directMessagesList: [
        {
          id: "dm-preview",
          name: "Preview DM",
          picture: "/preview-dm.png",
          contributors: [{ pfp: "/dm-c1.png", identity: "bob" }],
        },
      ],
      waveInfo: { isRankWave: false, isMemesWave: false, isDm: false },
    });

    expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    expect(screen.getByText("Preview DM")).toBeInTheDocument();
    expect(screen.getByTestId("wave-picture")).toHaveAttribute(
      "data-name",
      "Preview DM"
    );
    expect(screen.getByTestId("wave-picture")).toHaveAttribute(
      "data-picture",
      "/preview-dm.png"
    );
    expect(
      screen.queryByRole("link", { name: "View Preview DM's profile" })
    ).not.toBeInTheDocument();
  });

  it("keeps full active wave title and avatar visible during background refetch", () => {
    const wave = {
      id: "w-loaded",
      name: "Loaded Wave",
      picture: "/loaded-wave.png",
      contributors_overview: [{ contributor_pfp: "/c1.png" }],
      chat: { scope: { group: { is_direct_message: false } } },
    };

    setup({
      wave,
      isFetching: true,
      asPath: "/waves/w-loaded",
      waveInfo: { isRankWave: false, isMemesWave: false, isDm: false },
    });

    expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    expect(screen.getByText("Loaded Wave")).toBeInTheDocument();
    expect(screen.getByTestId("wave-picture")).toHaveAttribute(
      "data-name",
      "Loaded Wave"
    );
    expect(screen.getByTestId("wave-picture")).toHaveAttribute(
      "data-picture",
      "/loaded-wave.png"
    );
    expect(screen.getByTestId("search")).toHaveAttribute(
      "data-wave-id",
      "w-loaded"
    );
  });

  it("copies wave link in app header when copy mode is active", () => {
    setNavigatorShare(undefined);
    const wave = {
      id: "w2",
      name: "WaveTwo",
      description_drop: {
        id: "drop-1",
        parts: [{ content: "A chill place to discuss drops" }],
      },
      chat: { scope: { group: { is_direct_message: false } } },
    };
    setup({
      activeWaveId: "w2",
      wave,
      asPath: "/waves/w2",
      waveInfo: {
        isRankWave: true,
        isApproveWave: false,
        isMemesWave: false,
        isDm: false,
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Copy wave link" }));

    expect(mockCopyToClipboard).toHaveBeenCalledWith(
      "http://localhost/waves/w2"
    );
  });

  it("hides wave link action in DM context", () => {
    const wave = {
      id: "w1",
      name: "WaveOne",
      picture: "/wave-one.png",
      contributors_overview: [{ contributor_pfp: "/c1.png" }],
      description_drop: {
        id: "drop-1",
        parts: [{ content: "A chill place to discuss drops" }],
      },
      chat: { scope: { group: { is_direct_message: true } } },
    };
    setup({
      wave,
      asPath: "/messages",
      waveInfo: { isRankWave: false, isMemesWave: false, isDm: true },
    });

    expect(
      screen.queryByRole("button", { name: /copy wave link|share wave/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show wave description" })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("wave-picture")).toBeInTheDocument();
  });

  it("shares the exact current app URL from non-wave app pages", async () => {
    window.history.pushState(
      {},
      "",
      "/the-memes/123?foo=bar&view=exact#details"
    );
    document.title = "The Memes #123";

    setup({ address: "0x1", asPath: "/the-memes/123" });

    fireEvent.click(screen.getByRole("button", { name: "Share page" }));

    await waitFor(() =>
      expect(mockNativeShare).toHaveBeenCalledWith({
        title: "The Memes #123",
        url: "https://test.6529.io/the-memes/123?foo=bar&view=exact#details",
      })
    );
  });

  it("shows the page share button as active while the share sheet is open", async () => {
    let resolveShare: (value: unknown) => void = () => undefined;
    mockNativeShare.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveShare = resolve;
      })
    );

    setup({ address: "0x1", asPath: "/open-data" });

    const sharePageButton = screen.getByRole("button", { name: "Share page" });

    fireEvent.click(sharePageButton);

    await waitFor(() =>
      expect(sharePageButton).toHaveAttribute("aria-busy", "true")
    );
    expect(sharePageButton).toBeDisabled();

    fireEvent.click(sharePageButton);

    expect(mockNativeShare).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveShare({});
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(sharePageButton).not.toHaveAttribute("aria-busy")
    );
    expect(sharePageButton).not.toBeDisabled();
  });

  it("copies the exact current app URL when native page share fails", async () => {
    mockNativeShare.mockRejectedValueOnce(new Error("Native share failed"));
    window.history.pushState({}, "", "/open-data?tab=artists#chart");

    setup({ address: "0x1", asPath: "/open-data" });

    fireEvent.click(screen.getByRole("button", { name: "Share page" }));

    await waitFor(() =>
      expect(mockWriteText).toHaveBeenCalledWith(
        "https://test.6529.io/open-data?tab=artists#chart"
      )
    );
  });

  it("does not copy the current app URL when native page share is cancelled", async () => {
    mockNativeShare.mockRejectedValueOnce(
      Object.assign(new Error("Share cancelled"), { name: "AbortError" })
    );
    window.history.pushState({}, "", "/open-data?tab=artists#chart");

    setup({ address: "0x1", asPath: "/open-data" });

    fireEvent.click(screen.getByRole("button", { name: "Share page" }));

    await waitFor(() => expect(mockNativeShare).toHaveBeenCalledTimes(1));
    expect(mockWriteText).not.toHaveBeenCalled();
  });

  it.each([
    "/",
    "/waves",
    "/waves/w1",
    "/messages",
    "/messages/w1",
    "/notifications",
    "/notifications/settings",
  ])("hides page share on excluded app route %s", (asPath) => {
    setup({ asPath });

    expect(
      screen.queryByRole("button", { name: "Share page" })
    ).not.toBeInTheDocument();
  });

  it.each(["waves", "messages"])(
    "hides page share while app is showing %s query context",
    (view) => {
      setup({ asPath: "/", query: { view } });

      expect(
        screen.queryByRole("button", { name: "Share page" })
      ).not.toBeInTheDocument();
    }
  );

  it("hides page share outside Capacitor", () => {
    useCapacitor.mockReturnValue({ isCapacitor: false });

    setup({ asPath: "/the-memes/123" });

    expect(
      screen.queryByRole("button", { name: "Share page" })
    ).not.toBeInTheDocument();
  });

  it("links 1:1 DM active wave title to the other participant profile", () => {
    const wave = {
      id: "w-dm",
      name: "prxt0",
      picture: "/prxt0.png",
      contributors_overview: [
        { contributor_identity: "id-0xabc", contributor_pfp: "/me.png" },
      ],
      description_drop: {
        id: "drop-1",
        parts: [{ content: "A chill place to discuss drops" }],
      },
      chat: { scope: { group: { is_direct_message: true } } },
    };

    setup({
      wave,
      asPath: "/messages/w-dm",
      connectedProfile: {
        handle: "me",
        normalised_handle: "me",
        primary_wallet: "0xabc",
        query: "id-0xabc",
        wallets: [{ wallet: "0xabc" }],
      },
      waveInfo: { isRankWave: false, isMemesWave: false, isDm: true },
    });

    expect(
      screen.getByRole("link", { name: "View prxt0's profile" })
    ).toHaveAttribute("href", "/prxt0");
    expect(
      screen.queryByRole("button", { name: /copy wave link|share wave/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show wave description" })
    ).not.toBeInTheDocument();
  });

  it("renders description subtitle trigger for non-DM active wave", () => {
    const wave = {
      id: "w3",
      name: "WaveThree",
      picture: "/wave-three.png",
      contributors_overview: [{ contributor_pfp: "/c1.png" }],
      description_drop: {
        id: "drop-3",
        parts: [{ content: "A chill place to discuss drops" }],
      },
      chat: { scope: { group: { is_direct_message: false } } },
    };
    setup({
      wave,
      asPath: "/waves/w3",
      waveInfo: { isRankWave: false, isMemesWave: false, isDm: false },
    });

    expect(
      screen.getByRole("button", { name: "Show wave description" })
    ).toBeInTheDocument();
    const subtitle = screen.getByText("A chill place to discuss drops");
    expect(subtitle).toBeInTheDocument();
    expect(subtitle).toHaveClass("tw-truncate");
    expect(screen.getByTestId("wave-picture")).toBeInTheDocument();
  });

  it("shows gallery toggle in eligible wave context and toggles view mode", () => {
    const toggleViewMode = jest.fn();
    const wave = {
      id: "w4",
      name: "WaveFour",
      picture: "/wave-four.png",
      contributors_overview: [{ contributor_pfp: "/c1.png" }],
      chat: { scope: { group: { is_direct_message: false } } },
    };
    setup({
      wave,
      asPath: "/waves/w4",
      viewMode: "chat",
      toggleViewMode,
      waveInfo: { isRankWave: false, isMemesWave: false, isDm: false },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "More header actions" })
    );

    const galleryToggle = screen.getByRole("menuitem", {
      name: "Switch to gallery view",
    });
    const galleryIcon = galleryToggle.querySelector("svg");
    expect(galleryIcon).toHaveClass("tw-h-4", "tw-w-4");
    fireEvent.click(galleryToggle);

    expect(toggleViewMode).toHaveBeenCalledTimes(1);
  });
});
