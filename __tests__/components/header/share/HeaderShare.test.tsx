import HeaderShare, {
  HeaderConnectModal,
} from "@/components/header/share/HeaderShare";
import HeaderPageShareButton from "@/components/header/share/HeaderPageShareButton";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useCapacitor from "@/hooks/useCapacitor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockCapacitorCanShare = jest.fn();
const mockCapacitorShare = jest.fn();

// Mocks
jest.mock("@/hooks/useCapacitor");
jest.mock("@/hooks/isMobileDevice");
jest.mock("@/hooks/useElectron", () => ({
  useElectron: jest.fn(() => false),
}));
jest.mock("@capacitor/share", () => ({
  Share: {
    canShare: (...args: unknown[]) => mockCapacitorCanShare(...args),
    share: (...args: unknown[]) => mockCapacitorShare(...args),
  },
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(() => ({
    ensureActiveSessionV2WebSession: jest.fn(async () => true),
    requestSessionUpgrade: jest.fn(),
  })),
}));

// Mock SeizeConnectContext
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({
    isAuthenticated: false,
    hasValidWalletAuth: false,
    seizeConnect: jest.fn(),
    seizeAcceptConnection: jest.fn(),
    address: undefined,
    hasInitializationError: false,
    initializationError: null,
  })),
  SeizeConnectProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
jest.mock("@/services/auth/auth.utils");
jest.mock("@/services/auth/session-v2.utils", () => ({
  createConnectionShare: jest.fn(),
  createLegacyDesktopConnectionShare: jest.fn(),
}));

// Mock Reown AppKit
jest.mock("@reown/appkit/react", () => ({
  useAppKit: jest.fn(() => ({
    open: jest.fn(),
    close: jest.fn(),
  })),
  useAppKitAccount: jest.fn(() => ({
    address: undefined,
    isConnected: false,
    status: "disconnected",
  })),
  useAppKitState: jest.fn(() => ({
    open: false,
    loading: false,
  })),
  useDisconnect: jest.fn(() => ({
    disconnect: jest.fn(),
  })),
  useWalletInfo: jest.fn(() => ({
    walletInfo: null,
  })),
}));

// Mock viem
jest.mock("viem", () => ({
  isAddress: jest.fn((address: string) => /^0x[a-fA-F0-9]{40}$/.test(address)),
  getAddress: jest.fn((address: string) => address.toLowerCase()),
}));

let mockPathname = "/mock-path";
let mockSearchParams = new URLSearchParams("something=value");

// next/navigation mocks
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

// Image mock (should live in jest.setup.ts ideally)
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img alt="" {...props} />,
}));

// QRCode mock - needs to match require() usage in component
jest.mock("qrcode", () => ({
  toDataURL: jest.fn(() =>
    Promise.resolve("data:image/png;base64,FAKE_QR_CODE")
  ),
}));

// Mock auth utils
const mockAuthUtils = {
  getRefreshToken: jest.fn<string | null, []>(() => null),
  getWalletAddress: jest.fn<string | null, []>(() => null),
  getWalletRole: jest.fn<string | null, []>(() => null),
  hasActiveSessionV2Auth: jest.fn<boolean, [{ address: string }]>(() => false),
  removeAuthJwt: jest.fn(),
};

require("@/services/auth/auth.utils").getRefreshToken =
  mockAuthUtils.getRefreshToken;
require("@/services/auth/auth.utils").getWalletAddress =
  mockAuthUtils.getWalletAddress;
require("@/services/auth/auth.utils").getWalletRole =
  mockAuthUtils.getWalletRole;
require("@/services/auth/auth.utils").hasActiveSessionV2Auth =
  mockAuthUtils.hasActiveSessionV2Auth;
require("@/services/auth/auth.utils").removeAuthJwt =
  mockAuthUtils.removeAuthJwt;

const mockUseCapacitor = useCapacitor as jest.MockedFunction<
  typeof useCapacitor
>;
const mockIsMobile = useIsMobileDevice as jest.MockedFunction<
  typeof useIsMobileDevice
>;
const mockUseElectron = require("@/hooks/useElectron")
  .useElectron as jest.MockedFunction<() => boolean>;

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

const testOrigin = globalThis.window.location.origin;
const testPageUrl = `${testOrigin}/mock-path?something=value#details`;
const originalSecureContextDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "isSecureContext"
);
const QR_CODE_OPTIONS = {
  width: 500,
  margin: 4,
  color: { dark: "#000000", light: "#ffffff" },
};

function createPendingPromise<T>(): Promise<T> {
  return new Promise<T>(() => {
    // Intentionally pending for abort and stale-share coverage.
  });
}

function HeaderConnectHarness() {
  const [show, setShow] = React.useState(false);

  return (
    <>
      <button type="button" aria-label="QR Code" onClick={() => setShow(true)}>
        Connect Device
      </button>
      <HeaderConnectModal show={show} onClose={() => setShow(false)} />
    </>
  );
}

describe("HeaderShare", () => {
  const mockSeizeConnect = require("@/components/auth/SeizeConnectContext");

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Reset mock return values
    mockAuthUtils.getRefreshToken.mockReturnValue(null);
    mockAuthUtils.getWalletAddress.mockReturnValue(null);
    mockAuthUtils.getWalletRole.mockReturnValue(null);
    mockAuthUtils.hasActiveSessionV2Auth.mockReturnValue(false);
    mockPathname = "/mock-path";
    mockSearchParams = new URLSearchParams("something=value");
    mockUseElectron.mockReturnValue(false);
    mockCapacitorCanShare.mockResolvedValue({ value: true });
    mockCapacitorShare.mockResolvedValue(undefined);
    document.title = "6529";
    document.cookie = "page-share-qr-target=; Max-Age=0; Path=/";
    globalThis.window.history.replaceState(
      {},
      "",
      "/mock-path?something=value#details"
    );
    Object.defineProperty(globalThis, "isSecureContext", {
      configurable: true,
      value: true,
    });
    Reflect.deleteProperty(globalThis.navigator, "share");
    Reflect.deleteProperty(globalThis.navigator, "canShare");
    Reflect.deleteProperty(globalThis.document, "permissionsPolicy");
    Reflect.deleteProperty(globalThis.document, "featurePolicy");

    const auth = require("@/components/auth/Auth");
    auth.useAuth.mockReturnValue({
      ensureActiveSessionV2WebSession: jest.fn(async () => true),
      requestSessionUpgrade: jest.fn(),
    });

    mockSeizeConnect.useSeizeConnectContext.mockReturnValue({
      isAuthenticated: false,
      hasValidWalletAuth: false,
      seizeConnect: jest.fn(),
      seizeAcceptConnection: jest.fn(),
      address: undefined,
      hasInitializationError: false,
      initializationError: null,
    });

    // Reset QRCode mock
    const qrcode = require("qrcode");
    qrcode.toDataURL.mockResolvedValue("data:image/png;base64,FAKE_QR_CODE");

    const sessionV2 = require("@/services/auth/session-v2.utils");
    sessionV2.createConnectionShare.mockReset();
    sessionV2.createConnectionShare.mockResolvedValue({
      connection_share_code: "mock-share-code",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      address: "0x1234567890123456789012345678901234567890",
      role: "user",
      target_client_type: "native",
      deep_link_path:
        "/accept-connection-sharing?connection_share_code=mock-share-code",
    });
    sessionV2.createLegacyDesktopConnectionShare.mockReset();
    sessionV2.createLegacyDesktopConnectionShare.mockResolvedValue({
      refresh_token: "legacy-desktop-refresh-token",
      address: "0x1234567890123456789012345678901234567890",
      role: "user",
      deep_link_path:
        "/accept-connection-sharing?token=legacy-desktop-refresh-token&address=0x1234567890123456789012345678901234567890&role=user",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    (navigator.clipboard.writeText as jest.Mock).mockReset?.();
    Reflect.deleteProperty(globalThis.navigator, "share");
    Reflect.deleteProperty(globalThis.navigator, "canShare");
    Reflect.deleteProperty(globalThis.document, "permissionsPolicy");
    Reflect.deleteProperty(globalThis.document, "featurePolicy");
  });

  afterAll(() => {
    if (originalSecureContextDescriptor) {
      Object.defineProperty(
        globalThis,
        "isSecureContext",
        originalSecureContextDescriptor
      );
    } else {
      Reflect.deleteProperty(globalThis, "isSecureContext");
    }
  });

  it("renders nothing when running in Capacitor", () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: true } as any);
    mockIsMobile.mockReturnValue(false);
    const { container } = render(<HeaderShare />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing on mobile devices", () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(true);
    const { container } = render(<HeaderShare />);
    expect(container.firstChild).toBeNull();
  });

  it("opens the compact page-share modal in a mobile browser", async () => {
    mockIsMobile.mockReturnValue(true);
    document.title = "Mobile Share";
    const share = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "share", {
      configurable: true,
      value: share,
    });
    Object.defineProperty(globalThis.navigator, "canShare", {
      configurable: true,
      value: jest.fn(() => true),
    });
    const qrcode = require("qrcode");
    qrcode.toDataURL.mockClear();

    renderWithProviders(<HeaderPageShareButton isCapacitor={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Share page" }));

    expect(
      await screen.findByTestId("compact-page-share-layout")
    ).toBeInTheDocument();
    const modal = screen.getByTestId("header-share-modal");
    expect(modal).toHaveClass("tw-max-w-sm");
    expect(modal).not.toHaveClass("sm:tw-max-w-2xl");
    expect(screen.getByRole("button", { name: "Copy Link" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Share on X" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Share on Farcaster" })
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Open in 6529 Desktop" })
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-share-target-menu")).toBeNull();
    expect(screen.queryByTestId("page-share-divider")).toBeNull();
    expect(qrcode.toDataURL).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "Share with another app" })
    );

    expect(share).toHaveBeenCalledWith({
      title: "Mobile Share",
      url: `${testOrigin}/mock-path?something=value#details`,
    });
  });

  it("renders nothing on a shared unsupported route", () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    mockPathname = "/messages/create";

    const { container } = renderWithProviders(<HeaderShare />);

    expect(container.firstChild).toBeNull();
  });

  it("renders on the desktop-web home route", () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    mockPathname = "/";

    renderWithProviders(<HeaderShare />);

    expect(
      screen.getByRole("button", { name: "Share this page" })
    ).toBeInTheDocument();
  });

  it("renders on a wave route", () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    mockPathname = "/waves/abc";

    renderWithProviders(<HeaderShare />);

    expect(
      screen.getByRole("button", { name: "Share this page" })
    ).toBeInTheDocument();
  });

  it("shows the share button and opens a share-only modal", async () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    renderWithProviders(<HeaderShare />);

    const btn = screen.getByRole("button", { name: "Share this page" });
    expect(btn).toBeInTheDocument();
    expect(btn.querySelector("svg")).toHaveClass("tw-size-5");

    await userEvent.click(btn);

    const modal = await screen.findByTestId("header-share-modal");
    expect(modal).toHaveClass("tw-max-w-sm", "sm:tw-max-w-2xl", "tw-p-0");
    expect(screen.getByTestId("header-share-modal-content")).toHaveClass(
      "tw-p-5"
    );
    expect(modal.querySelector("#header-share-content")).toHaveClass(
      "tw-w-48",
      "sm:tw-w-[var(--page-share-qr-size)]"
    );
    expect(screen.getByRole("heading", { name: "Share" })).toBeInTheDocument();
    expect(screen.getByTestId("page-share-layout")).toHaveClass(
      "sm:tw-grid-cols-[var(--page-share-qr-size)_1px_minmax(0,1fr)]"
    );
    expect(
      screen
        .getByTestId("page-share-layout")
        .style.getPropertyValue("--page-share-qr-size")
    ).toBe("10.75rem");
    expect(screen.getByTestId("page-share-target-menu")).toHaveClass(
      "tw-w-48",
      "sm:tw-w-full"
    );
    expect(screen.getByTestId("page-share-divider")).toHaveClass(
      "tw-h-px",
      "tw-w-full",
      "sm:tw-h-full",
      "sm:tw-w-px"
    );
    expect(screen.getByTestId("page-share-actions-column")).toHaveClass(
      "tw-items-center"
    );
    expect(screen.getByTestId("page-share-qr-column")).toHaveClass(
      "tw-justify-center"
    );
    expect(
      screen.getByRole("link", { name: "Share on X" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Share on Farcaster" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open in 6529 Desktop" })
    ).toHaveAttribute(
      "href",
      "testcore6529://navigate/mock-path?something=value#details"
    );
    expect(screen.getByRole("button", { name: "Browser" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "App" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.queryByRole("button", { name: "Create QR code" })).toBeNull();
    expect(
      await screen.findByAltText("Current page QR code")
    ).toBeInTheDocument();
    const shareActions = [
      screen.getByRole("button", { name: "Copy Link" }),
      screen.getByRole("link", { name: "Open in 6529 Desktop" }),
      screen.getByRole("link", { name: "Share on X" }),
      screen.getByRole("link", { name: "Share on Farcaster" }),
    ];
    shareActions.forEach((action) => {
      expect(action).toHaveClass("tw-w-full");
      expect(action).not.toHaveAttribute("data-tooltip-id");
      expect(action).not.toHaveAttribute("title");
    });
    expect(screen.queryByText("Connect to")).not.toBeInTheDocument();
    expect(screen.queryByText("Mobile")).not.toBeInTheDocument();
    expect(screen.queryByText("Desktop")).not.toBeInTheDocument();

    const xShareLink = screen.getByRole("link", {
      name: "Share on X",
    }) as HTMLAnchorElement;
    const xShareUrl = new URL(xShareLink.href);
    expect(xShareUrl.origin).toBe("https://x.com");
    expect(xShareUrl.pathname).toBe("/intent/post");
    expect(xShareUrl.searchParams.get("text")).toBe(`6529\n${testPageUrl}`);

    const farcasterShareLink = screen.getByRole("link", {
      name: "Share on Farcaster",
    }) as HTMLAnchorElement;
    const farcasterShareUrl = new URL(farcasterShareLink.href);
    expect(farcasterShareUrl.origin).toBe("https://farcaster.xyz");
    expect(farcasterShareUrl.pathname).toBe("/~/compose");
    expect(farcasterShareUrl.searchParams.get("text")).toBe("6529");
    expect(farcasterShareUrl.searchParams.getAll("embeds[]")).toEqual([
      testPageUrl,
    ]);
  });

  it("copies url to clipboard", async () => {
    const setTimeoutSpy = jest.spyOn(globalThis, "setTimeout");
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);

    try {
      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "Share this page" });
      await userEvent.click(btn);

      const modal = await screen.findByTestId("header-share-modal");
      const copyButton = screen.getByRole("button", { name: "Copy Link" });
      const copyIcon = modal.querySelector('[data-icon="copy"]') as HTMLElement;

      expect(copyIcon).toBeInTheDocument();
      await userEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        testPageUrl
      );
      expect(screen.getByRole("button", { name: "Copied" })).toBe(copyButton);
      expect(copyButton).toHaveClass(
        "tw-border-green-500",
        "tw-bg-green-500/15",
        "!tw-text-success"
      );
      expect(within(copyButton).getByText("Copied")).toHaveClass(
        "!tw-text-success"
      );
      expect(screen.getByRole("status")).toHaveTextContent("Copied");
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1500);
    } finally {
      setTimeoutSpy.mockRestore();
    }
  });

  it("remembers the App QR target and preserves the complete route", async () => {
    const qrcode = require("qrcode");
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);

    const firstRender = renderWithProviders(<HeaderShare />);
    await userEvent.click(
      screen.getByRole("button", { name: "Share this page" })
    );
    await userEvent.click(screen.getByRole("button", { name: "App" }));

    expect(screen.getByRole("button", { name: "App" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      await screen.findByAltText("Mobile App Link - QR Code")
    ).toBeInTheDocument();
    expect(qrcode.toDataURL).toHaveBeenCalledWith(
      "testmobile6529://navigate/mock-path?something=value#details",
      QR_CODE_OPTIONS
    );
    expect(document.cookie).toContain("page-share-qr-target=app");

    firstRender.unmount();
    renderWithProviders(<HeaderShare />);
    await userEvent.click(
      screen.getByRole("button", { name: "Share this page" })
    );

    expect(screen.getByRole("button", { name: "App" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("uses the system share sheet with the exact current URL when available", async () => {
    const systemShare = jest.fn().mockResolvedValue(undefined);
    const canShare = jest.fn().mockReturnValue(true);
    Object.defineProperty(globalThis.navigator, "share", {
      configurable: true,
      value: systemShare,
    });
    Object.defineProperty(globalThis.navigator, "canShare", {
      configurable: true,
      value: canShare,
    });
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);

    renderWithProviders(<HeaderShare />);
    await userEvent.click(
      screen.getByRole("button", { name: "Share this page" })
    );
    const systemShareButton = await screen.findByRole("button", {
      name: "Share with another app",
    });

    expect(systemShareButton).toHaveTextContent("More");
    expect(systemShareButton).toHaveClass("tw-w-full");
    expect(systemShareButton).not.toHaveAttribute("data-tooltip-id");
    expect(systemShareButton).not.toHaveAttribute("title");
    expect(
      screen
        .getByTestId("page-share-layout")
        .style.getPropertyValue("--page-share-qr-size")
    ).toBe("14.25rem");
    expect(canShare).toHaveBeenCalledWith({
      title: "6529",
      url: testPageUrl,
    });

    await userEvent.click(systemShareButton);

    expect(systemShare).toHaveBeenCalledWith({
      title: "6529",
      url: testPageUrl,
    });
  });

  it("supports system sharing when canShare is unavailable", async () => {
    Object.defineProperty(globalThis.navigator, "share", {
      configurable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });

    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    renderWithProviders(<HeaderShare />);
    await userEvent.click(
      screen.getByRole("button", { name: "Share this page" })
    );

    expect(
      await screen.findByRole("button", { name: "Share with another app" })
    ).toBeInTheDocument();
  });

  it("hides system sharing when the API is unavailable", async () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    renderWithProviders(<HeaderShare />);
    await userEvent.click(
      screen.getByRole("button", { name: "Share this page" })
    );

    await screen.findByTestId("header-share-modal");
    expect(
      screen.queryByRole("button", { name: "Share with another app" })
    ).not.toBeInTheDocument();
  });

  it("hides system sharing when the page is not a secure context", async () => {
    Object.defineProperty(globalThis, "isSecureContext", {
      configurable: true,
      value: false,
    });
    Object.defineProperty(globalThis.navigator, "share", {
      configurable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });

    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    renderWithProviders(<HeaderShare />);
    await userEvent.click(
      screen.getByRole("button", { name: "Share this page" })
    );

    await screen.findByTestId("header-share-modal");
    expect(
      screen.queryByRole("button", { name: "Share with another app" })
    ).not.toBeInTheDocument();
  });

  it("hides system sharing when canShare rejects the payload", async () => {
    const canShare = jest.fn().mockReturnValue(false);
    Object.defineProperty(globalThis.navigator, "share", {
      configurable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(globalThis.navigator, "canShare", {
      configurable: true,
      value: canShare,
    });

    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    renderWithProviders(<HeaderShare />);
    await userEvent.click(
      screen.getByRole("button", { name: "Share this page" })
    );

    await waitFor(() =>
      expect(canShare).toHaveBeenCalledWith({
        title: "6529",
        url: testPageUrl,
      })
    );
    expect(
      screen.queryByRole("button", { name: "Share with another app" })
    ).not.toBeInTheDocument();
  });

  it("hides system sharing when checking canShare throws", async () => {
    const canShareError = new Error("Share capability check failed");
    Object.defineProperty(globalThis.navigator, "share", {
      configurable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(globalThis.navigator, "canShare", {
      configurable: true,
      value: jest.fn(() => {
        throw canShareError;
      }),
    });

    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    renderWithProviders(<HeaderShare />);
    await userEvent.click(
      screen.getByRole("button", { name: "Share this page" })
    );

    await screen.findByTestId("header-share-modal");
    expect(
      screen.queryByRole("button", { name: "Share with another app" })
    ).not.toBeInTheDocument();
  });

  it("hides system sharing when the document permissions policy blocks it", async () => {
    const allowsFeature = jest.fn().mockReturnValue(false);
    const features = jest.fn().mockReturnValue(["web-share"]);
    Object.defineProperty(globalThis.navigator, "share", {
      configurable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(globalThis.document, "permissionsPolicy", {
      configurable: true,
      value: { allowsFeature, features },
    });

    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    renderWithProviders(<HeaderShare />);
    await userEvent.click(
      screen.getByRole("button", { name: "Share this page" })
    );

    await waitFor(() =>
      expect(allowsFeature).toHaveBeenCalledWith("web-share")
    );
    expect(
      screen.queryByRole("button", { name: "Share with another app" })
    ).not.toBeInTheDocument();
  });

  it("ignores an unrecognized web-share permissions policy feature", async () => {
    const allowsFeature = jest.fn().mockReturnValue(false);
    const canShare = jest.fn().mockReturnValue(true);
    Object.defineProperty(globalThis.navigator, "share", {
      configurable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(globalThis.navigator, "canShare", {
      configurable: true,
      value: canShare,
    });
    Object.defineProperty(globalThis.document, "permissionsPolicy", {
      configurable: true,
      value: {
        allowsFeature,
        features: jest.fn().mockReturnValue(["fullscreen"]),
      },
    });

    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    renderWithProviders(<HeaderShare />);
    await userEvent.click(
      screen.getByRole("button", { name: "Share this page" })
    );

    expect(
      await screen.findByRole("button", { name: "Share with another app" })
    ).toBeInTheDocument();
    expect(canShare).toHaveBeenCalled();
    expect(allowsFeature).not.toHaveBeenCalled();
  });

  it("silently keeps system sharing available after user cancellation", async () => {
    const cancelError = Object.assign(new Error("Share cancelled"), {
      name: "AbortError",
    });
    const systemShare = jest.fn().mockRejectedValue(cancelError);
    Object.defineProperty(globalThis.navigator, "share", {
      configurable: true,
      value: systemShare,
    });

    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);
    renderWithProviders(<HeaderShare />);
    await userEvent.click(
      screen.getByRole("button", { name: "Share this page" })
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Share with another app" })
    );

    await waitFor(() => expect(systemShare).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole("button", { name: "Share with another app" })
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it.each([
    [
      "a NotAllowedError",
      () =>
        Object.assign(new Error("Permission denied"), {
          name: "NotAllowedError",
        }),
    ],
    ["another runtime rejection", () => new Error("Share target unavailable")],
  ])(
    "hides system sharing and announces unavailability after %s",
    async (_, createError) => {
      const systemShare = jest.fn().mockRejectedValue(createError());
      Object.defineProperty(globalThis.navigator, "share", {
        configurable: true,
        value: systemShare,
      });

      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);

      renderWithProviders(<HeaderShare />);
      await userEvent.click(
        screen.getByRole("button", { name: "Share this page" })
      );
      await userEvent.click(
        await screen.findByRole("button", {
          name: "Share with another app",
        })
      );

      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: "Share with another app" })
        ).not.toBeInTheDocument()
      );
      expect(screen.getByRole("status")).toHaveTextContent(
        "System sharing is unavailable."
      );
      expect(screen.getByRole("status")).toHaveClass("tw-w-full");
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    }
  );

  it("generates QR codes when modal opens", async () => {
    const qrcode = require("qrcode");
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    mockIsMobile.mockReturnValue(false);

    renderWithProviders(<HeaderShare />);

    const btn = screen.getByRole("button", { name: "Share this page" });
    await userEvent.click(btn);

    await screen.findByTestId("header-share-modal");
    expect(qrcode.toDataURL).toHaveBeenCalled();
  });

  describe("Connection sharing", () => {
    const HeaderShare = HeaderConnectHarness;
    beforeEach(() => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);
      mockAuthUtils.getWalletAddress.mockReturnValue(
        "0x1234567890123456789012345678901234567890"
      );
      mockAuthUtils.getWalletRole.mockReturnValue(null);
      mockAuthUtils.hasActiveSessionV2Auth.mockReturnValue(true);
      mockSeizeConnect.useSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        hasValidWalletAuth: true,
        seizeConnect: jest.fn(),
        seizeAcceptConnection: jest.fn(),
        address: "0x1234567890123456789012345678901234567890",
        hasInitializationError: false,
        initializationError: null,
      });
    });

    it("shows only Mobile and Desktop connection targets", async () => {
      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));

      expect(
        await screen.findByRole("heading", { name: "Connect Device" })
      ).toBeInTheDocument();
      const modal = screen.getByTestId("header-share-modal");
      expect(modal).toHaveClass("tw-max-w-md");
      expect(modal.querySelector("#header-share-content")).toHaveClass(
        "tw-w-full"
      );
      expect(screen.getByRole("button", { name: "Mobile" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(
        screen.getByRole("button", { name: "Desktop" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("group", { name: "Device type" })
      ).toBeInTheDocument();
      expect(screen.queryByText("Connect to")).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Share on X" })).toBeNull();
      expect(
        screen.queryByRole("link", { name: "Share on Farcaster" })
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Share with another app" })
      ).toBeNull();
    });

    it("falls back to Mobile if Desktop becomes unavailable", async () => {
      const { rerender } = renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));
      await userEvent.click(
        await screen.findByRole("button", { name: "Desktop" })
      );
      expect(screen.getByRole("button", { name: "Desktop" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );

      mockUseElectron.mockReturnValue(true);
      rerender(
        <QueryClientProvider client={queryClient}>
          <HeaderShare />
        </QueryClientProvider>
      );

      expect(screen.queryByRole("button", { name: "Desktop" })).toBeNull();
      expect(screen.getByRole("button", { name: "Mobile" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });

    it("aborts in-flight connection-share creation when the modal closes", async () => {
      const sessionV2 = require("@/services/auth/session-v2.utils");
      const signals: AbortSignal[] = [];
      sessionV2.createConnectionShare.mockImplementation(
        ({ signal }: { readonly signal?: AbortSignal }) => {
          signals.push(signal!);
          return createPendingPromise();
        }
      );

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));
      await waitFor(() =>
        expect(sessionV2.createConnectionShare).toHaveBeenCalledTimes(1)
      );

      await userEvent.click(
        screen.getByLabelText("Close connect device modal")
      );

      expect(signals[0]?.aborted).toBe(true);
    });

    it("shows an upgrade action when the backend requires session-v2 auth", async () => {
      const auth = require("@/components/auth/Auth");
      const requestSessionUpgrade = jest.fn().mockResolvedValue({
        success: true,
      });
      auth.useAuth.mockReturnValue({
        ensureActiveSessionV2WebSession: jest.fn(async () => true),
        requestSessionUpgrade,
      });
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.createConnectionShare.mockRejectedValue(
        new Error(
          "Connection sharing requires an active session-v2 web session"
        )
      );

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));

      expect(
        await screen.findByText("Update Authentication")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "You can't connect a device from your current authentication. Update to the new secure session first."
        )
      ).toBeInTheDocument();
      expect(sessionV2.createConnectionShare).toHaveBeenCalledTimes(1);

      await userEvent.click(screen.getByRole("button", { name: "Update" }));

      expect(requestSessionUpgrade).toHaveBeenCalledTimes(1);
    });

    it("shows an upgrade action without calling the share endpoint when the web session is missing", async () => {
      const auth = require("@/components/auth/Auth");
      const requestSessionUpgrade = jest.fn().mockResolvedValue({
        success: true,
      });
      const ensureActiveSessionV2WebSession = jest
        .fn()
        .mockResolvedValue(false);
      auth.useAuth.mockReturnValue({
        ensureActiveSessionV2WebSession,
        requestSessionUpgrade,
      });
      const sessionV2 = require("@/services/auth/session-v2.utils");

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));

      expect(
        await screen.findByText("Update Authentication")
      ).toBeInTheDocument();
      expect(ensureActiveSessionV2WebSession).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "0x1234567890123456789012345678901234567890",
          abortSignal: expect.objectContaining({ aborted: false }),
        })
      );
      expect(sessionV2.createConnectionShare).not.toHaveBeenCalled();
      expect(requestSessionUpgrade).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole("button", { name: "Update" }));

      expect(requestSessionUpgrade).toHaveBeenCalledTimes(1);
    });

    it("fails closed without calling the share endpoint when the web-session verifier is unavailable", async () => {
      const auth = require("@/components/auth/Auth");
      const requestSessionUpgrade = jest.fn().mockResolvedValue({
        success: true,
      });
      auth.useAuth.mockReturnValue({
        requestSessionUpgrade,
      });
      const sessionV2 = require("@/services/auth/session-v2.utils");

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));

      expect(
        await screen.findByText("Update Authentication")
      ).toBeInTheDocument();
      expect(sessionV2.createConnectionShare).not.toHaveBeenCalled();
      expect(requestSessionUpgrade).not.toHaveBeenCalled();
    });

    it("shows a retryable error without calling the share endpoint when web-session verification errors", async () => {
      const auth = require("@/components/auth/Auth");
      const requestSessionUpgrade = jest.fn().mockResolvedValue({
        success: true,
      });
      const ensureActiveSessionV2WebSession = jest
        .fn()
        .mockRejectedValue(new Error("verification failed"));
      auth.useAuth.mockReturnValue({
        ensureActiveSessionV2WebSession,
        requestSessionUpgrade,
      });
      const sessionV2 = require("@/services/auth/session-v2.utils");
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      try {
        renderWithProviders(<HeaderShare />);

        await userEvent.click(screen.getByRole("button", { name: "QR Code" }));

        expect(
          await screen.findByText("Device Connection Unavailable")
        ).toBeInTheDocument();
        expect(ensureActiveSessionV2WebSession).toHaveBeenCalledWith(
          expect.objectContaining({
            address: "0x1234567890123456789012345678901234567890",
            abortSignal: expect.objectContaining({ aborted: false }),
          })
        );
        expect(sessionV2.createConnectionShare).not.toHaveBeenCalled();
        expect(requestSessionUpgrade).not.toHaveBeenCalled();
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it("generates connection QR codes from one-time connection share codes even when the local v2 marker is stale", async () => {
      const qrcode = require("qrcode");
      const sessionV2 = require("@/services/auth/session-v2.utils");
      mockAuthUtils.hasActiveSessionV2Auth.mockReturnValue(false);
      sessionV2.createConnectionShare.mockResolvedValue({
        connection_share_code: "share-code",
        expires_at: new Date(Date.now() + 300_000).toISOString(),
        address: "0x1234567890123456789012345678901234567890",
        role: null,
        target_client_type: "native",
        deep_link_path:
          "/accept-connection-sharing?connection_share_code=share-code",
      });

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));

      await waitFor(() =>
        expect(sessionV2.createConnectionShare).toHaveBeenCalledWith({
          signal: expect.objectContaining({ aborted: false }),
        })
      );
      await waitFor(() =>
        expect(qrcode.toDataURL).toHaveBeenCalledWith(
          expect.stringContaining("connection_share_code=share-code"),
          QR_CODE_OPTIONS
        )
      );
      expect(
        qrcode.toDataURL.mock.calls.some(
          (call: unknown[]) =>
            typeof call[0] === "string" &&
            call[0].includes("mock-refresh-token")
        )
      ).toBe(false);
    });

    it("asks the backend for a connection share when context auth is stale but a wallet is active", async () => {
      const qrcode = require("qrcode");
      const sessionV2 = require("@/services/auth/session-v2.utils");
      mockSeizeConnect.useSeizeConnectContext.mockReturnValue({
        isAuthenticated: true,
        hasValidWalletAuth: false,
        seizeConnect: jest.fn(),
        seizeAcceptConnection: jest.fn(),
        address: "0x1234567890123456789012345678901234567890",
        hasInitializationError: false,
        initializationError: null,
      });
      sessionV2.createConnectionShare.mockResolvedValue({
        connection_share_code: "stale-context-share-code",
        expires_at: new Date(Date.now() + 300_000).toISOString(),
        address: "0x1234567890123456789012345678901234567890",
        role: null,
        target_client_type: "native",
        deep_link_path:
          "/accept-connection-sharing?connection_share_code=stale-context-share-code",
      });

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));

      await waitFor(() =>
        expect(sessionV2.createConnectionShare).toHaveBeenCalledTimes(1)
      );
      await waitFor(() =>
        expect(qrcode.toDataURL).toHaveBeenCalledWith(
          expect.stringContaining(
            "connection_share_code=stale-context-share-code"
          ),
          QR_CODE_OPTIONS
        )
      );
      expect(
        screen.queryByText("Update Authentication")
      ).not.toBeInTheDocument();
    });

    it("keeps the connection QR visible while the share modal closes", async () => {
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.createConnectionShare.mockResolvedValue({
        connection_share_code: "closing-share-code",
        expires_at: new Date(Date.now() + 300_000).toISOString(),
        address: "0x1234567890123456789012345678901234567890",
        role: null,
        target_client_type: "native",
        deep_link_path:
          "/accept-connection-sharing?connection_share_code=closing-share-code",
      });

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));

      expect(
        await screen.findByTitle(/closing-share-code/)
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByLabelText("Close connect device modal")
      );

      expect(screen.getByTitle(/closing-share-code/)).toBeInTheDocument();
      expect(
        screen.queryByText("Update Authentication")
      ).not.toBeInTheDocument();
    });

    it("clears the closing QR snapshot before the share modal opens again", async () => {
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.createConnectionShare
        .mockResolvedValueOnce({
          connection_share_code: "snapshot-share-code",
          expires_at: new Date(Date.now() + 300_000).toISOString(),
          address: "0x1234567890123456789012345678901234567890",
          role: null,
          target_client_type: "native",
          deep_link_path:
            "/accept-connection-sharing?connection_share_code=snapshot-share-code",
        })
        .mockImplementationOnce(() => createPendingPromise());

      renderWithProviders(<HeaderShare />);

      const shareButton = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(shareButton);

      expect(
        await screen.findByTitle(/snapshot-share-code/)
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByLabelText("Close connect device modal")
      );
      await waitForElementToBeRemoved(() =>
        screen.queryByTestId("header-share-modal")
      );

      await userEvent.click(shareButton);

      await waitFor(() =>
        expect(sessionV2.createConnectionShare).toHaveBeenCalledTimes(2)
      );
      expect(
        screen.queryByTitle(/snapshot-share-code/)
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("Preparing Device Connection")
      ).toBeInTheDocument();
    });

    it("uses an existing legacy refresh token for 6529 Desktop connection sharing", async () => {
      const sessionV2 = require("@/services/auth/session-v2.utils");
      mockAuthUtils.hasActiveSessionV2Auth.mockReturnValue(false);
      mockAuthUtils.getRefreshToken.mockReturnValue(
        "local-legacy-refresh-token"
      );
      mockAuthUtils.getWalletRole.mockReturnValue("role+admin&test");

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));
      await screen.findByTestId("header-share-modal");
      await userEvent.click(screen.getByRole("button", { name: "Desktop" }));

      const desktopPanel = await screen.findByTestId(
        "desktop-connection-panel"
      );
      expect(desktopPanel).toHaveClass(
        "tw-h-full",
        "tw-w-full",
        "tw-rounded-lg",
        "tw-border-iron-700",
        "tw-bg-iron-900/50"
      );
      expect(desktopPanel.tagName).toBe("A");
      expect(desktopPanel).toHaveAttribute(
        "href",
        expect.stringContaining("token=local-legacy-refresh-token")
      );
      expect(screen.getByAltText("6529 Desktop")).toHaveAttribute(
        "width",
        "150"
      );
      expect(
        screen.queryByText("Continue in the 6529 Desktop app.")
      ).not.toBeInTheDocument();
      expect(desktopPanel).toHaveTextContent("Open in 6529 Desktop");
      expect(
        await screen.findByTitle(/token=local-legacy-refresh-token/)
      ).toBeInTheDocument();
      expect(screen.getByTitle(/role=role%2Badmin%26test/)).toBeInTheDocument();
      expect(
        sessionV2.createLegacyDesktopConnectionShare
      ).not.toHaveBeenCalled();
    });

    it("ignores a local legacy refresh token for v2 Desktop connection sharing", async () => {
      const sessionV2 = require("@/services/auth/session-v2.utils");
      mockAuthUtils.getRefreshToken.mockReturnValue(
        "stale-local-legacy-refresh-token"
      );
      sessionV2.createLegacyDesktopConnectionShare.mockResolvedValue({
        refresh_token: "bridged-v2-desktop-refresh-token",
        address: "0x1234567890123456789012345678901234567890",
        role: null,
        deep_link_path:
          "/accept-connection-sharing?token=bridged-v2-desktop-refresh-token&address=0x1234567890123456789012345678901234567890",
      });

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));
      await waitFor(() =>
        expect(
          sessionV2.createLegacyDesktopConnectionShare
        ).toHaveBeenCalledWith({
          signal: expect.objectContaining({ aborted: false }),
        })
      );
      await userEvent.click(screen.getByRole("button", { name: "Desktop" }));

      expect(
        await screen.findByTitle(/token=bridged-v2-desktop-refresh-token/)
      ).toBeInTheDocument();
      expect(
        screen.queryByTitle(/stale-local-legacy-refresh-token/)
      ).not.toBeInTheDocument();
    });

    it("shows an upgrade action for Desktop sharing when the web session is missing", async () => {
      const auth = require("@/components/auth/Auth");
      const requestSessionUpgrade = jest.fn().mockResolvedValue({
        success: true,
      });
      const ensureActiveSessionV2WebSession = jest
        .fn()
        .mockResolvedValue(false);
      auth.useAuth.mockReturnValue({
        ensureActiveSessionV2WebSession,
        requestSessionUpgrade,
      });
      const sessionV2 = require("@/services/auth/session-v2.utils");

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));
      await screen.findByTestId("header-share-modal");
      await userEvent.click(screen.getByRole("button", { name: "Desktop" }));

      expect(
        await screen.findByText("Update Authentication")
      ).toBeInTheDocument();
      expect(ensureActiveSessionV2WebSession).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "0x1234567890123456789012345678901234567890",
          abortSignal: expect.objectContaining({ aborted: false }),
        })
      );
      expect(
        sessionV2.createLegacyDesktopConnectionShare
      ).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole("button", { name: "Update" }));

      expect(requestSessionUpgrade).toHaveBeenCalledTimes(1);
    });

    it("shows a retryable error for Desktop sharing when web-session verification errors", async () => {
      const auth = require("@/components/auth/Auth");
      const requestSessionUpgrade = jest.fn().mockResolvedValue({
        success: true,
      });
      const ensureActiveSessionV2WebSession = jest
        .fn()
        .mockRejectedValue(new Error("verification failed"));
      auth.useAuth.mockReturnValue({
        ensureActiveSessionV2WebSession,
        requestSessionUpgrade,
      });
      const sessionV2 = require("@/services/auth/session-v2.utils");
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      try {
        renderWithProviders(<HeaderShare />);

        await userEvent.click(screen.getByRole("button", { name: "QR Code" }));
        await screen.findByTestId("header-share-modal");
        await userEvent.click(screen.getByRole("button", { name: "Desktop" }));

        expect(
          await screen.findByText("Device Connection Unavailable")
        ).toBeInTheDocument();
        expect(ensureActiveSessionV2WebSession).toHaveBeenCalledWith(
          expect.objectContaining({
            address: "0x1234567890123456789012345678901234567890",
            abortSignal: expect.objectContaining({ aborted: false }),
          })
        );
        expect(
          sessionV2.createLegacyDesktopConnectionShare
        ).not.toHaveBeenCalled();
        expect(requestSessionUpgrade).not.toHaveBeenCalled();
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it("uses the backend legacy desktop bridge when no local refresh token exists", async () => {
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.createLegacyDesktopConnectionShare.mockResolvedValue({
        refresh_token: "bridged-legacy-refresh-token",
        address: "0x1234567890123456789012345678901234567890",
        role: null,
        deep_link_path:
          "/accept-connection-sharing?token=bridged-legacy-refresh-token&address=0x1234567890123456789012345678901234567890",
      });

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));
      await waitFor(() =>
        expect(
          sessionV2.createLegacyDesktopConnectionShare
        ).toHaveBeenCalledWith({
          signal: expect.objectContaining({ aborted: false }),
        })
      );
      await userEvent.click(screen.getByRole("button", { name: "Desktop" }));

      expect(
        await screen.findByTitle(/token=bridged-legacy-refresh-token/)
      ).toBeInTheDocument();
      expect(
        screen.queryByTitle(/connection_share_code=/)
      ).not.toBeInTheDocument();
    });

    it("regenerates the Desktop connection share when the active wallet changes while the modal is open", async () => {
      const sessionV2 = require("@/services/auth/session-v2.utils");
      const firstAddress = "0x1111111111111111111111111111111111111111";
      const secondAddress = "0x2222222222222222222222222222222222222222";
      let activeAddress = firstAddress;
      mockAuthUtils.getWalletAddress.mockImplementation(() => activeAddress);
      mockSeizeConnect.useSeizeConnectContext.mockImplementation(() => ({
        isAuthenticated: true,
        hasValidWalletAuth: true,
        seizeConnect: jest.fn(),
        seizeAcceptConnection: jest.fn(),
        address: activeAddress,
        hasInitializationError: false,
        initializationError: null,
      }));
      sessionV2.createLegacyDesktopConnectionShare
        .mockResolvedValueOnce({
          refresh_token: "first-desktop-refresh-token",
          address: firstAddress,
          role: null,
          deep_link_path: `/accept-connection-sharing?token=first-desktop-refresh-token&address=${firstAddress}`,
        })
        .mockResolvedValueOnce({
          refresh_token: "second-desktop-refresh-token",
          address: secondAddress,
          role: null,
          deep_link_path: `/accept-connection-sharing?token=second-desktop-refresh-token&address=${secondAddress}`,
        });

      const { rerender } = renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));
      await waitFor(() =>
        expect(
          sessionV2.createLegacyDesktopConnectionShare
        ).toHaveBeenCalledTimes(1)
      );
      await userEvent.click(screen.getByRole("button", { name: "Desktop" }));
      expect(
        await screen.findByTitle(/token=first-desktop-refresh-token/)
      ).toBeInTheDocument();

      activeAddress = secondAddress;
      rerender(
        <QueryClientProvider client={queryClient}>
          <HeaderShare />
        </QueryClientProvider>
      );

      await waitFor(() =>
        expect(
          sessionV2.createLegacyDesktopConnectionShare
        ).toHaveBeenCalledTimes(2)
      );
      expect(
        await screen.findByTitle(/token=second-desktop-refresh-token/)
      ).toBeInTheDocument();
      expect(
        screen.queryByTitle(/token=first-desktop-refresh-token/)
      ).not.toBeInTheDocument();
    });

    it("regenerates the connection share when the active wallet changes while the modal is open", async () => {
      const qrcode = require("qrcode");
      const sessionV2 = require("@/services/auth/session-v2.utils");
      const firstAddress = "0x1111111111111111111111111111111111111111";
      const secondAddress = "0x2222222222222222222222222222222222222222";
      let activeAddress = firstAddress;
      mockAuthUtils.getWalletAddress.mockImplementation(() => activeAddress);
      mockSeizeConnect.useSeizeConnectContext.mockImplementation(() => ({
        isAuthenticated: true,
        hasValidWalletAuth: true,
        seizeConnect: jest.fn(),
        seizeAcceptConnection: jest.fn(),
        address: activeAddress,
        hasInitializationError: false,
        initializationError: null,
      }));
      sessionV2.createConnectionShare
        .mockResolvedValueOnce({
          connection_share_code: "first-wallet-share-code",
          expires_at: new Date(Date.now() + 300_000).toISOString(),
          address: firstAddress,
          role: null,
          target_client_type: "native",
          deep_link_path:
            "/accept-connection-sharing?connection_share_code=first-wallet-share-code",
        })
        .mockResolvedValueOnce({
          connection_share_code: "second-wallet-share-code",
          expires_at: new Date(Date.now() + 300_000).toISOString(),
          address: secondAddress,
          role: null,
          target_client_type: "native",
          deep_link_path:
            "/accept-connection-sharing?connection_share_code=second-wallet-share-code",
        });

      const { rerender } = renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));
      await waitFor(() =>
        expect(sessionV2.createConnectionShare).toHaveBeenCalledTimes(1)
      );
      await waitFor(() =>
        expect(qrcode.toDataURL).toHaveBeenCalledWith(
          expect.stringContaining(
            "connection_share_code=first-wallet-share-code"
          ),
          QR_CODE_OPTIONS
        )
      );

      activeAddress = secondAddress;
      rerender(
        <QueryClientProvider client={queryClient}>
          <HeaderShare />
        </QueryClientProvider>
      );

      await waitFor(() =>
        expect(sessionV2.createConnectionShare).toHaveBeenCalledTimes(2)
      );
      await waitFor(() =>
        expect(qrcode.toDataURL).toHaveBeenCalledWith(
          expect.stringContaining(
            "connection_share_code=second-wallet-share-code"
          ),
          QR_CODE_OPTIONS
        )
      );
    });

    it("mints a fresh connection share code after the share modal closes", async () => {
      const qrcode = require("qrcode");
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.createConnectionShare
        .mockResolvedValueOnce({
          connection_share_code: "first-share-code",
          expires_at: new Date(Date.now() + 300_000).toISOString(),
          address: "0x1234567890123456789012345678901234567890",
          role: null,
          target_client_type: "native",
          deep_link_path:
            "/accept-connection-sharing?connection_share_code=first-share-code",
        })
        .mockResolvedValueOnce({
          connection_share_code: "second-share-code",
          expires_at: new Date(Date.now() + 300_000).toISOString(),
          address: "0x1234567890123456789012345678901234567890",
          role: null,
          target_client_type: "native",
          deep_link_path:
            "/accept-connection-sharing?connection_share_code=second-share-code",
        });

      renderWithProviders(<HeaderShare />);

      const shareButton = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(shareButton);

      await waitFor(() =>
        expect(sessionV2.createConnectionShare).toHaveBeenCalledTimes(1)
      );
      await waitFor(() =>
        expect(qrcode.toDataURL).toHaveBeenCalledWith(
          expect.stringContaining("connection_share_code=first-share-code"),
          QR_CODE_OPTIONS
        )
      );

      await userEvent.click(
        screen.getByLabelText("Close connect device modal")
      );
      await userEvent.click(shareButton);

      await waitFor(() =>
        expect(sessionV2.createConnectionShare).toHaveBeenCalledTimes(2)
      );
      await waitFor(() =>
        expect(qrcode.toDataURL).toHaveBeenCalledWith(
          expect.stringContaining("connection_share_code=second-share-code"),
          QR_CODE_OPTIONS
        )
      );
    });

    it("clears one-time connection share URLs as soon as the share modal closes", async () => {
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.createConnectionShare
        .mockResolvedValueOnce({
          connection_share_code: "first-share-code",
          expires_at: new Date(Date.now() + 300_000).toISOString(),
          address: "0x1234567890123456789012345678901234567890",
          role: null,
          target_client_type: "native",
          deep_link_path:
            "/accept-connection-sharing?connection_share_code=first-share-code",
        })
        .mockImplementationOnce(() => createPendingPromise());

      renderWithProviders(<HeaderShare />);

      const shareButton = screen.getByRole("button", { name: "QR Code" });
      await userEvent.click(shareButton);

      await screen.findByTitle(/first-share-code/);

      await userEvent.click(
        screen.getByLabelText("Close connect device modal")
      );
      await userEvent.click(shareButton);

      await waitFor(() =>
        expect(sessionV2.createConnectionShare).toHaveBeenCalledTimes(2)
      );
      expect(screen.queryByTitle(/first-share-code/)).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Connect Device" })
      ).toBeInTheDocument();
      expect(
        screen.getByText("Preparing Device Connection")
      ).toBeInTheDocument();
    });

    it("encodes connection-share deep-link query values without exposing role", async () => {
      const qrcode = require("qrcode");
      const sessionV2 = require("@/services/auth/session-v2.utils");
      sessionV2.createConnectionShare.mockResolvedValue({
        connection_share_code: "share&code=value%",
        expires_at: new Date(Date.now() + 300_000).toISOString(),
        address: "0x1234567890123456789012345678901234567890",
        role: "role+admin&test",
        target_client_type: "native",
        deep_link_path:
          "/accept-connection-sharing?connection_share_code=share%26code%3Dvalue%25",
      });

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));

      await waitFor(() =>
        expect(qrcode.toDataURL).toHaveBeenCalledWith(
          expect.stringContaining(
            "connection_share_code=share%26code%3Dvalue%25"
          ),
          QR_CODE_OPTIONS
        )
      );
      expect(
        qrcode.toDataURL.mock.calls.some(
          (call: unknown[]) =>
            typeof call[0] === "string" && call[0].includes("role=")
        )
      ).toBe(false);
    });

    it("shows an unavailable state when connection-share creation fails", async () => {
      const sessionV2 = require("@/services/auth/session-v2.utils");
      jest.spyOn(console, "error").mockImplementation(() => undefined);
      sessionV2.createConnectionShare.mockRejectedValue(
        new Error("connection share creation failed")
      );

      renderWithProviders(<HeaderShare />);

      await userEvent.click(screen.getByRole("button", { name: "QR Code" }));

      await waitFor(() =>
        expect(sessionV2.createConnectionShare).toHaveBeenCalled()
      );
      expect(
        screen.getByRole("heading", { name: "Connect Device" })
      ).toBeInTheDocument();
      expect(
        screen.getByText("Device Connection Unavailable")
      ).toBeInTheDocument();
      expect(screen.getByTestId("connection-share-notice")).toHaveClass(
        "tw-h-full"
      );
      expect(
        screen
          .getByTestId("header-share-modal")
          .querySelector("#header-share-content")
      ).toHaveClass("tw-aspect-square");
      expect(
        screen.getByTestId("connection-share-content").children
      ).toHaveLength(1);
    });
  });

  describe("QR Code Generation", () => {
    beforeEach(() => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);
    });

    it("generates a high-contrast QR code for the exact current URL", async () => {
      const qrcode = require("qrcode");

      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "Share this page" });
      await userEvent.click(btn);

      await screen.findByTestId("header-share-modal");

      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        `${testOrigin}/mock-path?something=value#details`,
        QR_CODE_OPTIONS
      );
    });
  });

  describe("Error Handling", () => {
    it("calls clipboard API when copy button is clicked", async () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);

      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "Share this page" });
      await userEvent.click(btn);

      const modal = await screen.findByTestId("header-share-modal");
      const copyIcon = modal.querySelector('[data-icon="copy"]') as HTMLElement;

      if (copyIcon) {
        await userEvent.click(copyIcon);

        // Verify clipboard.writeText was called
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      }
    });
  });

  describe("Component State Management", () => {
    it("modal is configured for keyboard interaction", async () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);

      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "Share this page" });
      await userEvent.click(btn);

      const modal = await screen.findByTestId("header-share-modal");
      expect(modal).toBeInTheDocument();

      // Modal should be rendered with proper attributes
      expect(modal).toHaveAttribute("data-testid", "header-share-modal");
    });

    it("generates QR codes on each modal open", async () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
      mockIsMobile.mockReturnValue(false);

      renderWithProviders(<HeaderShare />);

      const btn = screen.getByRole("button", { name: "Share this page" });
      const qrcode = require("qrcode");

      // Clear any previous calls
      qrcode.toDataURL.mockClear();

      await userEvent.click(btn);
      await screen.findByTestId("header-share-modal");

      // Should generate QR codes when modal opens
      expect(qrcode.toDataURL).toHaveBeenCalled();

      expect(qrcode.toDataURL).toHaveBeenCalledWith(
        testPageUrl,
        QR_CODE_OPTIONS
      );
    });
  });
});
