import { createEtherscanPlan } from "@/app/api/open-graph/etherscan/service";

jest.mock("@/app/api/open-graph/etherscan/networkRegistry", () => ({
  getEtherscanPublicClient: jest.fn(),
}));

describe("createEtherscanPlan", () => {
  const HASH = `0x${"a".repeat(64)}`;
  const FROM = "0x0000000000000000000000000000000000000001";
  const TO = "0x0000000000000000000000000000000000000002";
  const registry = jest.requireMock(
    "@/app/api/open-graph/etherscan/networkRegistry"
  ) as {
    getEtherscanPublicClient: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns route-only cards without selecting or calling an RPC client", async () => {
    const plan = createEtherscanPlan(
      new URL("https://etherscan.io/gastracker")
    );

    const result = await plan?.execute();

    expect(registry.getEtherscanPublicClient).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ttl: 86_400_000,
        data: expect.objectContaining({
          provider: "etherscan",
          type: "etherscan.analytics",
          completeness: "route-only",
          page: expect.objectContaining({
            titleKey: "linkPreview.etherscan.page.gasTracker",
          }),
        }),
      })
    );
  });

  it("builds a transaction summary from bounded RPC reads", async () => {
    const client = {
      getTransaction: jest.fn().mockResolvedValue({
        hash: HASH,
        from: FROM,
        to: TO,
        value: 1_000_000_000_000_000_000n,
        input: "0x",
        blockNumber: 100n,
      }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: "success",
        blockNumber: 100n,
        gasUsed: 21_000n,
        effectiveGasPrice: 100_000_000_000n,
        contractAddress: null,
        logs: [],
      }),
      getBlockNumber: jest.fn().mockResolvedValue(105n),
      getBlock: jest.fn(
        ({ blockTag }: { readonly blockTag?: string | undefined }) =>
          Promise.resolve(
            blockTag === "finalized"
              ? { number: 102n }
              : { number: 100n, timestamp: 1_700_000_000n }
          )
      ),
    };
    registry.getEtherscanPublicClient.mockReturnValue(client);

    const result = await createEtherscanPlan(
      new URL(`https://etherscan.io/tx/${HASH}`)
    )?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        provider: "etherscan",
        type: "etherscan.transaction",
        completeness: "complete",
        transaction: expect.objectContaining({
          hash: HASH,
          status: "success",
          action: "native-transfer",
          from: FROM,
          to: TO,
          valueEth: "1",
          confirmations: "6",
          finalized: true,
          feeEth: "0.0021",
        }),
      })
    );
    expect(client.getTransaction).toHaveBeenCalledTimes(1);
    expect(client.getTransactionReceipt).toHaveBeenCalledTimes(1);
    expect(client.getBlock).toHaveBeenCalledTimes(2);
  });

  it("degrades entity failures to a useful partial card", async () => {
    registry.getEtherscanPublicClient.mockReturnValue({
      getTransaction: jest.fn().mockRejectedValue(new Error("RPC offline")),
    });

    const result = await createEtherscanPlan(
      new URL(`https://sepolia.etherscan.io/tx/${HASH}`)
    )?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        provider: "etherscan",
        type: "etherscan.transaction",
        completeness: "partial",
        transaction: expect.objectContaining({
          hash: HASH,
          status: "unknown",
          action: "ethereum-transaction",
        }),
      })
    );
  });

  it("returns route-aware legacy cards without live RPC reads", async () => {
    registry.getEtherscanPublicClient.mockReturnValue(null);

    const result = await createEtherscanPlan(
      new URL(`https://goerli.etherscan.io/address/${FROM}`)
    )?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        provider: "etherscan",
        type: "etherscan.address",
        completeness: "route-only",
        network: expect.objectContaining({
          key: "goerli",
          status: "legacy",
        }),
      })
    );
  });

  it("returns null for non-Etherscan and unapproved lookalike hosts", () => {
    expect(
      createEtherscanPlan(new URL(`https://foo.etherscan.io/tx/${HASH}`))
    ).toBeNull();
    expect(
      createEtherscanPlan(new URL(`https://example.com/tx/${HASH}`))
    ).toBeNull();
  });
});
