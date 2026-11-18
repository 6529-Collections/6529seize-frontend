import {
  createAppKitAdapter,
  initializeAppKit,
} from "@/utils/appkit-initialization.utils";
import { createAppKit } from "@reown/appkit/react";
import { mainnet } from "viem/chains";
import type { AppKitAdapterManager } from "@/components/providers/AppKitAdapterManager";
import type { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

const COINBASE_WALLET_ID =
  "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa";

jest.mock("@reown/appkit/react", () => ({
  createAppKit: jest.fn(() => ({
    ready: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock("@/constants/constants", () => ({
  CW_PROJECT_ID: "12345678-1234-1234-1234-123456789abc",
}));

jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://6529.io",
    NODE_ENV: "test",
  },
}));

jest.mock("@/utils/error-sanitizer", () => ({
  isIndexedDBError: jest.fn(() => false),
  logErrorSecurely: jest.fn(),
}));

describe("AppKit initialization", () => {
  const adapter = {
    wagmiConfig: { id: "wagmi-config" },
  } as unknown as WagmiAdapter;
  let adapterManager: jest.Mocked<
    Pick<AppKitAdapterManager, "createAdapterWithCache">
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    adapterManager = {
      createAdapterWithCache: jest.fn(() => adapter),
    };
  });

  it("creates the Wagmi adapter independently of AppKit", () => {
    const result = createAppKitAdapter({
      wallets: [],
      adapterManager: adapterManager as unknown as AppKitAdapterManager,
      isCapacitor: true,
      chains: [mainnet],
    });

    expect(result).toBe(adapter);
    expect(adapterManager.createAdapterWithCache).toHaveBeenCalledWith(
      [],
      true,
      [mainnet]
    );
    expect(createAppKit).not.toHaveBeenCalled();
  });

  it("removes Coinbase connection choices on Capacitor", () => {
    initializeAppKit({
      adapter,
      isCapacitor: true,
      chains: [mainnet],
    });

    expect(createAppKit).toHaveBeenCalledWith(
      expect.objectContaining({
        enableCoinbase: false,
        excludeWalletIds: [COINBASE_WALLET_ID],
      })
    );
  });

  it("keeps AppKit's default Coinbase connector enabled outside Capacitor", () => {
    initializeAppKit({
      adapter,
      isCapacitor: false,
      chains: [mainnet],
    });

    expect(createAppKit).toHaveBeenCalledWith(
      expect.objectContaining({
        enableCoinbase: true,
      })
    );
    expect(createAppKit).toHaveBeenCalledWith(
      expect.not.objectContaining({
        excludeWalletIds: expect.anything(),
      })
    );
  });

  it("keeps the web wallet list outside 6529 Desktop", () => {
    initializeAppKit({ adapter, isCapacitor: false, chains: [mainnet] });

    expect(createAppKit).toHaveBeenCalledWith(
      expect.objectContaining({
        featuredWalletIds: ["metamask", "walletConnect"],
        allWallets: "SHOW",
      })
    );
    expect(createAppKit).toHaveBeenCalledWith(
      expect.not.objectContaining({ enableEIP6963: false })
    );
  });

  it("offers WalletConnect only inside 6529 Desktop", () => {
    Object.defineProperty(window, "api", {
      configurable: true,
      value: { openExternal: jest.fn() },
    });
    Object.defineProperty(window, "nativeAuth", {
      configurable: true,
      value: { sessionLogin: jest.fn() },
    });
    try {
      initializeAppKit({ adapter, isCapacitor: false, chains: [mainnet] });

      expect(createAppKit).toHaveBeenCalledWith(
        expect.objectContaining({
          enableCoinbase: false,
          enableEIP6963: false,
          enableInjected: false,
          featuredWalletIds: [],
          allWallets: "HIDE",
        })
      );
    } finally {
      Reflect.deleteProperty(window, "api");
      Reflect.deleteProperty(window, "nativeAuth");
    }
  });

  it.each([true, false])(
    "turns off Reown modal analytics (Capacitor: %s)",
    (isCapacitor) => {
      initializeAppKit({
        adapter,
        isCapacitor,
        chains: [mainnet],
      });

      expect(createAppKit).toHaveBeenCalledWith(
        expect.objectContaining({
          enableCoinbase: !isCapacitor,
          features: {
            analytics: false,
            email: false,
            socials: [],
            onramp: false,
            swaps: false,
            connectMethodsOrder: ["wallet"],
            walletFeaturesOrder: ["send"],
          },
        })
      );
    }
  );

  // AppKit 1.8.19 reuses an existing `baseAccount` connector instead of adding
  // its own telemetry-on copy, and still sends INITIALIZE, CONNECT_SUCCESS and
  // wallet-list impressions to Reown with analytics off. Both were verified
  // against this exact version (see the cookie consent feature doc). Re-check
  // them in a production build before changing this pin.
  it("pins the AppKit version whose connector reuse and telemetry were verified", () => {
    const { dependencies } = jest.requireActual<{
      dependencies: Record<string, string>;
    }>("../../package.json");

    expect(dependencies["@reown/appkit"]).toBe("1.8.19");
    expect(dependencies["@reown/appkit-adapter-wagmi"]).toBe("1.8.19");
  });

  it("keeps AppKit above app-owned transaction modals", () => {
    initializeAppKit({
      adapter,
      isCapacitor: false,
      chains: [mainnet],
    });

    expect(createAppKit).toHaveBeenCalledWith(
      expect.objectContaining({
        themeVariables: expect.objectContaining({
          "--w3m-z-index": 10000,
        }),
      })
    );
  });
});
