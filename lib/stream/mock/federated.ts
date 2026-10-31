import {
  FEDERATED_FEE_SHARE,
  SPLITS_DENOMINATOR,
  STANDALONE_EDITION_DURATION,
} from "@/lib/stream/constants";
import type { FederatedDeployResult } from "@/lib/stream/dataSource";
import type { ArtStyle } from "@/lib/stream/mock/art";
import { type MockStreamEngine, revert } from "@/lib/stream/mock/engine";
import { artistIdOf, mockAddress, mockHash } from "@/lib/stream/mock/ids";
import {
  openPreparedAuction,
  prepareEditionAuction,
} from "@/lib/stream/mock/sales/editionAuction";
import { startEnglishAuction } from "@/lib/stream/mock/sales/englishAuction";
import type { MockFederatedState, MockToken } from "@/lib/stream/mock/state";
import {
  addLinkedEdition,
  addOneOfOne,
  artistOrThrow,
} from "@/lib/stream/mock/tokens";
import { artistIdForAccount } from "@/lib/stream/mock/accounts";
import type {
  Address,
  FederatedContract,
  FederatedDeployRequest,
  FederatedDirectoryQuery,
  KnownSaleKind,
  StatementView,
  TokenStandard,
  WorkKey,
} from "@/lib/stream/types";

/**
 * 6529 Stream Federated (v1.1 design, ADR 0001 section 16): the factory, the
 * registry and minting through the shared adapters. There are no contracts
 * yet; this follows `IFederationRegistry` and the ADR.
 */

const FEDERATED_TEMPLATE_VERSION = 1;

const SALE_KINDS_BY_STANDARD: Readonly<
  Record<TokenStandard, readonly KnownSaleKind[]>
> = {
  ERC721: ["ENGLISH_AUCTION"],
  ERC1155: ["UNIFORM_AUCTION"],
};

const STYLES: readonly ArtStyle[] = [
  "orbits",
  "bands",
  "grid",
  "field",
  "canvas",
];

/** The deploy signature creates an artist identity when the deployer has none. */
function ensureArtist(engine: MockStreamEngine, from: Address): string {
  const existing = artistIdForAccount(engine, from);
  if (existing !== null) {
    return existing;
  }
  const artistId = artistIdOf(from);
  engine.state.artists.set(artistId, {
    artistId,
    displayName: `${from.slice(0, 6)}…${from.slice(-4)}`,
    handle: from.slice(2, 10).toLowerCase(),
    bio: "",
    authority: from,
    payout: from,
    restrainedUntil: null,
    lastActivity: engine.now(),
    consolidatedWallets: [],
    federatedContracts: [],
    programs: [],
  });
  return artistId;
}

function registerContract(
  engine: MockStreamEngine,
  entry: Omit<MockFederatedState, "nextTokenId" | "delisting" | "status">
): MockFederatedState {
  const state: MockFederatedState = {
    ...entry,
    status: "ACTIVE",
    delisting: null,
    nextTokenId: 1,
  };
  engine.state.federated.set(entry.address, state);
  const artist = artistOrThrow(engine, entry.artistId);
  artist.federatedContracts.push(entry.address);
  if (!artist.programs.includes("federated")) {
    artist.programs.push("federated");
  }
  return state;
}

function validateRequest(request: FederatedDeployRequest): void {
  const names = [request.name, request.symbol];
  if (request.form === "PAIR") {
    names.push(request.editionName ?? "", request.editionSymbol ?? "");
  }
  if (names.some((value) => value.trim().length === 0)) {
    revert("InvalidName");
  }
  if (request.defaultLicense.trim().length === 0) {
    revert("InvalidLicense");
  }
}

/** The factory deploys the template(s) and registers them, in one transaction. */
export function deployFederated(
  engine: MockStreamEngine,
  from: Address,
  request: FederatedDeployRequest,
  at: number = engine.now()
): FederatedDeployResult {
  validateRequest(request);
  const artistId = ensureArtist(engine, from);
  engine.state.federatedDeployNonce += 1;
  const nonce = engine.state.federatedDeployNonce;
  const deployTx = engine.pendingTxHash();
  const standards: TokenStandard[] =
    request.form === "PAIR" ? ["ERC721", "ERC1155"] : [request.form];
  const addresses = standards.map((standard) =>
    mockAddress(`federated:${nonce}:${standard}`)
  );
  standards.forEach((standard, index) => {
    const isEdition = request.form === "PAIR" && standard === "ERC1155";
    registerContract(engine, {
      address: addresses[index] ?? mockAddress("none"),
      form: request.form,
      standard,
      partner: request.form === "PAIR" ? (addresses[1 - index] ?? null) : null,
      artistId,
      templateVersion: FEDERATED_TEMPLATE_VERSION,
      codeHash: mockHash(`template:v${FEDERATED_TEMPLATE_VERSION}:${standard}`),
      feeShare: FEDERATED_FEE_SHARE,
      artistDelisted: false,
      name: isEdition ? (request.editionName ?? request.name) : request.name,
      symbol: isEdition
        ? (request.editionSymbol ?? request.symbol)
        : request.symbol,
      deployedAt: at,
      deployTx,
      defaultLicense: request.defaultLicense,
      saleKinds: SALE_KINDS_BY_STANDARD[standard],
    });
  });
  return { contracts: addresses, artistId };
}

function contractOrThrow(engine: MockStreamEngine, address: Address) {
  const entry = engine.state.federated.get(address);
  if (!entry) {
    revert("UnknownContract", { token: address });
  }
  return entry;
}

function assertControl(
  engine: MockStreamEngine,
  entry: MockFederatedState,
  from: Address
): void {
  if (entry.status !== "ACTIVE" || entry.artistDelisted) {
    revert("TargetNotAllowed", { token: entry.address });
  }
  const artist = artistOrThrow(engine, entry.artistId);
  if (artist.authority.toLowerCase() !== from.toLowerCase()) {
    revert("NotWorkArtist", { caller: from });
  }
}

function newFederatedToken(
  engine: MockStreamEngine,
  entry: MockFederatedState,
  title: string,
  at: number
): MockToken {
  const tokenId = entry.nextTokenId;
  entry.nextTokenId += 1;
  const seed = Number.parseInt(
    mockHash(`${entry.address}:${tokenId}`).slice(2, 10),
    16
  );
  return addOneOfOne(
    engine,
    {
      title,
      description: "",
      artistId: entry.artistId,
      payees: [{ artistId: entry.artistId, share: SPLITS_DENOMINATOR }],
      year: new Date(at * 1_000).getUTCFullYear(),
      medium: "Digital",
      style: STYLES[seed % STYLES.length] ?? "orbits",
      seed,
      license: entry.defaultLicense,
      kind: entry.form === "PAIR" ? "EDITION_MASTER" : "ORIGINAL",
      collection: {
        id: Number.parseInt(entry.address.slice(2, 8), 16),
        name: entry.name,
      },
    },
    {
      token: entry.address,
      tokenId,
      variant:
        entry.form === "PAIR" ? "federated-pair-master" : "federated-721",
      feeShare: entry.feeShare,
      federatedContract: entry.address,
      mintedAt: at,
    }
  );
}

/**
 * A federated 1/1 sells through the shared English auction. For a linked pair
 * the edition auction opens alongside it on the ERC-1155 half, as in Stream.
 */
export function mintViaAuction(
  engine: MockStreamEngine,
  from: Address,
  contract: Address,
  title: string,
  at: number = engine.now()
): WorkKey {
  const entry = contractOrThrow(engine, contract);
  if (entry.standard !== "ERC721") {
    revert("WrongForm", { token: contract });
  }
  assertControl(engine, entry, from);
  const master = newFederatedToken(engine, entry, title, at);
  startEnglishAuction(engine, master.key, at);
  if (entry.form === "PAIR" && entry.partner !== null) {
    const edition = addLinkedEdition(engine, master, {
      token: entry.partner,
      variant: "federated-pair-edition",
      created: true,
    });
    const auction = prepareEditionAuction(engine, edition.key, {
      master: master.key,
      cap: 0,
    });
    openPreparedAuction(engine, auction, at);
  }
  return master.key;
}

/** A standalone federated ERC-1155 edition with its own fixed 24-hour anchor. */
export function openFederatedEdition(
  engine: MockStreamEngine,
  from: Address,
  contract: Address,
  request: {
    readonly title: string;
    readonly cap: number;
    readonly at?: number;
  }
): WorkKey {
  const { title, cap } = request;
  const at = request.at ?? engine.now();
  const entry = contractOrThrow(engine, contract);
  if (entry.form !== "ERC1155") {
    revert("WrongForm", { token: contract });
  }
  assertControl(engine, entry, from);
  const base = newFederatedToken(engine, entry, title, at);
  // A standalone 1155 edition: the token itself is the edition.
  const edition: MockToken = {
    ...base,
    variant: "federated-1155",
    standard: "ERC1155",
    supply: 0,
  };
  engine.state.tokens.set(edition.key, edition);
  const auction = prepareEditionAuction(engine, edition.key, {
    master: null,
    cap,
    fixedAnchorEnd: at + STANDALONE_EDITION_DURATION,
  });
  openPreparedAuction(engine, auction, at);
  return edition.key;
}

/** A TDH vote delists or relists a contract (both halves of a pair). */
export function setFederatedStatus(
  engine: MockStreamEngine,
  contract: Address,
  delisted: boolean,
  statement: StatementView | null
): void {
  const entry = contractOrThrow(engine, contract);
  const targets = [
    entry,
    ...(entry.partner === null ? [] : [contractOrThrow(engine, entry.partner)]),
  ];
  for (const target of targets) {
    target.status = delisted ? "DELISTED" : "ACTIVE";
    target.delisting = delisted
      ? {
          voteRef: mockHash(`vote:delist:${target.address}:${engine.now()}`),
          statement,
          at: engine.now(),
          reason: "impersonation",
        }
      : null;
  }
}

export function federatedView(
  engine: MockStreamEngine,
  entry: MockFederatedState
): FederatedContract {
  const works = [...engine.state.tokens.values()]
    .filter((token) => token.federatedContract === entry.address)
    .map((token) => token.key);
  return {
    address: entry.address,
    form: entry.form,
    standard: entry.standard,
    partner: entry.partner,
    artistId: entry.artistId,
    templateVersion: entry.templateVersion,
    codeHash: entry.codeHash,
    feeShare: entry.feeShare,
    status: entry.status,
    artistDelisted: entry.artistDelisted,
    name: entry.name,
    symbol: entry.symbol,
    deployedAt: entry.deployedAt,
    deployTx: entry.deployTx,
    defaultLicense: entry.defaultLicense,
    works,
    saleKinds: [...entry.saleKinds],
    delisting: entry.delisting,
  };
}

export function federatedDirectory(
  engine: MockStreamEngine,
  query: FederatedDirectoryQuery = {}
): FederatedContract[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  return [...engine.state.federated.values()]
    .filter(
      (entry) => query.includeDelisted === true || entry.status === "ACTIVE"
    )
    .filter((entry) => query.form === undefined || entry.form === query.form)
    .filter(
      (entry) =>
        query.artistId === undefined || entry.artistId === query.artistId
    )
    .filter((entry) => {
      if (search === "") {
        return true;
      }
      const artist = engine.state.artists.get(entry.artistId);
      return [entry.name, entry.symbol, artist?.displayName ?? ""].some(
        (value) => value.toLowerCase().includes(search)
      );
    })
    .sort((left, right) => right.deployedAt - left.deployedAt)
    .map((entry) => federatedView(engine, entry));
}
