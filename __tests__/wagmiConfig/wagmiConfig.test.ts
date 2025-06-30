import { getWagmiConfig } from "@/wagmiConfig/wagmiConfig";
import { mainnet, sepolia, goerli } from "viem/chains";

jest.mock("@/wagmiConfig/wagmiConfigWeb", () => ({
  wagmiConfigWeb: jest.fn(() => "web-config"),
}));

jest.mock("@/wagmiConfig/wagmiConfigCapacitor", () => ({
  wagmiConfigCapacitor: jest.fn(() => "cap-config"),
}));

jest.mock("@/constants", () => ({
  DELEGATION_CONTRACT: { chain_id: 1, contract: "0x0" },
  SUBSCRIPTIONS_CHAIN: { id: 1 },
  MANIFOLD_NETWORK: { id: 1 },
}));

jest.mock("@/components/nextGen/nextgen_contracts", () => ({
  NEXTGEN_CHAIN_ID: 1,
}));

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
  },
}));

const { wagmiConfigWeb } = require("@/wagmiConfig/wagmiConfigWeb");
const { wagmiConfigCapacitor } = require("@/wagmiConfig/wagmiConfigCapacitor");
const { Capacitor } = require("@capacitor/core");

describe("getWagmiConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns web config when not running on capacitor", () => {
    Capacitor.isNativePlatform.mockReturnValue(false);

    const result = getWagmiConfig();

    expect(wagmiConfigWeb).toHaveBeenCalledWith(
      expect.any(Array),
      expect.anything()
    );
    expect(wagmiConfigCapacitor).not.toHaveBeenCalled();

    expect(result.config).toBe("web-config");
    expect(result.chains).toEqual([mainnet]);
  });

  it("returns capacitor config when running on capacitor", () => {
    Capacitor.isNativePlatform.mockReturnValue(true);

    const result = getWagmiConfig();

    expect(wagmiConfigCapacitor).toHaveBeenCalledWith(
      expect.any(Array),
      expect.anything()
    );
    expect(wagmiConfigWeb).not.toHaveBeenCalled();

    expect(result.config).toBe("cap-config");
    expect(result.chains).toEqual([mainnet]);
  });
});

describe("getChains", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("returns mainnet by default", () => {
    const { getChains } = require("@/wagmiConfig/wagmiConfig");
    const result = getChains();
    expect(result).toEqual([mainnet]);
  });

  it("includes sepolia when constants match sepolia", () => {
    jest.doMock("@/constants", () => ({
      DELEGATION_CONTRACT: { chain_id: sepolia.id, contract: "0x0" },
      SUBSCRIPTIONS_CHAIN: { id: sepolia.id },
      MANIFOLD_NETWORK: { id: sepolia.id },
    }));

    jest.doMock("@/components/nextGen/nextgen_contracts", () => ({
      NEXTGEN_CHAIN_ID: sepolia.id,
    }));

    const { getChains } = require("@/wagmiConfig/wagmiConfig");
    const result = getChains();

    expect(result).toEqual([mainnet, sepolia]);
  });

  it("includes goerli when constants match goerli", () => {
    jest.doMock("@/constants", () => ({
      DELEGATION_CONTRACT: { chain_id: goerli.id, contract: "0x0" },
      SUBSCRIPTIONS_CHAIN: { id: goerli.id },
      MANIFOLD_NETWORK: { id: 1 }, // keep some ids default
    }));

    jest.doMock("@/components/nextGen/nextgen_contracts", () => ({
      NEXTGEN_CHAIN_ID: goerli.id,
    }));

    const { getChains } = require("@/wagmiConfig/wagmiConfig");
    const result = getChains();

    expect(result).toEqual([mainnet, goerli]);
  });
});
