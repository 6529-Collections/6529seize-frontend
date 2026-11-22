import { checkWalletTransaction } from "@/lib/desktop/wallet-transactions";
import { describeWalletTransaction } from "@/lib/desktop/wallet-transactions/describe";
import {
  hasReadablePrice,
  type PriceReader,
  readExpectedMintValue,
} from "@/lib/desktop/wallet-transactions/price";
import { buildWalletTransactionVectors } from "@/__tests__/fixtures/desktop-wallet-transactions/vectors";

const vector = (name: string) => {
  const found = buildWalletTransactionVectors().find(
    (item) => item.name === name
  );
  if (!found) throw new Error(name);
  return found;
};

function describeVector(name: string) {
  const { transaction, chainId } = vector(name);
  const value = BigInt(transaction.value);
  const checked = checkWalletTransaction({ ...transaction, value }, chainId);
  if (!checked.ok) throw new Error(`${name} refused`);
  return describeWalletTransaction(checked, transaction.from, value);
}

describe("describeWalletTransaction", () => {
  it("lists no effects for a normal transaction", () => {
    const description = describeVector("delegation.register accepts");
    expect(description).toMatchObject({
      ruleId: "delegation.register",
      contract: "delegation",
      functionName: "registerDelegationAddress",
      risk: "normal",
      effects: [],
      count: null,
    });
    expect(description.args.map((arg) => arg.name)).toEqual([
      "_collectionAddress",
      "_delegationAddress",
      "_expiryDate",
      "_useCase",
      "_allTokens",
      "_tokenId",
    ]);
  });

  it("names the delegate and use case of a high-impact delegation", () => {
    expect(
      describeVector("delegation.register use case 1 is high impact").effects
    ).toEqual([
      {
        kind: "delegate",
        delegate: "0x2222222222222222222222222222222222222222",
        useCase: "1",
      },
    ]);
  });

  it("names every high-impact delegation in a batch", () => {
    const description = describeVector(
      "delegation.batchRegister accepts consolidation and is high impact"
    );
    expect(description.count).toBe(2n);
    expect(description.effects).toHaveLength(2);
  });

  it("names the delegator a manager acts for", () => {
    expect(
      describeVector("delegation.registerAsManager accepts and is high impact")
        .effects
    ).toContainEqual({
      kind: "onBehalfOf",
      delegator: "0x1111111111111111111111111111111111111111",
    });
  });

  it("names another recipient of a mint and counts the cards", () => {
    const single = describeVector(
      "memes.mint for another wallet is high impact"
    );
    expect(single.count).toBe(1n);
    expect(single.effects).toEqual([
      {
        kind: "recipient",
        recipient: "0x1111111111111111111111111111111111111111",
      },
    ]);
    expect(describeVector("memes.mintBatch public phase accepts").count).toBe(
      3n
    );
    expect(
      describeVector("nextgen.mint as a delegate is high impact").effects
    ).toEqual([
      {
        kind: "mintAsDelegate",
        delegator: "0x1111111111111111111111111111111111111111",
      },
    ]);
  });

  it("flags a large top-up", () => {
    const description = describeVector(
      "subscriptions.topUp above one ether is high impact"
    );
    expect(description.functionName).toBeNull();
    expect(description.effects).toEqual([{ kind: "largeValue" }]);
  });
});

describe("readExpectedMintValue", () => {
  const reader = (values: Record<string, unknown>) => {
    const readContract = jest.fn(
      async ({ functionName }: { functionName: string }) => values[functionName]
    );
    return { readContract } as unknown as PriceReader & {
      readContract: jest.Mock;
    };
  };

  it("is (claim cost + fee) x count for The Memes", async () => {
    const description = describeVector("memes.mintBatch public phase accepts");
    const client = reader({ getClaim: { cost: 40n }, MINT_FEE: 2n });
    expect(hasReadablePrice(description)).toBe(true);
    await expect(readExpectedMintValue(client, description)).resolves.toBe(
      126n
    );
    expect(client.readContract).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: "MINT_FEE" })
    );
  });

  it("uses the allowlist fee when a proof is passed", async () => {
    const description = describeVector("memes.mintBatch allowlist accepts");
    const client = reader({ getClaim: { cost: 40n }, MINT_FEE_MERKLE: 3n });
    await expect(readExpectedMintValue(client, description)).resolves.toBe(86n);
  });

  it("is price x count for NextGen", async () => {
    const description = describeVector("nextgen.mint accepts");
    await expect(
      readExpectedMintValue(reader({ getPrice: 5n }), description)
    ).resolves.toBe(10n);
  });

  it("has no price for other transactions", async () => {
    const description = describeVector("subscriptions.topUp accepts");
    expect(hasReadablePrice(description)).toBe(false);
    await expect(
      readExpectedMintValue(reader({}), description)
    ).resolves.toBeNull();
  });
});
