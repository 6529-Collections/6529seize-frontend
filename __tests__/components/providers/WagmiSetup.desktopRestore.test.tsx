import { act, render, waitFor } from "@testing-library/react";
import { hydrate } from "@wagmi/core";
import DesktopProfileStorageGate from "@/components/desktop/DesktopProfileStorageGate";
import WagmiSetup from "@/components/providers/WagmiSetup";
import {
  getConnectedWalletAccounts,
  getWalletAddress,
  isAuthAddressAuthorized,
} from "@/services/auth/auth.utils";
import {
  createAppKitAdapter,
  initializeAppKit,
} from "@/utils/appkit-initialization.utils";

/*
 * The real DeferredWagmiProvider runs here (unlike the session-gate tests).
 * Only wagmi's own `hydrate` is replaced, so each reconnect it starts can be
 * held and finished later: wagmi's real reconnect needs real connectors and
 * a wallet, which jsdom cannot provide. `liveWallet` stands for the address
 * wagmi would report once that reconnect finishes.
 */
let liveWallet: string | null = null;
const hydrations: { config: string; reconnect: boolean }[] = [];
const pendingReconnects: Array<(address: string) => void> = [];
jest.mock("@wagmi/core", () => ({
  ...jest.requireActual("@wagmi/core"),
  hydrate: jest.fn(
    (config: { id: string }, options: { reconnectOnMount: boolean }) => ({
      onMount: () => {
        // jest.setup wraps every render in its own WagmiProvider; only this
        // test's configs (which have an id) are recorded and held.
        if (!config.id) return Promise.resolve();
        hydrations.push({
          config: config.id,
          reconnect: options.reconnectOnMount,
        });
        if (!options.reconnectOnMount) return Promise.resolve();
        return new Promise<void>((resolve) => {
          pendingReconnects.push((address) => {
            liveWallet = address;
            resolve();
          });
        });
      },
    })
  ),
}));
jest.mock("@capacitor/core", () => {
  const actual = jest.requireActual("@capacitor/core");
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, isNativePlatform: () => false },
  };
});
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: jest.fn() }),
}));
jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({ appWallets: [], migrateAppWallet: jest.fn() }),
}));
jest.mock("@/hooks/useAppWalletPasswordModal", () => ({
  useAppWalletPasswordModal: () => ({
    requestPassword: jest.fn(),
    modal: null,
  }),
}));
jest.mock("@/components/providers/AppKitAdapterManager", () => ({
  __esModule: true,
  AppKitAdapterManager: jest.fn(() => ({
    cleanup: jest.fn(),
    createAdapterWithCache: jest.fn(),
    shouldRecreateAdapter: jest.fn(),
  })),
}));
jest.mock("@/utils/appkit-initialization.utils", () => ({
  createAppKitAdapter: jest.fn(),
  initializeAppKit: jest.fn(),
}));
jest.mock("@/components/providers/walletSessionGate", () => ({
  hasPersistedWalletSession: jest.fn(() => false),
  subscribeToWalletSessionChanges: jest.fn(() => () => undefined),
}));
jest.mock("@/components/providers/createPublicWagmiConfig", () => ({
  createPublicWagmiConfig: () => ({ id: "public" }),
}));
jest.mock("@/utils/error-sanitizer", () => ({
  logErrorSecurely: jest.fn(),
  sanitizeErrorForUser: () => "Wallet unavailable",
}));
jest.mock("@/utils/wallet-validation.utils", () => ({
  validateWalletSafely: jest.fn(),
}));
jest.mock("@/wagmiConfig/wagmiAppWalletConnector", () => ({
  APP_WALLET_CONNECTOR_TYPE: "app-wallet",
  createAppWalletConnector: jest.fn(),
}));

const OLD_WALLET = `0x${"4".repeat(40)}`;
const RESTORED = `0x${"5".repeat(40)}`;
const walletConfig = {
  id: "wallet",
  chains: [],
  connectors: [],
  _internal: { connectors: { setup: jest.fn(), setState: jest.fn() } },
};

describe("WagmiSetup in 6529 Desktop around the profile restore", () => {
  let resolveRestore: (state: unknown) => void = () => undefined;
  let userAgent: jest.SpyInstance;

  beforeEach(() => {
    // Older desktop builds are recognised by their user agent on this branch.
    userAgent = jest
      .spyOn(navigator, "userAgent", "get")
      .mockReturnValue(
        "Mozilla/5.0 (Windows NT 10.0) 6529-core Electron/41.0.0"
      );
    liveWallet = null;
    hydrations.length = 0;
    pendingReconnects.length = 0;
    Reflect.deleteProperty(
      globalThis,
      Symbol.for("6529.wagmiAppKitFastPathStore")
    );
    jest
      .mocked(createAppKitAdapter)
      .mockReturnValue({ wagmiConfig: walletConfig } as unknown as ReturnType<
        typeof createAppKitAdapter
      >);
    jest
      .mocked(initializeAppKit)
      .mockReturnValue({} as ReturnType<typeof initializeAppKit>);
    Object.defineProperty(window, "api", {
      configurable: true,
      value: { openExternal: jest.fn() },
    });
    Object.defineProperty(window, "nativeAuth", {
      configurable: true,
      value: {
        sessionLogin: jest.fn(),
        restoreProfiles: jest.fn(
          () =>
            new Promise((resolve) => {
              resolveRestore = resolve;
            })
        ),
        saveProfiles: jest.fn().mockResolvedValue(undefined),
        profilesReady: jest.fn().mockResolvedValue(undefined),
        restartProfileRestore: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    userAgent.mockRestore();
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
  });

  it("lets a reconnect that finishes after the restore remount change no profile", async () => {
    const tree = (signsIn: boolean) => (
      <DesktopProfileStorageGate enabled={signsIn}>
        <WagmiSetup>
          <span />
        </WagmiSetup>
      </DesktopProfileStorageGate>
    );
    // A route that never signs in (such as /validator/authorize): the
    // wallet config hydrates and starts a reconnect, still pending.
    const { rerender } = render(tree(false));
    await waitFor(() =>
      expect(hydrations).toContainEqual({ config: "wallet", reconnect: true })
    );
    const lateReconnect = pendingReconnects[0];
    expect(lateReconnect).toBeDefined();

    // Client-side move to a route that signs in: no reconnect starts while
    // the restore is pending.
    hydrations.length = 0;
    rerender(tree(true));
    await act(async () => undefined);
    expect(hydrations.filter((call) => call.reconnect)).toEqual([]);

    // The restore brings another profile; the tree remounts and the wallet
    // config hydrates again with reconnect.
    await act(async () => {
      resolveRestore({
        version: 1,
        accounts: [
          {
            address: RESTORED,
            role: null,
            jwt: null,
            profileId: null,
            profileHandle: null,
            authSessionVersion: "v2",
            refreshToken: null,
          },
        ],
        activeAddress: RESTORED,
      });
    });
    await waitFor(() =>
      expect(hydrations).toContainEqual({ config: "wallet", reconnect: true })
    );

    // Only now does the first reconnect finish, with the old wallet.
    await act(async () => {
      lateReconnect?.(OLD_WALLET);
    });

    // Live wallet: the old one. Persisted profiles and the active address:
    // the restored ones, untouched by the late reconnect. Auth for the live
    // wallet is computed against those restored profiles (the provider's
    // hasValidWalletAuth uses this same check), so it is not authorized.
    expect(liveWallet).toBe(OLD_WALLET);
    expect(getWalletAddress()).toBe(RESTORED);
    expect(
      getConnectedWalletAccounts().map((account) => account.address)
    ).toEqual([RESTORED]);
    expect(
      isAuthAddressAuthorized({
        address: OLD_WALLET,
        connectedAccounts: getConnectedWalletAccounts(),
      })
    ).toBe(false);
    expect(hydrate).toHaveBeenCalled();
  });
});
