import { englishAuctionAbi, saleStarterAbi, workFactsAbi } from "./abis";
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


/** The contracts' constants, as WorksHashing / SaleKind / EconomicsTypes define them. */
const PACKAGE_ITEM_DOMAIN = keccak256(toBytes("6529WORKS_PACKAGE_ITEM_V1"));
const MEDIA_DOMAIN = keccak256(toBytes("6529WORKS_MEDIA_V1"));
const SALE_KIND_ENGLISH = keccak256(toBytes("ENGLISH_AUCTION"));
const SALE_KIND_UNIFORM = keccak256(toBytes("UNIFORM_AUCTION"));
export const CURRENCY_ETH: Address = "0x0000000000000000000000000000000000000000";
export const ZERO_HASH: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
/** Rates and shares are out of 100,000. */
const RATE_DENOMINATOR = 100_000;

export const ITEM_KIND = { ORIGINAL: 0, EDITION_MASTER: 1 } as const;
const PARTY_ROLE = { ARTIST: 0, COLLABORATOR: 1 } as const;
const FILE_ROLE = { PRIMARY: 0, PREVIEW: 1, AUXILIARY: 2 } as const;
const SEED_POLICY_NONE = 0;

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

interface WorkDraft {
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
        artistId: BigInt(draft.artist),
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

/** Decodes `abi.encode(IIndependentStream.IndependentMint)`. */
export function decodeIndependentMint(
  request: Hex
): { item: PackageItem; media: readonly MediaFile[] } | null {
  try {
    const [mint] = decodeAbiParameters(INDEPENDENT_MINT_PARAMS, request);
    return { item: mint.item, media: mint.media };
  } catch {
    return null;
  }
}

/** How a work was minted: its item and media, and for a curated work its package root and proof. */
export interface StartedWork {
  readonly item: PackageItem;
  readonly media: readonly MediaFile[];
  /** Curated only: the package root and the item's Merkle proof the start carried. */
  readonly packageRoot?: Hex | undefined;
  readonly proof?: readonly Hex[] | undefined;
}

/**
 * Edition `open` data: the item alone for Independent Stream; for 6529 Stream
 * the item with the root and proof of the package it was minted from (a
 * package usually holds several items, so the proof is not empty).
 */
export function encodeEditionOpenData(started: StartedWork, curated: boolean): Hex {
  if (!curated) {
    return encodeAbiParameters([ITEM_PARAM], [started.item]);
  }
  if (!started.packageRoot) throw new Error("curated edition needs its package root");
  return encodeAbiParameters(
    [ITEM_PARAM, { type: "bytes32" }, { type: "bytes32[]" }],
    [started.item, started.packageRoot, started.proof ?? []]
  );
}

function decodeRequest(request: Hex, curated: boolean, media: readonly MediaFile[] | null): StartedWork | null {
  try {
    if (curated) {
      const [mint] = decodeAbiParameters(STREAM_MINT_PARAMS, request);
      return { item: mint.item, media: media ?? [], packageRoot: mint.packageRoot, proof: mint.proof };
    }
    const [mint] = decodeAbiParameters(INDEPENDENT_MINT_PARAMS, request);
    return { item: mint.item, media: mint.media };
  } catch {
    return null;
  }
}

/**
 * Reads how a work was minted out of the calldata of the transaction that
 * started its first sale: EnglishAuction.start / startWithBid, or
 * SaleStarter.start (how the network's keeper starts curated works).
 * Returns null for any other call.
 */
export function itemFromStartCalldata(input: Hex, curated: boolean): StartedWork | null {
  try {
    const direct = decodeFunctionData({ abi: englishAuctionAbi, data: input });
    if (direct.functionName === "start" || direct.functionName === "startWithBid") {
      return decodeRequest(direct.args[1], curated, null);
    }
    return null;
  } catch {
    // Not an EnglishAuction call; try the starter.
  }
  try {
    const viaStarter = decodeFunctionData({ abi: saleStarterAbi, data: input });
    return decodeRequest(viaStarter.args[2], curated, viaStarter.args[3]);
  } catch {
    return null;
  }
}
