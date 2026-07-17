import {
  createAppKitAdapter,
  initializeAppKit,
} from "@/utils/appkit-initialization.utils";
import { createAppKit } from "@reown/appkit/react";
import { mainnet } from "viem/chains";
import type { AppKitAdapterManager } from "@/components/providers/AppKitAdapterManager";
import type { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

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

  it("disables AppKit's default Coinbase connector on Capacitor", () => {
    initializeAppKit({
      adapter,
      isCapacitor: true,
      chains: [mainnet],
    });

    expect(createAppKit).toHaveBeenCalledWith(
      expect.objectContaining({
        enableCoinbase: false,
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
