import {
  decodeAbiParameters,
  decodeFunctionData,
  encodeAbiParameters,
  keccak256,
  toBytes,
  type AbiParameterToPrimitiveType,
  type Address,
  type Hex,
} from "viem";

import { englishAuctionAbi } from "./generated/EnglishAuction";
import { workFactsAbi } from "./generated/StreamWorkFacts6529";

/** The contracts' constants, as WorksHashing / SaleKind / EconomicsTypes define them. */
export const PACKAGE_ITEM_DOMAIN = keccak256(toBytes("6529WORKS_PACKAGE_ITEM_V1"));
export const MEDIA_DOMAIN = keccak256(toBytes("6529WORKS_MEDIA_V1"));
export const SALE_KIND_ENGLISH = keccak256(toBytes("ENGLISH_AUCTION"));
export const SALE_KIND_UNIFORM = keccak256(toBytes("UNIFORM_AUCTION"));
export const CURRENCY_ETH: Address = "0x0000000000000000000000000000000000000000";
export const ZERO_HASH: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
/** Rates and shares are out of 100,000. */
export const RATE_DENOMINATOR = 100_000;

export const ITEM_KIND = { ORIGINAL: 0, EDITION_MASTER: 1 } as const;
export const PARTY_ROLE = { ARTIST: 0, COLLABORATOR: 1 } as const;
export const FILE_ROLE = { PRIMARY: 0, PREVIEW: 1, AUXILIARY: 2 } as const;
export const SEED_POLICY_NONE = 0;

const openFunction = workFactsAbi.find(
  (entry) => entry.type === "function" && entry.name === "open"
);
if (openFunction?.type !== "function") {
  throw new Error("StreamWorkFacts6529 ABI has no open function");
}
const ITEM_PARAM = openFunction.inputs[2];
const MEDIA_PARAM = openFunction.inputs[3];

export type PackageItem = AbiParameterToPrimitiveType<typeof ITEM_PARAM>;
export type MediaFile = AbiParameterToPrimitiveType<typeof MEDIA_PARAM>[number];

export interface WorkDraft {
  /** The artist (lead party). Its artist ID is its address as a number. */
  readonly artist: Address;
  readonly collectionId: bigint;
  /** SHA-256 of the primary media file. */
  readonly contentHash: Hex;
  readonly primaryFileId: Hex;
  readonly recordFileId: Hex;
  readonly cc0TextFileId: Hex;
  /** Edition terms: undefined for a 1/1 only; maxCount 0 means no cap. */
  readonly edition?: { readonly maxCount: number } | undefined;
}

export function artistIdOf(artist: Address): bigint {
  return BigInt(artist);
}

export function mediaListOf(draft: WorkDraft): MediaFile[] {
  return [
    {
      fileId: draft.primaryFileId,
      sha256Hash: draft.contentHash,
      role: FILE_ROLE.PRIMARY,
    },
  ];
}

export function mediaHashOf(media: readonly MediaFile[]): Hex {
  return keccak256(
    encodeAbiParameters([{ type: "bytes32" }, MEDIA_PARAM], [MEDIA_DOMAIN, media])
  );
}

/** The package item a Stream or Independent Stream work is minted from. */
export function buildItem(draft: WorkDraft): PackageItem {
  const media = mediaListOf(draft);
  return {
    kind: draft.edition ? ITEM_KIND.EDITION_MASTER : ITEM_KIND.ORIGINAL,
    collectionId: draft.collectionId,
    contentHash: draft.contentHash,
    mediaHash: mediaHashOf(media),
    recordFileId: draft.recordFileId,
    parties: [{ account: draft.artist, role: PARTY_ROLE.ARTIST }],
    payees: [
      {
        artistId: artistIdOf(draft.artist),
        account: CURRENCY_ETH,
        share: RATE_DENOMINATOR,
      },
    ],
    license: { spdxId: "CC0-1.0", textFileId: draft.cc0TextFileId },
    seedPolicy: SEED_POLICY_NONE,
    seed: ZERO_HASH,
    sale: { saleKind: SALE_KIND_ENGLISH, currency: CURRENCY_ETH, params: "0x" },
    edition: draft.edition
      ? {
          maxCount: draft.edition.maxCount,
          currency: CURRENCY_ETH,
          saleKind: SALE_KIND_UNIFORM,
          params: "0x",
        }
      : { maxCount: 0, currency: CURRENCY_ETH, saleKind: ZERO_HASH, params: "0x" },
  };
}

/** `WorksHashing.itemHash`. */
export function itemHashOf(item: PackageItem): Hex {
  return keccak256(
    encodeAbiParameters([{ type: "bytes32" }, ITEM_PARAM], [PACKAGE_ITEM_DOMAIN, item])
  );
}

/** The Merkle leaf of an item; a one-item package's root is its leaf. */
export function leafOf(itemHash: Hex): Hex {
  return keccak256(itemHash);
}

const INDEPENDENT_MINT_PARAMS = [
  {
    type: "tuple",
    components: [
      ITEM_PARAM,
      { ...MEDIA_PARAM, name: "media" },
      { name: "consents", type: "bytes[]" },
    ],
  },
] as const;

/** `abi.encode(IIndependentStream.IndependentMint)`: the request an Independent Stream start sends. */
export function encodeIndependentMint(item: PackageItem, media: readonly MediaFile[]): Hex {
  return encodeAbiParameters(INDEPENDENT_MINT_PARAMS, [
    { item, media, consents: [] },
  ]);
}

const STREAM_MINT_PARAMS = [
  {
    type: "tuple",
    components: [
      { name: "packageRoot", type: "bytes32" },
      ITEM_PARAM,
      { name: "proof", type: "bytes32[]" },
      {
        name: "move",
        type: "tuple",
        components: [
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint64" },
          { name: "signature", type: "bytes" },
        ],
      },
    ],
  },
] as const;

/** `abi.encode(StreamMintRequest)` for a one-item package (empty proof). */
export function encodeStreamMint(args: {
  readonly item: PackageItem;
  readonly nonce: bigint;
  readonly deadline: bigint;
  /** `abi.encodePacked(wallet, signature)`. */
  readonly moveProof: Hex;
}): Hex {
  return encodeAbiParameters(STREAM_MINT_PARAMS, [
    {
      packageRoot: leafOf(itemHashOf(args.item)),
      item: args.item,
      proof: [],
      move: {
        nonce: args.nonce,
        deadline: args.deadline,
        signature: args.moveProof,
      },
    },
  ]);
}

/** Edition `open` data: the item alone for Independent Stream, item + root + proof for 6529 Stream. */
export function encodeEditionOpenData(item: PackageItem, curated: boolean): Hex {
  if (!curated) {
    return encodeAbiParameters([ITEM_PARAM], [item]);
  }
  return encodeAbiParameters(
    [ITEM_PARAM, { type: "bytes32" }, { type: "bytes32[]" }],
    [item, leafOf(itemHashOf(item)), []]
  );
}

/**
 * Reads the item back out of the calldata of the transaction that started a
 * work's first sale (EnglishAuction.start / startWithBid), so anyone can open
 * the edition sale beside it. Returns null for any other call.
 */
export function itemFromStartCalldata(
  input: Hex,
  curated: boolean
): { item: PackageItem; media: readonly MediaFile[] } | null {
  let decoded;
  try {
    decoded = decodeFunctionData({ abi: englishAuctionAbi, data: input });
  } catch {
    return null;
  }
  if (decoded.functionName !== "start" && decoded.functionName !== "startWithBid") {
    return null;
  }
  const request = decoded.args[1];
  try {
    if (curated) {
      const [mint] = decodeAbiParameters(STREAM_MINT_PARAMS, request);
      return { item: mint.item, media: [] };
    }
    const [mint] = decodeAbiParameters(INDEPENDENT_MINT_PARAMS, request);
    return { item: mint.item, media: mint.media };
  } catch {
    return null;
  }
}
