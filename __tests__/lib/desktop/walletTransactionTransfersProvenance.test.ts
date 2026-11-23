import { encodeFunctionData, type Hex, parseAbiItem } from "viem";
import { MAX_TRANSACTION_DATA_BYTES } from "@/lib/desktop/wallet-forwarding";
import {
  checkWalletTransaction,
  WALLET_TRANSACTION_RULES,
} from "@/lib/desktop/wallet-transactions";
import { describeWalletTransaction } from "@/lib/desktop/wallet-transactions/describe";
import {
  formatArweaveId,
  formatCid,
  readPublisherAuthorization,
  type RegistryReader,
} from "@/lib/desktop/wallet-transactions/provenance";
import { canForwardTransfer } from "@/lib/desktop/wallet-transactions/transfers";
import { buildWalletTransactionVectors } from "@/__tests__/fixtures/desktop-wallet-transactions/vectors";

const MEMES = "0x33FD426905F149f8376e227d0C9D3340AaD17aF1";
const GRADIENT = "0x0C58Ef43fF3032005e472cB5709f8908aCb00205";
const REGISTRY = "0x0e289576c7565D29018134517309668946Ffc912";
const SENDER = "0x1111111111111111111111111111111111111111";

const describeVector = (name: string) => {
  const vector = buildWalletTransactionVectors().find(
    (item) => item.name === name
  );
  if (!vector) throw new Error(name);
  const value = BigInt(vector.transaction.value);
  const checked = checkWalletTransaction(
    { ...vector.transaction, value },
    vector.chainId
  );
  if (!checked.ok) throw new Error(`${name} refused`);
  return describeWalletTransaction(checked, vector.transaction.from, value);
};

describe("canForwardTransfer", () => {
  const memes = (tokenId: number) => ({
    contract: MEMES,
    tokenId: String(tokenId),
    erc1155: true,
    quantity: 1,
  });

  it("accepts 6529 NFTs on the listed contracts of the chain", () => {
    expect(
      canForwardTransfer(1, [
        memes(1),
        { contract: GRADIENT, tokenId: "7", erc1155: false, quantity: 1 },
      ])
    ).toBe(true);
  });

  it("refuses another chain, another contract, the wrong standard or nothing", () => {
    expect(canForwardTransfer(11_155_111, [memes(1)])).toBe(false);
    expect(
      canForwardTransfer(1, [
        { contract: "0x1155", tokenId: "1", erc1155: true, quantity: 1 },
      ])
    ).toBe(false);
    expect(
      canForwardTransfer(1, [
        { contract: MEMES, tokenId: "1", erc1155: false, quantity: 1 },
      ])
    ).toBe(false);
    expect(canForwardTransfer(1, [])).toBe(false);
  });

  it("refuses more copies than one entry may move", () => {
    expect(canForwardTransfer(1, [{ ...memes(1), quantity: 10_000 }])).toBe(
      true
    );
    expect(canForwardTransfer(1, [{ ...memes(1), quantity: 10_001 }])).toBe(
      false
    );
  });

  it("refuses a recipient the rules refuse", () => {
    const from = "0x1111111111111111111111111111111111111111";
    const ok = { from, to: "0x2222222222222222222222222222222222222222" };
    expect(canForwardTransfer(1, [memes(1)], ok)).toBe(true);
    for (const to of [
      from.toUpperCase().replace("0X", "0x"),
      "0x0000000000000000000000000000000000000000",
      "0x000000000000000000000000000000000000dEaD",
      MEMES,
    ]) {
      expect(canForwardTransfer(1, [memes(1)], { from, to })).toBe(false);
    }
  });

  it("allows at most 50 different tokens of one ERC-1155 contract", () => {
    const tokens = Array.from({ length: 51 }, (_, index) => memes(index + 1));
    expect(canForwardTransfer(1, tokens.slice(0, 50))).toBe(true);
    expect(canForwardTransfer(1, tokens)).toBe(false);
  });
});

describe("provenance publish size", () => {
  const HASH_REF =
    "(uint16 algorithm,bytes32 digest,bytes32 canonicalizationId)";
  const publish = parseAbiItem(
    `function publish(uint32 releaseId,(bytes32 subjectId,bytes32 recordType,bytes32 schemaId,${HASH_REF} contentHash,uint64 effectiveAt,bytes cid,bytes32 arweaveId,string label,uint32 expectedVersion)[] records)`
  );
  const word = `0x${"11".repeat(32)}` as Hex;
  const largest = {
    subjectId: word,
    recordType: word,
    schemaId: word,
    contentHash: { algorithm: 2, digest: word, canonicalizationId: word },
    effectiveAt: 1n,
    cid: `0x${"ab".repeat(64)}` as Hex,
    arweaveId: word,
    label: "L".repeat(128),
    expectedVersion: 0,
  };
  const bytes = (count: number) =>
    (encodeFunctionData({
      abi: [publish],
      args: [1, Array.from({ length: count }, () => largest)],
    }).length -
      2) /
    2;

  it("fits 15 records of the largest valid size, not 16", () => {
    expect(bytes(15)).toBeLessThanOrEqual(MAX_TRANSACTION_DATA_BYTES);
    expect(bytes(16)).toBeGreaterThan(MAX_TRANSACTION_DATA_BYTES);
  });

  it("caps a publish call at 20 records", () => {
    const rule = WALLET_TRANSACTION_RULES.find(
      (item) => item.id === "provenance.publish"
    )!;
    expect(rule.args[1]!.rule.lenMax).toBe(20);
  });
});

describe("describing transfers and publisher calls", () => {
  it("names the recipient and counts the NFTs a transfer moves", () => {
    const batch = describeVector("nft.batchTransfer1155 Memes accepts");
    expect(batch).toMatchObject({
      contract: "nft",
      risk: "transfer",
      recipient: "0x3333333333333333333333333333333333333333",
      count: 3n,
      effects: [],
    });
    expect(describeVector("nft.transfer721 Gradient accepts").count).toBe(1n);
  });

  it("counts the records of a publish call", () => {
    const description = describeVector(
      "test registry: provenance.publish accepts 15 records of the largest size"
    );
    expect(description).toMatchObject({
      contract: "provenance",
      risk: "normal",
      count: 15n,
      recipient: null,
    });
    const records = description.args[1]!;
    expect(records.components?.map((item) => item.name)).toContain(
      "expectedVersion"
    );
  });
});

describe("provenance helpers", () => {
  it("writes a binary CIDv1 as base32 text and Arweave ids as base64url", () => {
    expect(formatCid(`0x01551220${"00".repeat(32)}`)).toBe(
      "bafkreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );
    expect(formatCid("0x")).toBeNull();
    expect(formatCid("0x1220ab")).toBe("0x1220ab");
    expect(formatArweaveId(`0x${"00".repeat(32)}`)).toBeNull();
    expect(formatArweaveId(`0x${"ff".repeat(32)}`)).toBe(`${"_".repeat(42)}8`);
  });

  it("keeps malformed CID bytes in hex", () => {
    expect(formatCid("0x01")).toBe("0x01");
    expect(formatCid(`0x01551220${"00".repeat(31)}`)).toBe(
      `0x01551220${"00".repeat(31)}`
    );
  });

  it("uses whichever read confirms the sender and fails only when open", async () => {
    const safe = "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68";
    const failing = (answers: Record<string, unknown>): RegistryReader => ({
      readContract: jest.fn(async ({ functionName }) => {
        const answer = answers[functionName];
        if (answer instanceof Error) throw answer;
        return answer;
      }),
    });
    const down = new Error("node down");
    await expect(
      readPublisherAuthorization(
        failing({ owner: down, isPublisher: true }),
        REGISTRY,
        SENDER
      )
    ).resolves.toBe(true);
    await expect(
      readPublisherAuthorization(
        failing({ owner: SENDER, isPublisher: down }),
        REGISTRY,
        SENDER
      )
    ).resolves.toBe(true);
    await expect(
      readPublisherAuthorization(
        failing({ owner: safe, isPublisher: down }),
        REGISTRY,
        SENDER
      )
    ).rejects.toThrow("node down");
  });

  it("allows a publisher key or the owner, nobody else", async () => {
    const reader = (owner: string, publisher: boolean): RegistryReader => ({
      readContract: jest.fn(async ({ functionName }) =>
        functionName === "owner" ? owner : publisher
      ),
    });
    const safe = "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68";
    await expect(
      readPublisherAuthorization(reader(safe, true), REGISTRY, SENDER)
    ).resolves.toBe(true);
    await expect(
      readPublisherAuthorization(
        reader(SENDER.toUpperCase().replace("0X", "0x"), false),
        REGISTRY,
        SENDER
      )
    ).resolves.toBe(true);
    await expect(
      readPublisherAuthorization(reader(safe, false), REGISTRY, SENDER)
    ).resolves.toBe(false);
  });
});
