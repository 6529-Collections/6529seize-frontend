import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { useAppKitBootstrap } from "@/components/providers/AppKitBootstrapContext";
import WagmiSetup from "@/components/providers/WagmiSetup";
import DesktopProfileStorageGate from "@/components/desktop/DesktopProfileStorageGate";
import { getWalletAddress } from "@/services/auth/auth.utils";
import { DesktopProfileRestoringContext } from "@/contexts/DesktopProfileRecoveryContext";
import {
  hasPersistedWalletSession,
  subscribeToWalletSessionChanges,
} from "@/components/providers/walletSessionGate";
import { resetWalletChunkRecoveryForTests } from "@/components/providers/walletChunkRecovery";
import {
  createAppKitAdapter,
  initializeAppKit,
} from "@/utils/appkit-initialization.utils";

const mockAppKitAdapterManager = jest.fn(() => ({
  cleanup: jest.fn(),
  createAdapterWithCache: jest.fn(),
  shouldRecreateAdapter: jest.fn(),
}));
let mockWalletStackLoadError: Error | null = null;
const mockIsNativePlatform = jest.fn(() => false);
const unsubscribeSessionChanges = jest.fn();

// WagmiSetup provides its own Wagmi context; skip the global test wrapper.
jest.unmock("@testing-library/react");
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
jest.mock("@capacitor/core", () => {
  const actual = jest.requireActual("@capacitor/core");
  return {
    ...actual,
    Capacitor: {
      ...actual.Capacitor,
      isNativePlatform: () => mockIsNativePlatform(),
    },
  };
});
// A throwing export stands in for a wallet-stack chunk that fails to load.
jest.mock("@/components/providers/AppKitAdapterManager", () => ({
  __esModule: true,
  get AppKitAdapterManager() {
    if (mockWalletStackLoadError) {
      throw mockWalletStackLoadError;
    }
    return mockAppKitAdapterManager;
  },
}));
jest.mock("@/utils/appkit-initialization.utils", () => ({
  createAppKitAdapter: jest.fn(),
  initializeAppKit: jest.fn(),
}));
const mockReloadToRetryWalletChunks = jest.fn(() => true);
jest.mock("@/components/providers/walletChunkRecovery", () => ({
  ...jest.requireActual("@/components/providers/walletChunkRecovery"),
  reloadToRetryWalletChunks: () => mockReloadToRetryWalletChunks(),
}));
jest.mock("@/components/providers/walletSessionGate", () => ({
  hasPersistedWalletSession: jest.fn(() => false),
  subscribeToWalletSessionChanges: jest.fn(() => () => undefined),
}));
jest.mock("@/components/providers/createPublicWagmiConfig", () => ({
  createPublicWagmiConfig: () => ({ id: "public" }),
}));
jest.mock("@/components/providers/DeferredWagmiProvider", () => ({
  __esModule: true,
  default: ({
    config,
    reconnectOnMount,
    children,
  }: {
    readonly config: { readonly id: string };
    readonly reconnectOnMount: boolean;
    readonly children: ReactNode;
  }) => (
    <div
      data-testid="wagmi-provider"
      data-config={config.id}
      data-reconnect={String(reconnectOnMount)}
    >
      {children}
    </div>
  ),
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

const walletConfig = {
  id: "wallet",
  chains: [],
  connectors: [],
  _internal: { connectors: { setup: jest.fn(), setState: jest.fn() } },
};

function ConnectProbe() {
  const bootstrap = useAppKitBootstrap();
  return (
    <>
      <output aria-label="Wallet stack status">{bootstrap.status}</output>
      <output aria-label="Terminal error">
        {String(bootstrap.hasTerminalError)}
      </output>
      <button
        type="button"
        onClick={() => {
          bootstrap.waitForReady().catch(() => undefined);
        }}
      >
        Connect
      </button>
    </>
  );
}

const renderWagmiSetup = () =>
  render(
    <WagmiSetup>
      <ConnectProbe />
    </WagmiSetup>
  );

const expectWalletFreeProvider = () => {
  const provider = screen.getByTestId("wagmi-provider");
  expect(provider).toHaveAttribute("data-config", "public");
  expect(provider).toHaveAttribute("data-reconnect", "false");
};

describe("WagmiSetup wallet stack session gate", () => {
  beforeEach(() => {
    Reflect.deleteProperty(
      globalThis,
      Symbol.for("6529.wagmiAppKitFastPathStore")
    );
    jest.clearAllMocks();
    resetWalletChunkRecoveryForTests();
    mockWalletStackLoadError = null;
    mockIsNativePlatform.mockReturnValue(false);
    jest.mocked(hasPersistedWalletSession).mockReturnValue(false);
    jest
      .mocked(subscribeToWalletSessionChanges)
      .mockImplementation(() => unsubscribeSessionChanges);
    jest.mocked(createAppKitAdapter).mockReturnValue(
      // The provider only reads the adapter's Wagmi config.
      { wagmiConfig: walletConfig } as unknown as ReturnType<
        typeof createAppKitAdapter
      >
    );
    jest
      .mocked(initializeAppKit)
      .mockReturnValue({} as ReturnType<typeof initializeAppKit>);
  });

  it("keeps visitors without a session on the wallet-free config", async () => {
    renderWagmiSetup();

    await waitFor(() =>
      expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
        "idle"
      )
    );
    // Give a stray background bootstrap every chance to start.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expectWalletFreeProvider();
    expect(mockAppKitAdapterManager).not.toHaveBeenCalled();
    expect(createAppKitAdapter).not.toHaveBeenCalled();
    expect(initializeAppKit).not.toHaveBeenCalled();
    expect(subscribeToWalletSessionChanges).toHaveBeenCalledTimes(1);
  });

  it("loads the wallet stack on the first connect intent", async () => {
    const user = userEvent.setup();
    renderWagmiSetup();
    await waitFor(() =>
      expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
        "idle"
      )
    );

    await user.click(screen.getByRole("button", { name: "Connect" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
        "ready"
      )
    );
    expect(screen.getByTestId("wagmi-provider")).toHaveAttribute(
      "data-reconnect",
      "true"
    );
    expect(mockAppKitAdapterManager).toHaveBeenCalledTimes(1);
    expect(createAppKitAdapter).toHaveBeenCalledTimes(1);
    expect(initializeAppKit).toHaveBeenCalledTimes(1);
    // The session listener is removed once the stack loads, not renewed.
    expect(subscribeToWalletSessionChanges).toHaveBeenCalledTimes(1);
    expect(unsubscribeSessionChanges).toHaveBeenCalledTimes(1);
  });

  it("restores a stored session without a connect intent", async () => {
    jest.mocked(hasPersistedWalletSession).mockReturnValue(true);
    renderWagmiSetup();

    await waitFor(() =>
      expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
        "ready"
      )
    );
    expect(screen.getByTestId("wagmi-provider")).toHaveAttribute(
      "data-config",
      "wallet"
    );
    expect(subscribeToWalletSessionChanges).not.toHaveBeenCalled();
  });

  it("loads once a session is stored after mount", async () => {
    let notifySessionChange: (() => void) | undefined;
    jest
      .mocked(subscribeToWalletSessionChanges)
      .mockImplementation((onChange) => {
        notifySessionChange = onChange;
        return unsubscribeSessionChanges;
      });
    renderWagmiSetup();
    await waitFor(() =>
      expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
        "idle"
      )
    );

    jest.mocked(hasPersistedWalletSession).mockReturnValue(true);
    act(() => {
      notifySessionChange?.();
    });

    await waitFor(() =>
      expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
        "ready"
      )
    );
    expect(subscribeToWalletSessionChanges).toHaveBeenCalledTimes(1);
    expect(unsubscribeSessionChanges).toHaveBeenCalledTimes(1);
    expect(createAppKitAdapter).toHaveBeenCalledTimes(1);
  });

  it("always loads the wallet stack in the native app", async () => {
    mockIsNativePlatform.mockReturnValue(true);
    renderWagmiSetup();

    await waitFor(() =>
      expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
        "ready"
      )
    );
    expect(createAppKitAdapter).toHaveBeenCalledWith(
      expect.objectContaining({ isCapacitor: true })
    );
    expect(hasPersistedWalletSession).not.toHaveBeenCalled();
  });

  it("always loads the wallet stack in the desktop app", async () => {
    const userAgent = jest
      .spyOn(navigator, "userAgent", "get")
      .mockReturnValue(
        "Mozilla/5.0 (Windows NT 10.0) 6529-core Electron/41.0.0"
      );
    try {
      renderWagmiSetup();

      await waitFor(() =>
        expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
          "ready"
        )
      );
      expect(createAppKitAdapter).toHaveBeenCalledWith(
        expect.objectContaining({ isCapacitor: false })
      );
    } finally {
      userAgent.mockRestore();
    }
  });

  it("always loads the wallet stack in the bridge-based desktop app", async () => {
    Object.defineProperty(window, "api", {
      configurable: true,
      value: { openExternal: jest.fn() },
    });
    Object.defineProperty(window, "nativeAuth", {
      configurable: true,
      value: { sessionLogin: jest.fn() },
    });
    try {
      renderWagmiSetup();

      await waitFor(() =>
        expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
          "ready"
        )
      );
      expect(hasPersistedWalletSession).not.toHaveBeenCalled();
      expect(createAppKitAdapter).toHaveBeenCalledWith(
        expect.objectContaining({ isCapacitor: false })
      );
    } finally {
      Reflect.deleteProperty(window, "api");
      Reflect.deleteProperty(window, "nativeAuth");
    }
  });

  it("waits on the wallet-free config while desktop profiles are restoring", async () => {
    const userAgent = jest
      .spyOn(navigator, "userAgent", "get")
      .mockReturnValue(
        "Mozilla/5.0 (Windows NT 10.0) 6529-core Electron/41.0.0"
      );
    const tree = (restoring: boolean) => (
      <DesktopProfileRestoringContext.Provider value={restoring}>
        <WagmiSetup>
          <ConnectProbe />
        </WagmiSetup>
      </DesktopProfileRestoringContext.Provider>
    );
    try {
      const { rerender } = render(tree(true));
      await waitFor(() =>
        expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
          "ready"
        )
      );
      // The wallet stack is loaded, but nothing can reconnect yet.
      expectWalletFreeProvider();

      rerender(tree(false));

      const provider = screen.getByTestId("wagmi-provider");
      expect(provider).toHaveAttribute("data-config", "wallet");
      expect(provider).toHaveAttribute("data-reconnect", "true");
    } finally {
      userAgent.mockRestore();
    }
  });

  // The bundler keeps rejecting a chunk that failed once in this page, so a
  // later connect intent reloads the page instead of retrying in place.
  it("reloads the page on the next connect intent after a wallet chunk fails", async () => {
    const user = userEvent.setup();
    renderWagmiSetup();
    await waitFor(() =>
      expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
        "idle"
      )
    );

    mockWalletStackLoadError = Object.assign(
      new Error("Failed to load chunk /_next/static/chunks/wallet.js"),
      { name: "ChunkLoadError" }
    );
    await user.click(screen.getByRole("button", { name: "Connect" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
        "error"
      )
    );
    expect(mockReloadToRetryWalletChunks).not.toHaveBeenCalled();

    mockWalletStackLoadError = null;
    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(mockReloadToRetryWalletChunks).toHaveBeenCalledTimes(1);
    expect(createAppKitAdapter).not.toHaveBeenCalled();
  });

  it("retries the wallet stack after a failed load", async () => {
    const user = userEvent.setup();
    renderWagmiSetup();
    await waitFor(() =>
      expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
        "idle"
      )
    );

    mockWalletStackLoadError = new Error("Loading chunk failed");
    await user.click(screen.getByRole("button", { name: "Connect" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
        "error"
      )
    );
    expect(screen.getByLabelText("Terminal error")).toHaveTextContent("false");
    expect(createAppKitAdapter).not.toHaveBeenCalled();
    expectWalletFreeProvider();

    mockWalletStackLoadError = null;
    await user.click(screen.getByRole("button", { name: "Connect" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Wallet stack status")).toHaveTextContent(
        "ready"
      )
    );
    expect(createAppKitAdapter).toHaveBeenCalledTimes(1);
    expect(initializeAppKit).toHaveBeenCalledTimes(1);
  });
  // A route that never signs in (for example /validator/authorize) runs
  // without the restore, so the wallet stack may reconnect there. Moving to a
  // route that signs in must hold it on the wallet-free config from that same
  // render until the restore settles, then hand over again after a remount.
  it("holds reconnect from the first render after moving to a route that restores profiles", async () => {
    const userAgent = jest
      .spyOn(navigator, "userAgent", "get")
      .mockReturnValue(
        "Mozilla/5.0 (Windows NT 10.0) 6529-core Electron/41.0.0"
      );
    const saved = `0x${"5".repeat(40)}`;
    let resolveRestore: (state: unknown) => void = () => undefined;
    const restoreProfiles = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveRestore = resolve;
        })
    );
    Object.defineProperty(window, "api", {
      configurable: true,
      value: { openExternal: jest.fn() },
    });
    Object.defineProperty(window, "nativeAuth", {
      configurable: true,
      value: {
        sessionLogin: jest.fn(),
        restoreProfiles,
        saveProfiles: jest.fn().mockResolvedValue(undefined),
        profilesReady: jest.fn().mockResolvedValue(undefined),
        restartProfileRestore: jest.fn().mockResolvedValue(undefined),
      },
    });
    const tree = (restoring: boolean) => (
      <DesktopProfileStorageGate enabled={restoring}>
        <WagmiSetup>
          <ConnectProbe />
        </WagmiSetup>
      </DesktopProfileStorageGate>
    );
    try {
      const { rerender } = render(tree(false));
      await waitFor(() =>
        expect(screen.getByTestId("wagmi-provider")).toHaveAttribute(
          "data-config",
          "wallet"
        )
      );
      expect(screen.getByTestId("wagmi-provider")).toHaveAttribute(
        "data-reconnect",
        "true"
      );

      // Client-side move to a route that signs in: the restore starts.
      rerender(tree(true));
      expectWalletFreeProvider();
      await waitFor(() => expect(restoreProfiles).toHaveBeenCalled());
      expectWalletFreeProvider();

      // The restore brings other profiles: the tree remounts, then the
      // wallet config is handed over again.
      await act(async () => {
        resolveRestore({
          version: 1,
          accounts: [
            {
              address: saved,
              role: null,
              jwt: null,
              profileId: null,
              profileHandle: null,
              authSessionVersion: "v2",
              refreshToken: null,
            },
          ],
          activeAddress: saved,
        });
      });
      await waitFor(() =>
        expect(screen.getByTestId("wagmi-provider")).toHaveAttribute(
          "data-config",
          "wallet"
        )
      );
      expect(screen.getByTestId("wagmi-provider")).toHaveAttribute(
        "data-reconnect",
        "true"
      );
      // Auth follows the restored profiles in page storage, not the wallet
      // connection made before the restore.
      expect(getWalletAddress()).toBe(saved);
    } finally {
      userAgent.mockRestore();
      Reflect.deleteProperty(window, "api");
      Reflect.deleteProperty(window, "nativeAuth");
    }
  });
});
