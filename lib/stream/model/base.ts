/** Primitive, program and deployment types. See `lib/stream/types.ts`. */

export type Address = `0x${string}`;
/** A 32-byte value: hashes, file IDs, entry hashes, package roots. */
export type Hex32 = `0x${string}`;
export type Wei = bigint;
export type UnixSeconds = number;

/**
 * A work's address in the UI and in URLs. A canonical 6529 Stream token is its
 * bare token ID ("12"); any other token is `<contract>-<tokenId>`. See
 * `lib/stream/workKey.ts`.
 */
export type WorkKey = string;

// ---------------------------------------------------------------------------
// Programs, contracts and variants
// ---------------------------------------------------------------------------

/** Curated by the network (6529 Stream, 6529 Stream Editions) or artist-owned. */
export type StreamProgram = "canonical" | "federated";

export type TokenStandard = "ERC721" | "ERC1155";

/**
 * What a token is, as one first-class field. Pages switch on this.
 * - `stream-1of1`: a 6529 Stream ERC-721 work (it may be an edition master).
 * - `stream-edition`: a 6529 Stream Editions ERC-1155 edition of a Stream master.
 * - `federated-721`: a work in a standalone federated ERC-721.
 * - `federated-1155`: an edition in a standalone federated ERC-1155.
 * - `federated-pair-master`: the ERC-721 half of a linked federated pair.
 * - `federated-pair-edition`: the ERC-1155 half of a linked federated pair.
 */
export type WorkVariant =
  | "stream-1of1"
  | "stream-edition"
  | "federated-721"
  | "federated-1155"
  | "federated-pair-master"
  | "federated-pair-edition";

/** `PackageTypes.ItemKind`. */
export type ItemKind = "ORIGINAL" | "EDITION_MASTER";

/** `PackageTypes.SeedPolicy`. */
export type SeedPolicy = "NONE" | "ARTIST" | "VRF";

/** The deployment the data comes from, for the status strip. */
export interface StreamSourceInfo {
  readonly kind: "mock" | "chain";
  readonly chainId: number;
  readonly network: "sepolia" | "mainnet";
  /** The deployment instance, for example "r4". */
  readonly instance: string;
  /** Federated is a v1.1 design with no contracts; always "design" until it ships. */
  readonly federated: "design" | "live";
  readonly contracts: StreamContracts;
}

/** Addresses the UI links to. From the deployment record (`deployments/<chainId>/*.json`). */
export interface StreamContracts {
  readonly stream: Address;
  readonly editions: Address;
  readonly workRecords: Address;
  readonly englishAuction: Address;
  readonly editionAuction: Address;
  readonly economics: Address;
  readonly statementLog: Address;
  readonly artistRegistry: Address;
  readonly packageRegistry: Address;
  readonly museum: Address;
  readonly networkFeeRecipient: Address;
  /** v1.1 only; the mock invents addresses so the UI can be built. */
  readonly federationRegistry: Address | null;
  readonly federationFactory: Address | null;
}
