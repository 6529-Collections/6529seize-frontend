import { createCompoundPlan } from "@/app/api/open-graph/compound/service";

jest.mock("@/app/api/open-graph/compound/client", () => ({
  publicClient: {
    multicall: jest.fn(),
    readContract: jest.fn(),
  },
}));

describe("createCompoundPlan", () => {
  const txHash = `0x${"a".repeat(64)}`;
  const { publicClient } = require("@/app/api/open-graph/compound/client");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a tx plan for the main Etherscan domain", () => {
    const plan = createCompoundPlan(
      new URL(`https://etherscan.io/tx/${txHash}`)
    );

    expect(plan).not.toBeNull();
    expect(plan?.cacheKey).toBe(`compound:tx:${txHash}`);
  });

  it("creates a tx plan for Etherscan subdomains", () => {
    const plan = createCompoundPlan(
      new URL(`https://www.etherscan.io/tx/${txHash}`)
    );

    expect(plan).not.toBeNull();
    expect(plan?.cacheKey).toBe(`compound:tx:${txHash}`);
  });

  it("returns null for hosts that only end with the Etherscan domain text", () => {
    const plan = createCompoundPlan(
      new URL(`https://maliciousetherscan.io/tx/${txHash}`)
    );

    expect(plan).toBeNull();
  });

  it("creates a market plan for the Compound app domain", () => {
    const plan = createCompoundPlan(
      new URL("https://app.compound.finance/markets/usdc")
    );

    expect(plan).not.toBeNull();
    expect(plan?.cacheKey).toBe(
      "compound:market:v2:0x39aa39c021dfbae8fac545936693ac917d5e7563"
    );
  });

  it.each([
    [
      "https://app.compound.finance/markets/usdc",
      "0x39AA39c021dfbaE8faC545936693aC917d5E7563",
    ],
    [
      "https://app.compound.finance/markets/eth",
      "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
    ],
  ])("loads v2 market data for %s", async (url, expectedMarketAddress) => {
    publicClient.multicall.mockResolvedValueOnce([
      8,
      BigInt("200000000000000000000000000"),
      BigInt("1000000"),
      BigInt("10000"),
      BigInt("500000"),
      BigInt("2000000"),
      BigInt("100000000000000000"),
      BigInt("1000000000"),
      BigInt("2000000000"),
    ]);
    publicClient.readContract
      .mockResolvedValueOnce([true, BigInt("750000000000000000"), true])
      .mockResolvedValueOnce("0x0000000000000000000000000000000000000000");

    const result = await createCompoundPlan(new URL(url))?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "compound.market",
        version: "v2",
        market: expect.objectContaining({ cToken: expectedMarketAddress }),
      })
    );
    expect(
      publicClient.multicall.mock.calls[0][0].contracts.map(
        (contract: { readonly functionName: string }) => contract.functionName
      )
    ).toContain("getCash");
  });

  it("loads v3 Comet market data through the Comet price-feed interface", async () => {
    const priceFeedAddress = "0x1111111111111111111111111111111111111111";
    const collateralAddress = "0x2222222222222222222222222222222222222222";
    const collateralPriceFeedAddress =
      "0x3333333333333333333333333333333333333333";
    publicClient.multicall
      .mockResolvedValueOnce([
        6,
        [
          BigInt(1),
          BigInt(1),
          BigInt(1),
          BigInt(1),
          BigInt("1000000"),
          BigInt("500000"),
          BigInt(1),
          0,
        ],
        BigInt("500000000000000000"),
        1,
        priceFeedAddress,
      ])
      .mockResolvedValueOnce([BigInt("1000000000"), BigInt("2000000000")])
      .mockResolvedValueOnce([
        [
          0,
          collateralAddress,
          collateralPriceFeedAddress,
          BigInt("100000000"),
          BigInt("750000000000000000"),
          BigInt("800000000000000000"),
          BigInt("900000000000000000"),
          BigInt("100000000000"),
        ],
      ])
      .mockResolvedValueOnce(["Wrapped Ether", 18]);
    publicClient.readContract
      .mockResolvedValueOnce(BigInt("200000000"))
      .mockResolvedValueOnce(BigInt("100000000"));

    const result = await createCompoundPlan(
      new URL("https://app.compound.finance/comet/usdc")
    )?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "compound.market",
        version: "v3",
        market: expect.objectContaining({
          collaterals: [
            expect.objectContaining({ address: collateralAddress }),
          ],
        }),
      })
    );
    expect(publicClient.multicall.mock.calls[0][0].contracts.at(-1)).toEqual(
      expect.objectContaining({ functionName: "baseTokenPriceFeed" })
    );
    expect(publicClient.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "getPrice",
        args: [priceFeedAddress],
      })
    );
    expect(publicClient.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "getPrice",
        args: [collateralPriceFeedAddress],
      })
    );
  });

  it("returns null for hosts that only end with the Compound app domain text", () => {
    const plan = createCompoundPlan(
      new URL("https://maliciousapp.compound.finance/markets/usdc")
    );

    expect(plan).toBeNull();
  });
});
