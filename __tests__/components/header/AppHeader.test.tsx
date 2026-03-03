import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import AppHeader from "@/components/header/AppHeader";

const mockShare = jest.fn();
const mockWriteText = jest.fn();
const mockCopyToClipboard = jest.fn();

jest.mock("@/components/header/AppSidebar", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="sidebar" {...props} />,
}));
jest.mock("@/components/header/header-search/HeaderSearchButton", () => ({
  __esModule: true,
  default: () => <div data-testid="search" />,
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
  default: ({ name }: { name: string }) => (
    <div data-testid="wave-picture" data-name={name} />
  ),
}));
jest.mock("@/contexts/NavigationHistoryContext", () => ({
  useNavigationHistoryContext: jest.fn(),
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

function setup(opts: any) {
  const activeWaveId = opts.activeWaveId ?? opts.wave?.id ?? null;
  const toggleViewMode = opts.toggleViewMode ?? jest.fn();
  (useSeizeConnectContext as jest.Mock).mockReturnValue({
    address: opts.address ?? null,
    isAuthenticated: opts.isAuthenticated ?? false,
    isConnected: opts.isConnected ?? false,
    connectedAccounts: opts.connectedAccounts ?? [],
    seizeSwitchConnectedAccount: opts.seizeSwitchConnectedAccount ?? jest.fn(),
  });
  (useAuth as jest.Mock).mockReturnValue({ activeProfileProxy: opts.proxy });
  (useIdentity as jest.Mock).mockReturnValue({ profile: opts.profile });
  (useMyStreamOptional as jest.Mock).mockReturnValue(
    activeWaveId ? { activeWave: { id: activeWaveId } } : { activeWave: null }
  );
  (useWaveById as jest.Mock).mockReturnValue({
    wave: opts.wave,
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
    mockWriteText.mockReset();
    mockCopyToClipboard.mockReset();
    mockShare.mockResolvedValue(undefined);
    mockWriteText.mockResolvedValue(undefined);
    setNavigatorShare(mockShare);
    setNavigatorClipboard();
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
      waveInfo: { isRankWave: false, isMemesWave: false, isDm: false },
    });

    const shareButton = screen.getByRole("button", { name: "Share wave" });
    expect(shareButton).toHaveAttribute("data-wave-link-action-mode", "share");
    expect(shareButton).toHaveClass("tw-h-10", "tw-w-10");
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
      waveInfo: { isRankWave: false, isMemesWave: false, isDm: false },
    });

    expect(
      screen.getByRole("button", { name: "Copy wave link" })
    ).toHaveAttribute("data-wave-link-action-mode", "copy");
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
      waveInfo: { isRankWave: false, isMemesWave: false, isDm: false },
    });

    fireEvent.click(screen.getByRole("button", { name: "Copy wave link" }));

    expect(mockCopyToClipboard).toHaveBeenCalledWith(
      "http://localhost/waves/w2"
    );
    expect(
      screen.getByRole("button", { name: "Link copied" })
    ).toBeInTheDocument();
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

    const galleryToggle = screen.getByRole("button", {
      name: "Switch to gallery view",
    });
    const actionRow = galleryToggle.parentElement;
    if (!actionRow) {
      throw new Error("Expected gallery toggle to be inside action row");
    }
    expect(actionRow).toHaveClass("tw-gap-x-1");
    expect(galleryToggle).toHaveClass("tw-h-10", "tw-w-10");
    const galleryIcon = galleryToggle.querySelector("svg");
    expect(galleryIcon).toHaveClass("tw-h-5", "tw-w-5");
    fireEvent.click(galleryToggle);

    expect(toggleViewMode).toHaveBeenCalledTimes(1);
  });
});
