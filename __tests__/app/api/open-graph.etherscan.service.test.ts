import { createEtherscanPlan } from "@/app/api/open-graph/etherscan/service";
import { createPublicClient, custom } from "viem";
import { mainnet } from "viem/chains";

jest.mock("@/app/api/open-graph/etherscan/networkRegistry", () => ({
  getEtherscanEnsClient: jest.fn(),
  getEtherscanPublicClient: jest.fn(),
}));

describe("createEtherscanPlan", () => {
  const HASH = `0x${"a".repeat(64)}`;
  const FROM = "0x0000000000000000000000000000000000000001";
  const TO = "0x0000000000000000000000000000000000000002";
  const registry = jest.requireMock(
    "@/app/api/open-graph/etherscan/networkRegistry"
  ) as {
    getEtherscanEnsClient: jest.Mock;
    getEtherscanPublicClient: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    registry.getEtherscanEnsClient.mockReturnValue(null);
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

  it("preserves pending transaction status without a block number", async () => {
    const client = {
      getTransaction: jest.fn().mockResolvedValue({
        hash: HASH,
        from: FROM,
        to: TO,
        value: 0n,
        input: "0x12345678",
        blockNumber: null,
      }),
      getTransactionReceipt: jest
        .fn()
        .mockRejectedValue(new Error("receipt not available")),
      getBlockNumber: jest.fn().mockResolvedValue(105n),
      getBlock: jest.fn().mockResolvedValue({ number: 102n }),
    };
    registry.getEtherscanPublicClient.mockReturnValue(client);

    const result = await createEtherscanPlan(
      new URL(`https://etherscan.io/tx/${HASH}`)
    )?.execute();

    expect(result).toEqual(
      expect.objectContaining({
        ttl: 10_000,
        data: expect.objectContaining({
          type: "etherscan.transaction",
          completeness: "partial",
          transaction: expect.objectContaining({
            hash: HASH,
            status: "pending",
            blockNumber: undefined,
            confirmations: undefined,
            finalized: undefined,
          }),
        }),
      })
    );
    expect(client.getBlock).toHaveBeenCalledTimes(1);
    expect(client.getBlock).toHaveBeenCalledWith({ blockTag: "finalized" });
  });

  it("uses a short TTL when a current-network RPC client is unavailable", async () => {
    registry.getEtherscanPublicClient.mockReturnValue(null);

    const result = await createEtherscanPlan(
      new URL(`https://sepolia.etherscan.io/tx/${HASH}`)
    )?.execute();

    expect(result).toEqual(
      expect.objectContaining({
        ttl: 30_000,
        data: expect.objectContaining({
          completeness: "partial",
          cache: expect.objectContaining({ maxAgeSeconds: 30 }),
        }),
      })
    );
  });

  it("isolates ENS resolution from the entity RPC client", async () => {
    const entityClient = {
      getBalance: jest.fn().mockResolvedValue(1_000_000_000_000_000_000n),
      getCode: jest.fn().mockResolvedValue(undefined),
      getBlockNumber: jest.fn().mockResolvedValue(105n),
    };
    const ensClient = {
      getEnsAddress: jest.fn().mockResolvedValue(FROM),
    };
    registry.getEtherscanPublicClient.mockReturnValue(entityClient);
    registry.getEtherscanEnsClient.mockReturnValue(ensClient);

    const result = await createEtherscanPlan(
      new URL("https://etherscan.io/address/vitalik.eth")
    )?.execute();

    expect(ensClient.getEnsAddress).toHaveBeenCalledWith({
      name: "vitalik.eth",
    });
    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "etherscan.address",
        completeness: "complete",
        address: expect.objectContaining({
          input: "vitalik.eth",
          address: FROM,
          subtype: "eoa",
          balanceEth: "1",
        }),
      })
    );
  });

  it.each([
    ["empty code", "0x", "eoa", "complete", undefined],
    ["contract code", "0x6000", "contract", "complete", undefined],
    [
      "delegation code",
      `0xef0100${TO.slice(2)}`,
      "delegated-eoa",
      "complete",
      TO,
    ],
    ["failed code lookup", null, "unknown", "partial", undefined],
  ])(
    "classifies addresses with %s through Viem",
    async (_label, code, subtype, completeness, delegationTarget) => {
      const request = jest.fn(
        async ({ method }: { readonly method: string }) => {
          switch (method) {
            case "eth_getCode":
              if (code === null) {
                throw new Error("RPC offline");
              }
              return code;
            case "eth_getBalance":
              return "0xde0b6b3a7640000";
            case "eth_blockNumber":
              return "0x69";
            default:
              throw new Error(`Unexpected RPC method: ${method}`);
          }
        }
      );
      registry.getEtherscanPublicClient.mockReturnValue(
        createPublicClient({
          chain: mainnet,
          transport: custom({ request }, { retryCount: 0 }),
        })
      );

      const result = await createEtherscanPlan(
        new URL(`https://etherscan.io/address/${FROM}`)
      )?.execute();

      expect(result?.data).toEqual(
        expect.objectContaining({
          type: "etherscan.address",
          completeness,
          address: expect.objectContaining({
            address: FROM,
            subtype,
            delegationTarget,
            balanceEth: "1",
            blockNumber: "105",
          }),
        })
      );
      expect(request).toHaveBeenCalledWith(
        { method: "eth_getCode", params: [FROM, "latest"] },
        undefined
      );
    }
  );

  it("uses canonical decimal NFT IDs for ownership reads and display", async () => {
    const client = {
      readContract: jest.fn(
        ({
          functionName,
          args,
        }: {
          readonly functionName: string;
          readonly args?: readonly unknown[] | undefined;
        }) => {
          switch (functionName) {
            case "name":
              return Promise.resolve("Example NFT");
            case "symbol":
              return Promise.resolve("ENFT");
            case "decimals":
              return Promise.reject(new Error("not ERC-20"));
            case "totalSupply":
              return Promise.resolve(100n);
            case "supportsInterface":
              return Promise.resolve(args?.[0] === "0x80ac58cd");
            case "ownerOf":
              return Promise.resolve(TO);
            default:
              return Promise.reject(new Error("unexpected call"));
          }
        }
      ),
    };
    registry.getEtherscanPublicClient.mockReturnValue(client);

    const result = await createEtherscanPlan(
      new URL(`https://etherscan.io/nft/${FROM}/0x2a`)
    )?.execute();

    expect(client.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "ownerOf",
        args: [42n],
      })
    );
    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "etherscan.nft",
        nft: expect.objectContaining({
          contract: FROM,
          tokenId: "42",
          standard: "erc721",
          owner: TO,
        }),
      })
    );
  });

  it("returns route-aware legacy cards without live RPC reads", async () => {
    registry.getEtherscanPublicClient.mockReturnValue(null);

    const result = await createEtherscanPlan(
      new URL(`https://goerli.etherscan.io/address/${FROM}`)
    )?.execute();

    expect(result).toEqual(
      expect.objectContaining({
        ttl: 86_400_000,
        data: expect.objectContaining({
          provider: "etherscan",
          type: "etherscan.address",
          completeness: "route-only",
          network: expect.objectContaining({
            key: "goerli",
            status: "legacy",
          }),
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
