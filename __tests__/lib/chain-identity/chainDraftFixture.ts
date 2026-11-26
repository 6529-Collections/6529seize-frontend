import type { Hex } from "viem";
import { txHeader, txIdOf, ZERO32 } from "@/lib/chain/codec/envelope";
import { repCategoryId } from "@/lib/chain/codec/ids";
import { RATING_SET } from "@/lib/chain/codec/ops";
import type { ChainDraft } from "@/lib/chain-identity/gateway";

export const NETWORK_ID: Hex = `0x${"ab".repeat(32)}`;
export const RATER: Hex = `0x${"11".repeat(32)}`;
export const TARGET: Hex = `0x${"22".repeat(32)}`;
export const WALLET: Hex = "0x1111111111111111111111111111111111111111";
export const CATEGORY_ID: Hex = repCategoryId("Art");

const FIELDS = (names: readonly [string, string][]) =>
  names.map(([name, type]) => ({ name, type }));

const TYPES = {
  EIP712Domain: FIELDS([
    ["name", "string"],
    ["version", "string"],
    ["salt", "bytes32"],
  ]),
  RatingSet: FIELDS([
    ["header", "TxHeader"],
    ["body", "RatingSetBody"],
  ]),
  TxHeader: FIELDS([
    ["ruleVersion", "uint32"],
    ["principal", "bytes32"],
    ["keyType", "uint8"],
    ["keyId", "bytes32"],
    ["authRef", "bytes32"],
    ["nonceLane", "uint32"],
    ["nonce", "uint64"],
    ["notBefore", "uint64"],
    ["expiresAt", "uint64"],
    ["ethRefNumber", "uint64"],
    ["ethRefHash", "bytes32"],
    ["feeMode", "uint8"],
    ["sponsorRef", "bytes32"],
    ["maxFee", "uint128"],
    ["maxWork", "uint64"],
    ["tipPerRU", "uint128"],
  ]),
  RatingSetBody: FIELDS([
    ["matter", "uint8"],
    ["targetKind", "uint8"],
    ["target", "bytes32"],
    ["category", "bytes32"],
    ["categoryName", "string"],
    ["value", "int64"],
    ["priorVersion", "uint64"],
  ]),
};

/**
 * A RATING_SET draft as the gateway answers it, with its txId computed by
 * the chain codec (lib/chain/codec), an implementation apart from viem's.
 */
export function ratingDraft(
  options: {
    readonly keyType?: 1 | 2;
    readonly keyId?: Hex;
    readonly authRef?: Hex;
    readonly value?: bigint;
    readonly categoryName?: string;
    readonly tipPerRU?: bigint;
  } = {}
): ChainDraft {
  const keyType = options.keyType ?? 1;
  const keyId = options.keyId ?? `0x${"00".repeat(12)}${WALLET.slice(2)}`;
  const authRef = options.authRef ?? ZERO32;
  const value = options.value ?? 5n;
  const categoryName = options.categoryName ?? "Art";
  const tipPerRU = options.tipPerRU ?? 0n;
  const header = txHeader({
    ruleVersion: 6,
    principal: RATER,
    keyType,
    keyId: keyId as Hex,
    authRef,
    nonce: 3n,
    notBefore: 1_764_000_000_000n,
    expiresAt: 1_764_003_600_000n,
    feeMode: 3,
    maxFee: 2_250_000n,
    maxWork: 124_200n,
    tipPerRU,
  });
  const body = {
    matter: 1,
    targetKind: 1,
    target: TARGET,
    category: CATEGORY_ID,
    categoryName,
    value,
    priorVersion: 0n,
  };
  const txId = txIdOf({
    networkId: NETWORK_ID,
    header,
    op: RATING_SET,
    body,
  });
  return {
    txId,
    opType: 0x0701,
    opName: "RATING_SET",
    opVersion: 1,
    typedData: {
      domain: { name: "6529 Network", version: "1", salt: NETWORK_ID },
      primaryType: "RatingSet",
      types: TYPES,
      message: {
        header: {
          ruleVersion: 6,
          principal: RATER,
          keyType,
          keyId,
          authRef,
          nonceLane: 0,
          nonce: "3",
          notBefore: "1764000000000",
          expiresAt: "1764003600000",
          ethRefNumber: "0",
          ethRefHash: ZERO32,
          feeMode: 3,
          sponsorRef: ZERO32,
          maxFee: "2250000",
          maxWork: "124200",
          tipPerRU: tipPerRU.toString(),
        },
        body: {
          matter: 1,
          targetKind: 1,
          target: TARGET,
          category: CATEGORY_ID,
          categoryName,
          value: value.toString(),
          priorVersion: "0",
        },
      },
    },
    unsigned: "0x4001",
    envelope: { networkId: NETWORK_ID, header: {} },
    signatures: [{ role: 0, keyType, signer: keyType === 1 ? WALLET : null }],
    fee: { maxWork: "124200", worst: "1000000", maxFee: "2250000", sizeBytes: 300 },
  };
}
