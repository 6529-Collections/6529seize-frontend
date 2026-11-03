import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { useAppKitBootstrap } from "@/components/providers/AppKitBootstrapContext";
import WagmiSetup from "@/components/providers/WagmiSetup";
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
jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => mockIsNativePlatform() },
}));
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
});
