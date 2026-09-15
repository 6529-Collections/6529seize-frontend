const mockClient = { readContract: jest.fn() };

jest.mock("viem", () => ({
  createPublicClient: jest.fn(() => mockClient),
  http: jest.fn((url: string, options: unknown) => ({ options, url })),
}));

jest.mock("viem/chains", () => ({ mainnet: { id: 1 } }));

describe("Ethereum mainnet client", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env["ETHEREUM_RPC_URL"] = "https://eth-mainnet.example.test/v2/key";
  });

  it("constructs one client with the configured server-only RPC URL", () => {
    const viem = jest.requireMock("viem") as {
      createPublicClient: jest.Mock;
      http: jest.Mock;
    };
    const { getEthereumMainnetClient } =
      require("@/lib/ethereum/mainnetClient") as {
        getEthereumMainnetClient: () => typeof mockClient;
      };

    expect(getEthereumMainnetClient()).toBe(mockClient);
    expect(getEthereumMainnetClient()).toBe(mockClient);
    expect(viem.http).toHaveBeenCalledTimes(1);
    expect(viem.http).toHaveBeenCalledWith(
      "https://eth-mainnet.example.test/v2/key",
      { retryCount: 0, timeout: 5_000 }
    );
    expect(viem.createPublicClient).toHaveBeenCalledTimes(1);
    expect(viem.createPublicClient).toHaveBeenCalledWith({
      chain: { id: 1 },
      transport: {
        options: { retryCount: 0, timeout: 5_000 },
        url: "https://eth-mainnet.example.test/v2/key",
      },
    });
  });

  it("does not read runtime configuration or construct a client on import", () => {
    delete process.env["ETHEREUM_RPC_URL"];
    const viem = jest.requireMock("viem") as {
      createPublicClient: jest.Mock;
      http: jest.Mock;
    };

    expect(() => require("@/lib/ethereum/mainnetClient")).not.toThrow();
    expect(viem.http).not.toHaveBeenCalled();
    expect(viem.createPublicClient).not.toHaveBeenCalled();
  });
});
