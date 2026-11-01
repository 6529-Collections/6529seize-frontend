import {
  CANONICAL_FEE_SHARE,
  CC0_SPDX_ID,
  DEFAULT_ROYALTY_RATE,
  SPLITS_DENOMINATOR,
} from "@/lib/stream/constants";
import type { MockStreamEngine } from "@/lib/stream/mock/engine";
import { revert } from "@/lib/stream/mock/engine";
import { artistIdOf, mockAddress, mockHash } from "@/lib/stream/mock/ids";
import type {
  MockArtistState,
  MockStorage,
  MockToken,
  PayeeSpec,
  WorkSpec,
} from "@/lib/stream/mock/state";
import type {
  Address,
  WorkEconomics,
  WorkKey,
  WorkParty,
  WorkVariant,
} from "@/lib/stream/types";
import { workKeyFor } from "@/lib/stream/workKey";

/** Factories the scenarios and the federated factory share. */

interface ArtistSpec {
  readonly label: string;
  readonly displayName: string;
  readonly handle: string;
  readonly bio: string;
}

export function addArtist(
  engine: MockStreamEngine,
  spec: ArtistSpec,
  lastActivity: number
): MockArtistState {
  const authority = mockAddress(`artist:${spec.label}:authority`);
  const artistId = artistIdOf(authority);
  const artist: MockArtistState = {
    artistId,
    displayName: spec.displayName,
    handle: spec.handle,
    bio: spec.bio,
    authority,
    payout: mockAddress(`artist:${spec.label}:payout`),
    restrainedUntil: null,
    lastActivity,
    consolidatedWallets: [mockAddress(`artist:${spec.label}:cold`)],
    federatedContracts: [],
    programs: [],
  };
  engine.state.artists.set(artistId, artist);
  return artist;
}

export function artistOrThrow(
  engine: MockStreamEngine,
  artistId: string
): MockArtistState {
  const artist = engine.state.artists.get(artistId);
  if (!artist) {
    revert("UnknownArtist", { artistId });
  }
  return artist;
}

/** The seller split wallet: one per payee set (the factory's `walletFor` is deterministic). */
function sellerWallet(engine: MockStreamEngine, payees: readonly PayeeSpec[]) {
  const label = payees
    .map((payee) => `${payee.artistId}:${payee.share}`)
    .join(",");
  const address = mockAddress(`split:seller:${label}`);
  if (!engine.state.splitWallets.has(address)) {
    engine.state.splitWallets.set(address, {
      address,
      kind: "seller",
      payees: payees.map((payee) => ({
        artistId: payee.artistId,
        account: artistOrThrow(engine, payee.artistId).payout,
        share: payee.share,
      })),
      received: 0n,
      released: payees.map(() => 0n),
      works: [],
    });
  }
  return address;
}

/** The royalty wallet: the seller split and the network, by the fee share. */
function royaltyWallet(
  engine: MockStreamEngine,
  seller: Address,
  feeShare: number
): Address {
  const address = mockAddress(`split:royalty:${seller}:${feeShare}`);
  if (!engine.state.splitWallets.has(address)) {
    engine.state.splitWallets.set(address, {
      address,
      kind: "royalty",
      payees: [
        {
          artistId: "seller",
          account: seller,
          share: SPLITS_DENOMINATOR - feeShare,
        },
        {
          artistId: "network",
          account: engine.contracts.networkFeeRecipient,
          share: feeShare,
        },
      ],
      received: 0n,
      released: [0n, 0n],
      works: [],
    });
  }
  return address;
}

function economicsFor(
  engine: MockStreamEngine,
  payees: readonly PayeeSpec[],
  feeShare: number
): WorkEconomics {
  const seller = sellerWallet(engine, payees);
  return {
    seller,
    feeRecipient: engine.contracts.networkFeeRecipient,
    feeShare,
    royaltyReceiver: royaltyWallet(engine, seller, feeShare),
    royaltyRate: DEFAULT_ROYALTY_RATE,
  };
}

const DEFAULT_STORAGE: MockStorage = {
  locators: ["ARWEAVE", "IPFS"],
  preferred: 0,
  onChainComplete: false,
  recordOpen: true,
  finalized: false,
};

function partiesOf(engine: MockStreamEngine, spec: WorkSpec): WorkParty[] {
  const ids = [spec.artistId, ...(spec.collaborators ?? [])];
  return ids.map((artistId, index) => {
    const artist = artistOrThrow(engine, artistId);
    return {
      artistId,
      account: artist.authority,
      role: index === 0 ? "ARTIST" : "COLLABORATOR",
      displayName: artist.displayName,
    };
  });
}

function nextSerial(engine: MockStreamEngine, collectionId: number): number {
  let count = 0;
  for (const token of engine.state.tokens.values()) {
    if (token.collection?.id === collectionId && token.standard === "ERC721") {
      count += 1;
    }
  }
  return count + 1;
}

interface TokenPlacement {
  readonly token: Address;
  readonly tokenId: number;
  readonly variant: WorkVariant;
  readonly feeShare: number;
  readonly federatedContract: Address | null;
  readonly mintedAt: number | null;
}

/** Adds a 1/1 (ERC-721) token for a work spec. */
export function addOneOfOne(
  engine: MockStreamEngine,
  spec: WorkSpec,
  placement: TokenPlacement
): MockToken {
  const key = workKeyFor(
    placement.token,
    placement.tokenId,
    engine.contracts.stream
  );
  const payees = spec.payees ?? [
    { artistId: spec.artistId, share: SPLITS_DENOMINATOR },
  ];
  const economics = economicsFor(engine, payees, placement.feeShare);
  const token: MockToken = {
    key,
    variant: placement.variant,
    program: placement.federatedContract === null ? "canonical" : "federated",
    standard: "ERC721",
    token: placement.token,
    tokenId: placement.tokenId,
    kind: spec.kind ?? "ORIGINAL",
    title: spec.title,
    description: spec.description,
    artistId: spec.artistId,
    parties: partiesOf(engine, spec),
    collection: spec.collection
      ? { ...spec.collection, serial: nextSerial(engine, spec.collection.id) }
      : null,
    year: spec.year,
    medium: spec.medium,
    art: { seed: spec.seed, style: spec.style },
    storage: { ...DEFAULT_STORAGE, ...spec.storage },
    licenseSpdxId: spec.license ?? CC0_SPDX_ID,
    seedPolicy: spec.seedPolicy ?? "NONE",
    economics,
    linked: { master: null, edition: null },
    owner: null,
    supply: 1,
    created: true,
    sale: null,
    primarySaleSettled: false,
    burned: false,
    mintedAt: placement.mintedAt,
    packageRoot:
      spec.item?.packageRoot ??
      mockHash(`package:${spec.artistId}:${spec.title}`),
    itemHash: spec.item?.itemHash ?? mockHash(`item:${spec.title}`),
    federatedContract: placement.federatedContract,
  };
  engine.state.tokens.set(key, token);
  engine.splitWallet(economics.seller)?.works.push(key);
  engine.record(key, {
    kind: "minted",
    actor: null,
    source: "IStream.WorkMinted",
    at: placement.mintedAt ?? engine.now(),
  });
  return token;
}

/** A 6529 Stream work: the next global token ID, 75/25. */
export function addStreamWork(
  engine: MockStreamEngine,
  spec: WorkSpec,
  mintedAt: number
): MockToken {
  const tokenId = engine.state.nextStreamTokenId;
  engine.state.nextStreamTokenId += 1;
  const artist = artistOrThrow(engine, spec.artistId);
  if (!artist.programs.includes("canonical")) {
    artist.programs.push("canonical");
  }
  return addOneOfOne(engine, spec, {
    token: engine.contracts.stream,
    tokenId,
    variant: "stream-1of1",
    feeShare: CANONICAL_FEE_SHARE,
    federatedContract: null,
    mintedAt,
  });
}

/**
 * The ERC-1155 edition linked to a master. The edition ID is the master's
 * token ID. `created` stays false until `createEdition` (canonical) runs.
 */
export function addLinkedEdition(
  engine: MockStreamEngine,
  master: MockToken,
  options: {
    readonly token: Address;
    readonly variant: WorkVariant;
    readonly created: boolean;
  }
): MockToken {
  const key: WorkKey = workKeyFor(
    options.token,
    master.tokenId,
    engine.contracts.stream
  );
  const edition: MockToken = {
    ...master,
    key,
    variant: options.variant,
    standard: "ERC1155",
    token: options.token,
    kind: "ORIGINAL",
    linked: { master: master.key, edition: null },
    federatedContract: master.federatedContract === null ? null : options.token,
    owner: null,
    supply: 0,
    created: options.created,
    sale: null,
    primarySaleSettled: false,
    mintedAt: null,
  };
  master.linked.edition = key;
  engine.state.tokens.set(key, edition);
  return edition;
}
