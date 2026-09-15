import { useEffect, useLayoutEffect, useRef } from "react";
import { act, cleanup, render, waitFor, within } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { mainnet, sepolia } from "viem/chains";
import { createConfig, mock, http, useAccount, useConfig } from "wagmi";
import WagmiSetup from "@/components/providers/WagmiSetup";
import { useAppKitBootstrap } from "@/components/providers/AppKitBootstrapContext";
import { createPublicWagmiConfig } from "@/components/providers/createPublicWagmiConfig";
import {
  createAppKitAdapter,
  initializeAppKit,
} from "@/utils/appkit-initialization.utils";

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
  Capacitor: { isNativePlatform: () => false },
}));
jest.mock("@/components/providers/AppKitAdapterManager", () => ({
  AppKitAdapterManager: jest.fn(() => ({
    createAdapterWithCache: jest.fn(),
    shouldRecreateAdapter: jest.fn(),
    cleanup: jest.fn(),
  })),
}));
jest.mock("@/utils/appkit-initialization.utils", () => ({
  createAppKitAdapter: jest.fn(),
  initializeAppKit: jest.fn(),
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

const walletAddress = "0x0000000000000000000000000000000000000529";

function PublicContent({ onMount }: { readonly onMount?: () => void }) {
  const account = useAccount();
  const config = useConfig();
  useEffect(onMount ?? (() => undefined), [onMount]);
  return (
    <main>
      <h1>Public collection</h1>
      <a href="/the-memes">Explore the collection</a>
      <p>Art and ideas for an open metaverse.</p>
      <output aria-label="Wallet status">{account.status}</output>
      <output aria-label="Connector count">{config.connectors.length}</output>
      <script type="application/ld+json">{'{"@type":"CollectionPage"}'}</script>
    </main>
  );
}

describe("WagmiSetup server rendering", () => {
  beforeEach(() => {
    Reflect.deleteProperty(
      globalThis,
      Symbol.for("6529.wagmiAppKitFastPathStore")
    );
    jest.clearAllMocks();
    jest
      .mocked(initializeAppKit)
      .mockReturnValue({} as ReturnType<typeof initializeAppKit>);
  });

  afterEach(cleanup);

  it("renders content, links, and structured data without creating a wallet adapter", () => {
    const html = renderToString(
      <WagmiSetup>
        <PublicContent />
      </WagmiSetup>
    );

    expect(html).toContain("<h1>Public collection</h1>");
    expect(html).toContain('href="/the-memes"');
    expect(html).toContain("Art and ideas for an open metaverse.");
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain("disconnected");
    expect(createAppKitAdapter).not.toHaveBeenCalled();
    expect(initializeAppKit).not.toHaveBeenCalled();
  });

  it("keeps server HTML mounted through hydration and reconnects using the live config", async () => {
    const liveConfig = createConfig({
      chains: [mainnet],
      connectors: [
        mock({
          accounts: [walletAddress],
          features: { reconnect: true, defaultConnected: true },
        }),
      ],
      transports: { [mainnet.id]: http() },
      multiInjectedProviderDiscovery: false,
      storage: null,
      ssr: false,
    });
    // Keep the wallet's account RPC in memory while exercising real Wagmi
    // provider hydration, authorization, reconnect, and account subscriptions.
    const connector = liveConfig.connectors[0]!;
    jest.spyOn(connector, "getAccounts").mockResolvedValue([walletAddress]);
    const connect = jest.spyOn(connector, "connect").mockResolvedValue({
      accounts: [walletAddress],
      chainId: mainnet.id,
    });
    jest
      .mocked(createAppKitAdapter)
      .mockReturnValue({ wagmiConfig: liveConfig } as unknown as ReturnType<
        typeof createAppKitAdapter
      >);
    const onMount = jest.fn();
    const element = (
      <WagmiSetup>
        <PublicContent onMount={onMount} />
      </WagmiSetup>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(element);
    document.body.appendChild(container);
    const heading = container.querySelector("h1");
    const onRecoverableError = jest.fn();
    let root!: ReturnType<typeof hydrateRoot>;
    try {
      await act(async () => {
        root = hydrateRoot(container, element, { onRecoverableError });
      });
      await waitFor(() => expect(liveConfig.state.status).toBe("connected"));
      expect(container.querySelector("h1")).toBe(heading);
      expect(
        within(container).getByLabelText("Wallet status")
      ).toHaveTextContent(/^connected$/);
      expect(
        within(container).getByLabelText("Connector count")
      ).toHaveTextContent("1");
      expect(onMount).toHaveBeenCalledTimes(1);
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(createAppKitAdapter).toHaveBeenCalledTimes(1);
      expect(connect).toHaveBeenCalledWith(
        expect.objectContaining({ isReconnecting: true })
      );
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });

  it("keeps public content usable when adapter creation fails", () => {
    jest.mocked(createAppKitAdapter).mockImplementation(() => {
      throw new Error("Wallet unavailable");
    });
    const view = render(
      <WagmiSetup>
        <PublicContent />
      </WagmiSetup>
    );
    expect(
      view.getByRole("heading", { name: "Public collection" })
    ).toBeVisible();
    expect(
      view.getByRole("link", { name: "Explore the collection" })
    ).toHaveAttribute("href", "/the-memes");
    expect(view.getByLabelText("Wallet status")).toHaveTextContent(
      "disconnected"
    );
    expect(initializeAppKit).not.toHaveBeenCalled();
  });

  it("accepts connect intent before the adapter mount effect", async () => {
    const liveConfig = createConfig({
      chains: [mainnet],
      transports: { [mainnet.id]: http() },
      multiInjectedProviderDiscovery: false,
      storage: null,
    });
    jest
      .mocked(createAppKitAdapter)
      .mockReturnValue({ wagmiConfig: liveConfig } as unknown as ReturnType<
        typeof createAppKitAdapter
      >);
    const onReady = jest.fn();
    const onError = jest.fn();
    function EarlyConnectIntent() {
      const { waitForReady } = useAppKitBootstrap();
      const started = useRef(false);
      useLayoutEffect(() => {
        if (started.current) return;
        started.current = true;
        void waitForReady().then(onReady, onError);
      }, [waitForReady]);
      return <PublicContent />;
    }
    render(
      <WagmiSetup>
        <EarlyConnectIntent />
      </WagmiSetup>
    );
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    expect(onError).not.toHaveBeenCalled();
    expect(createAppKitAdapter).toHaveBeenCalledTimes(1);
    expect(initializeAppKit).toHaveBeenCalledTimes(1);
  });

  it("isolates fallback configs and disables wallet storage and discovery", async () => {
    const first = createPublicWagmiConfig([mainnet, sepolia]);
    const second = createPublicWagmiConfig([mainnet, sepolia]);
    expect(first).not.toBe(second);
    await first.storage?.setItem("recentConnectorId", "private-wallet");
    expect(await first.storage?.getItem("recentConnectorId")).toBeNull();
    expect(first.connectors).toEqual([]);
    expect(first._internal.mipd).toBeUndefined();
    expect(first._internal.ssr).toBe(true);
    for (const chain of [mainnet, sepolia]) {
      const rpcUrl = first.getClient({ chainId: chain.id }).transport.url;
      if (typeof rpcUrl !== "string") {
        throw new Error("Expected an explicit HTTP transport URL");
      }
      const transportUrl = new URL(rpcUrl);
      expect(transportUrl.origin).toBe("https://rpc.walletconnect.org");
      expect(transportUrl.searchParams.get("chainId")).toBe(
        `eip155:${chain.id}`
      );
      expect(transportUrl.searchParams.has("projectId")).toBe(true);
    }
    first.setState((state) => ({ ...state, chainId: sepolia.id }));
    expect(second.state.chainId).toBe(mainnet.id);
  });
});
