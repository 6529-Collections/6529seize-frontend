import {
  SeizeConnectProvider,
  useSeizeConnectContext,
} from "@/components/auth/SeizeConnectContext";
import type { SeizeConnectContextType } from "@/components/auth/seizeConnectTypes";
import {
  closeDesktopConnectDialog,
  getDesktopConnectDialogOpener,
} from "@/services/desktop/desktopConnectDialog";
import { act, render, waitFor } from "@testing-library/react";

const mockOpen = jest.fn();
const mockClose = jest.fn();

jest.mock("@reown/appkit/react", () => ({
  useAppKit: jest.fn(() => ({ open: mockOpen, close: mockClose })),
  useAppKitAccount: jest.fn(() => ({
    address: undefined,
    isConnected: false,
    status: "disconnected",
  })),
  useAppKitState: jest.fn(() => ({ open: false })),
  useDisconnect: jest.fn(() => ({ disconnect: jest.fn() })),
  useWalletInfo: jest.fn(() => ({ walletInfo: null })),
}));

jest.mock("viem", () => ({
  isAddress: jest.fn((address: string) => /^0x[a-fA-F0-9]{40}$/.test(address)),
  getAddress: jest.fn((address: string) => address.toLowerCase()),
}));

jest.mock("wagmi", () => ({
  useAccount: jest.fn(() => ({})),
}));

jest.mock("@/hooks/useConnectedAccountsUnreadNotifications", () => ({
  useConnectedAccountsUnreadNotifications: jest.fn(() => ({})),
}));

jest.mock("@/hooks/useUnreadNotifications", () => ({
  useUnreadNotifications: jest.fn(() => ({
    notifications: { unread_count: 0 },
    haveUnreadNotifications: false,
  })),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  canStoreAnotherWalletAccount: jest.fn(() => true),
  clearAgentLoginActiveAddress: jest.fn(),
  getAgentLoginActiveAddress: jest.fn(() => null),
  getConnectedWalletAccounts: jest.fn(() => []),
  getWalletAddress: jest.fn(() => null),
  syncWalletAuthCookie: jest.fn(),
  isAuthAddressAuthorized: jest.fn(() => false),
  setActiveWalletAccount: jest.fn(() => true),
  removeAuthJwt: jest.fn(),
  WALLET_ACCOUNTS_UPDATED_EVENT: "6529-wallet-accounts-updated",
  PROFILE_SWITCHED_EVENT: "6529-profile-switched",
}));

type ContextFunctionName = {
  [K in keyof SeizeConnectContextType]: SeizeConnectContextType[K] extends (
    ...args: never[]
  ) => unknown
    ? K
    : never;
}[keyof SeizeConnectContextType];

/**
 * Every context function that starts a wallet connection. In 6529 Desktop
 * each must open the desktop connect choice instead of the wallet list.
 */
const CONNECT_ENTRY_POINTS: Partial<
  Record<ContextFunctionName, (context: SeizeConnectContextType) => unknown>
> = {
  seizeConnect: (context) => context.seizeConnect(),
  seizeConnectFresh: (context) => context.seizeConnectFresh(),
  seizeAddConnectedAccount: (context) => context.seizeAddConnectedAccount(),
};

/** Context functions that never open a wallet connection. */
const NOT_CONNECT_ENTRY_POINTS: readonly ContextFunctionName[] = [
  "seizeDisconnect",
  "seizeDisconnectAndLogout",
  "seizeDisconnectAndLogoutAll",
  "seizeAcceptConnection",
  "seizeSwitchConnectedAccount",
];

let context: SeizeConnectContextType | null = null;

function CaptureContext() {
  context = useSeizeConnectContext();
  return null;
}

const renderProvider = () =>
  render(
    <SeizeConnectProvider>
      <CaptureContext />
    </SeizeConnectProvider>
  );

const installDesktopShell = () => {
  Object.defineProperty(window, "api", {
    configurable: true,
    value: { openExternal: jest.fn() },
  });
  Object.defineProperty(window, "nativeAuth", {
    configurable: true,
    value: { sessionLogin: jest.fn() },
  });
};

describe("connect entry points in 6529 Desktop", () => {
  afterEach(() => {
    jest.clearAllMocks();
    closeDesktopConnectDialog();
    context = null;
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
  });

  it("classifies every context function, so a new entry point cannot skip the desktop choice", () => {
    renderProvider();

    const functionNames = Object.entries(context ?? {})
      .filter(([, value]) => typeof value === "function")
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b));
    const classified = [
      ...Object.keys(CONNECT_ENTRY_POINTS),
      ...NOT_CONNECT_ENTRY_POINTS,
    ].sort((a, b) => a.localeCompare(b));

    // A new context function must be added to one of the two lists. A connect
    // entry point is then covered by the desktop test below.
    expect(functionNames).toEqual(classified);
  });

  it.each(Object.entries(CONNECT_ENTRY_POINTS))(
    "%s opens the desktop connect choice, not the wallet list",
    async (_name, start) => {
      installDesktopShell();
      renderProvider();

      await act(async () => {
        await start(context as SeizeConnectContextType);
      });

      expect(getDesktopConnectDialogOpener()).not.toBeNull();
      expect(mockOpen).not.toHaveBeenCalled();
    }
  );

  it("opens the wallet list once WalletConnect is chosen", async () => {
    installDesktopShell();
    renderProvider();

    act(() => {
      context?.seizeConnect();
    });
    await waitFor(() => expect(getDesktopConnectDialogOpener()).not.toBeNull());
    await act(async () => {
      await getDesktopConnectDialogOpener()?.();
    });

    // Straight to the WalletConnect QR code, not a list of extension-like
    // wallets the desktop window cannot use.
    await waitFor(() =>
      expect(mockOpen).toHaveBeenCalledWith({
        view: "ConnectingWalletConnectBasic",
      })
    );
  });

  it("does not open AppKit for a cancelled Desktop phone-wallet handoff", async () => {
    installDesktopShell();
    renderProvider();
    const controller = new AbortController();
    await act(async () => {
      await context?.seizeConnectFresh({
        address: `0x${"a".repeat(40)}`,
        signal: controller.signal,
        onStatus: jest.fn(),
      });
    });
    const handoff = getDesktopConnectDialogOpener();
    if (!handoff) throw new Error("Desktop picker did not open");

    await act(async () => {
      const opening = handoff();
      controller.abort();
      await opening;
    });

    expect(mockOpen).not.toHaveBeenCalled();
  });

  it("closes a superseded AppKit open before the newer handoff opens its modal", async () => {
    installDesktopShell();
    renderProvider();
    const firstOpen = Promise.withResolvers<void>();
    const calls: string[] = [];
    mockOpen
      .mockReturnValueOnce(firstOpen.promise)
      .mockImplementationOnce(() => calls.push("open new"));
    mockClose.mockImplementationOnce(() => calls.push("close old"));

    const startHandoff = async (controller: AbortController) => {
      await context?.seizeConnectFresh({
        address: `0x${"a".repeat(40)}`,
        signal: controller.signal,
        onStatus: jest.fn(),
      });
      const open = getDesktopConnectDialogOpener();
      if (!open) throw new Error("Desktop picker did not open");
      return { handoff: open() };
    };

    const first = new AbortController();
    let earlier: Promise<void> | undefined;
    let later: Promise<void> | undefined;
    await act(async () => {
      earlier = (await startHandoff(first)).handoff;
    });
    expect(mockOpen).toHaveBeenCalledTimes(1);

    await act(async () => {
      first.abort();
      later = (await startHandoff(new AbortController())).handoff;
    });
    expect(mockOpen).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstOpen.resolve();
      await Promise.all([earlier, later]);
    });
    expect(calls).toEqual(["close old", "open new"]);
  });

  it("keeps opening the wallet list directly on the web", async () => {
    renderProvider();

    act(() => {
      context?.seizeConnect();
    });

    await waitFor(() =>
      expect(mockOpen).toHaveBeenCalledWith({ view: "Connect" })
    );
    expect(getDesktopConnectDialogOpener()).toBeNull();
  });
});
