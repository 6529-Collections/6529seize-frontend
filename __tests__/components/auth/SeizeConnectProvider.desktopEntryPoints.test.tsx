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

jest.mock("@reown/appkit/react", () => ({
  useAppKit: jest.fn(() => ({ open: mockOpen, close: jest.fn() })),
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

    await waitFor(() => expect(mockOpen).toHaveBeenCalled());
  });

  it("keeps opening the wallet list directly on the web", async () => {
    renderProvider();

    act(() => {
      context?.seizeConnect();
    });

    await waitFor(() => expect(mockOpen).toHaveBeenCalled());
    expect(getDesktopConnectDialogOpener()).toBeNull();
  });
});
