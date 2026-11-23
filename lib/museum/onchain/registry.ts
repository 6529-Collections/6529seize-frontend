import {
  createPublicClient,
  http,
  keccak256,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { sepolia } from "viem/chains";
import { PROVENANCE_REGISTRY_READ_ABI as abi } from "./abi";
import {
  ERC165_INTERFACE_ID,
  ERC165_INVALID_INTERFACE_ID,
  ONCHAIN_MUSEUM_REGISTRY_PLACEHOLDER,
  ONCHAIN_MUSEUM_SOURCE,
} from "./constants";
import type { OnchainHashRef } from "./verify";

/** Calls per `eth_call` to Multicall3; sized well under RPC gas caps. */
const MULTICALL_BATCH = 120;
const RPC_TIMEOUT_MS = 15_000;
const RPC_RETRIES = 4;

export interface RegistryVersion {
  readonly version: number;
  readonly sequence: number;
  readonly releaseId: number;
  readonly schemaId: Hex;
  readonly contentHash: OnchainHashRef;
  readonly effectiveAt: number;
  readonly publishedAt: number;
  readonly publisher: Address;
  readonly deleted: boolean;
  readonly deletionId: number;
  readonly cid: Hex;
  readonly arweaveId: Hex;
  readonly label: string;
}

export interface RegistrySubject {
  readonly subjectId: Hex;
  readonly recordType: Hex;
  readonly versionCount: number;
  readonly liveVersionCount: number;
  readonly deleted: boolean;
  readonly deletionId: number;
  /** `current`, or `latest` when the subject has no live version. */
  readonly version: RegistryVersion;
}

export interface RegistryRelease {
  readonly releaseId: number;
  readonly isSealed: boolean;
  readonly openedAt: number;
  readonly sealedAt: number;
  readonly firstSequence: number;
  readonly recordCount: number;
  readonly openedBy: Address;
  readonly manifestCid: Hex;
  readonly manifestHash: OnchainHashRef;
  /** Optional root content ID; `0x` when the release has none. */
  readonly rootCid: Hex;
  readonly sourceCommit: Hex;
  readonly label: string;
}

export interface RegistryDeletion {
  readonly deletionId: number;
  readonly subjectId: Hex;
  readonly reasonDigest: Hex;
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly wholeSubject: boolean;
  readonly deletedAt: number;
}

export interface RegistrySchema {
  readonly schemaId: Hex;
  readonly literal: string;
  readonly documentHash: OnchainHashRef;
  readonly cid: Hex;
  readonly documentLength: number;
}

export interface RegistryChecks {
  readonly chainId: number;
  readonly codeHash: Hex | null;
  readonly codeHashMatches: boolean;
  readonly supportsRegistryInterface: boolean;
  readonly erc165Conforms: boolean;
  readonly owner: Address;
  readonly ownerMatches: boolean;
  readonly frozen: boolean;
  readonly successor: Address;
}

export interface RegistrySnapshot {
  readonly registry: Address;
  readonly blockNumber: number;
  readonly blockTimestamp: number;
  readonly checks: RegistryChecks;
  readonly releases: readonly RegistryRelease[];
  readonly recordTypes: Readonly<Record<Hex, string>>;
  readonly canonicalizations: Readonly<Record<Hex, string>>;
  readonly schemas: Readonly<Record<Hex, RegistrySchema>>;
  readonly deletions: readonly RegistryDeletion[];
  readonly subjects: readonly RegistrySubject[];
  readonly rpc: { readonly httpRequests: number; readonly ethCalls: number };
}

type Version = {
  version: number;
  sequence: number;
  releaseId: number;
  schemaId: Hex;
  contentHash: { algorithm: number; digest: Hex; canonicalizationId: Hex };
  effectiveAt: bigint;
  publishedAt: number;
  publisher: Address;
  deleted: boolean;
  deletionId: number;
  cid: Hex;
  arweaveId: Hex;
  label: string;
};

function toVersion(raw: Version): RegistryVersion {
  return {
    version: raw.version,
    sequence: raw.sequence,
    releaseId: raw.releaseId,
    schemaId: raw.schemaId,
    contentHash: { ...raw.contentHash },
    effectiveAt: Number(raw.effectiveAt),
    publishedAt: raw.publishedAt,
    publisher: raw.publisher,
    deleted: raw.deleted,
    deletionId: raw.deletionId,
    cid: raw.cid,
    arweaveId: raw.arweaveId,
    label: raw.label,
  };
}

interface Counter {
  httpRequests: number;
  ethCalls: number;
}

function countRequest(counter: Counter, body: unknown): void {
  counter.httpRequests += 1;
  if (typeof body !== "string") return;
  try {
    const parsed: unknown = JSON.parse(body);
    counter.ethCalls += Array.isArray(parsed) ? parsed.length : 1;
  } catch {
    counter.ethCalls += 1;
  }
}

function createOnchainMuseumClient(
  counter: Counter,
  rpcUrl: string = ONCHAIN_MUSEUM_SOURCE.rpcUrl
): PublicClient {
  return createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl, {
      retryCount: RPC_RETRIES,
      retryDelay: 250,
      timeout: RPC_TIMEOUT_MS,
      onFetchRequest: (request, init) => {
        countRequest(counter, init.body ?? request.body);
      },
    }),
  }) as PublicClient;
}

type Call = {
  readonly address: Address;
  readonly abi: typeof abi;
  readonly functionName: string;
  readonly args?: readonly unknown[];
};

type ReadResult =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false };
type MulticallEntry = { readonly status: string; readonly result?: unknown };

/**
 * Reads many calls at one block through Multicall3. A failed call stays a
 * failure (for example `current` on a deleted subject); a failed batch
 * throws after the transport's retries.
 */
async function readMany(
  client: PublicClient,
  blockNumber: bigint,
  calls: readonly Call[]
): Promise<ReadResult[]> {
  const results: ReadResult[] = [];
  for (let start = 0; start < calls.length; start += MULTICALL_BATCH) {
    const chunk = calls.slice(start, start + MULTICALL_BATCH);
    const batch = (await client.multicall({
      contracts: chunk as never,
      allowFailure: true,
      blockNumber,
      batchSize: 0,
    })) as readonly MulticallEntry[];
    for (const entry of batch) {
      results.push(
        entry.status === "success"
          ? { ok: true, value: entry.result }
          : { ok: false }
      );
    }
  }
  return results;
}

function required(entry: ReadResult | undefined, what: string): unknown {
  if (!entry?.ok) throw new Error(`registry_read_failed:${what}`);
  return entry.value;
}

/** Splits a flat result list back into the groups it was requested in. */
function splitter(results: readonly ReadResult[]) {
  let offset = 0;
  return (count: number): ReadResult[] => {
    const slice = results.slice(offset, offset + count);
    offset += count;
    return slice;
  };
}

const call = (functionName: string, args?: readonly unknown[]): Call => ({
  address: ONCHAIN_MUSEUM_SOURCE.registry,
  abi,
  functionName,
  ...(args === undefined ? {} : { args }),
});

function range(count: number, from = 0): number[] {
  return Array.from({ length: count }, (_, index) => index + from);
}

interface HeadReads {
  readonly supportsRegistryInterface: boolean;
  readonly erc165Conforms: boolean;
  readonly owner: Address;
  readonly frozen: boolean;
  readonly successor: Address;
  readonly subjectCount: number;
  readonly releaseCount: number;
  readonly deletionCount: number;
  readonly recordTypeCount: number;
  readonly schemaCount: number;
  readonly canonicalizationCount: number;
}

async function readHead(
  rpc: PublicClient,
  blockNumber: bigint
): Promise<HeadReads> {
  const head = await readMany(rpc, blockNumber, [
    call("supportsInterface", [ONCHAIN_MUSEUM_SOURCE.build.interfaceId]),
    call("supportsInterface", [ERC165_INTERFACE_ID]),
    call("supportsInterface", [ERC165_INVALID_INTERFACE_ID]),
    call("owner"),
    call("frozen"),
    call("successor"),
    call("subjectCount"),
    call("releaseCount"),
    call("deletionCount"),
    call("recordTypeCount"),
    call("schemaCount"),
    call("canonicalizationCount"),
  ]);
  const count = (index: number, what: string) =>
    Number(required(head[index], what) as bigint | number);
  return {
    supportsRegistryInterface: required(head[0], "interface") === true,
    erc165Conforms:
      required(head[1], "erc165") === true &&
      required(head[2], "erc165_invalid") === false,
    owner: required(head[3], "owner") as Address,
    frozen: required(head[4], "frozen") === true,
    successor: required(head[5], "successor") as Address,
    subjectCount: count(6, "subjectCount"),
    releaseCount: count(7, "releaseCount"),
    deletionCount: count(8, "deletionCount"),
    recordTypeCount: count(9, "recordTypeCount"),
    schemaCount: count(10, "schemaCount"),
    canonicalizationCount: count(11, "canonicalizationCount"),
  };
}

interface Listing {
  readonly subjectIds: readonly Hex[];
  readonly releases: readonly RegistryRelease[];
  readonly deletions: readonly RegistryDeletion[];
  readonly recordTypeIds: readonly Hex[];
  readonly schemaIds: readonly Hex[];
  readonly canonicalizationIds: readonly Hex[];
}

function toRelease(raw: RegistryRelease): RegistryRelease {
  return {
    releaseId: raw.releaseId,
    isSealed: raw.isSealed,
    openedAt: raw.openedAt,
    sealedAt: raw.sealedAt,
    firstSequence: raw.firstSequence,
    recordCount: raw.recordCount,
    openedBy: raw.openedBy,
    manifestCid: raw.manifestCid,
    manifestHash: { ...raw.manifestHash },
    rootCid: raw.rootCid,
    sourceCommit: raw.sourceCommit,
    label: raw.label,
  };
}

function toDeletion(
  raw: Omit<RegistryDeletion, "deletionId">,
  deletionId: number
): RegistryDeletion {
  return {
    deletionId,
    subjectId: raw.subjectId,
    reasonDigest: raw.reasonDigest,
    fromVersion: raw.fromVersion,
    toVersion: raw.toVersion,
    wholeSubject: raw.wholeSubject,
    deletedAt: raw.deletedAt,
  };
}

async function readListing(
  rpc: PublicClient,
  blockNumber: bigint,
  head: HeadReads
): Promise<Listing> {
  const take = splitter(
    await readMany(rpc, blockNumber, [
      call("subjects", [0n, BigInt(head.subjectCount)]),
      ...range(head.releaseCount, 1).map((id) => call("getRelease", [id])),
      ...range(head.deletionCount, 1).map((id) => call("deletion", [id])),
      ...range(head.recordTypeCount).map((i) =>
        call("recordTypeAt", [BigInt(i)])
      ),
      ...range(head.schemaCount).map((i) => call("schemaAt", [BigInt(i)])),
      ...range(head.canonicalizationCount).map((i) =>
        call("canonicalizationAt", [BigInt(i)])
      ),
    ])
  );
  const ids = (entries: ReadResult[], what: string) =>
    entries.map((entry) => required(entry, what) as Hex);
  const subjectIds = required(take(1)[0], "subjects") as readonly Hex[];
  const releases = take(head.releaseCount).map((entry, index) =>
    toRelease(required(entry, `release_${index + 1}`) as RegistryRelease)
  );
  const deletions = take(head.deletionCount).map((entry, index) =>
    toDeletion(
      required(entry, `deletion_${index + 1}`) as Omit<
        RegistryDeletion,
        "deletionId"
      >,
      index + 1
    )
  );
  return {
    subjectIds,
    releases,
    deletions,
    recordTypeIds: ids(take(head.recordTypeCount), "recordTypeAt"),
    schemaIds: ids(take(head.schemaCount), "schemaAt"),
    canonicalizationIds: ids(
      take(head.canonicalizationCount),
      "canonicalizationAt"
    ),
  };
}

type SubjectRaw = {
  recordType: Hex;
  versionCount: number;
  liveVersionCount: number;
  deleted: boolean;
  deletionId: number;
};

function toSubject(
  subjectId: Hex,
  raw: SubjectRaw,
  version: Version
): RegistrySubject {
  return {
    subjectId,
    recordType: raw.recordType,
    versionCount: raw.versionCount,
    liveVersionCount: raw.liveVersionCount,
    deleted: raw.deleted,
    deletionId: raw.deletionId,
    version: toVersion(version),
  };
}

interface Registrations {
  readonly recordTypes: Record<Hex, string>;
  readonly schemas: Record<Hex, RegistrySchema>;
  readonly canonicalizations: Record<Hex, string>;
}

function toRegistrations(
  listing: Listing,
  take: (count: number) => ReadResult[]
): Registrations {
  const { recordTypeIds, schemaIds, canonicalizationIds } = listing;
  const recordTypes: Record<Hex, string> = {};
  take(recordTypeIds.length).forEach((entry, index) => {
    const raw = required(entry, "recordType") as { literal: string };
    recordTypes[recordTypeIds[index] as Hex] = raw.literal;
  });
  const schemas: Record<Hex, RegistrySchema> = {};
  take(schemaIds.length).forEach((entry, index) => {
    const id = schemaIds[index] as Hex;
    const raw = required(entry, "schema") as Omit<RegistrySchema, "schemaId">;
    schemas[id] = {
      schemaId: id,
      literal: raw.literal,
      documentHash: { ...raw.documentHash },
      cid: raw.cid,
      documentLength: raw.documentLength,
    };
  });
  const canonicalizations: Record<Hex, string> = {};
  take(canonicalizationIds.length).forEach((entry, index) => {
    const raw = required(entry, "canonicalization") as { literal: string };
    canonicalizations[canonicalizationIds[index] as Hex] = raw.literal;
  });
  return { recordTypes, schemas, canonicalizations };
}

async function readDetails(
  rpc: PublicClient,
  blockNumber: bigint,
  listing: Listing
): Promise<Registrations & { readonly subjects: RegistrySubject[] }> {
  const { recordTypeIds, schemaIds, canonicalizationIds, subjectIds } = listing;
  const take = splitter(
    await readMany(rpc, blockNumber, [
      ...recordTypeIds.map((id) => call("recordType", [id])),
      ...schemaIds.map((id) => call("schema", [id])),
      ...canonicalizationIds.map((id) => call("canonicalization", [id])),
      ...subjectIds.flatMap((id) => [
        call("subject", [id]),
        call("current", [id]),
      ]),
    ])
  );
  const registrations = toRegistrations(listing, take);

  // `current` reverts for a subject with no live version; read `latest` then.
  const pairs = take(subjectIds.length * 2);
  const missing = subjectIds
    .map((_, index) => index)
    .filter((index) => !pairs[index * 2 + 1]?.ok);
  const latest = await readMany(
    rpc,
    blockNumber,
    missing.map((index) => call("latest", [subjectIds[index]]))
  );
  const latestByIndex = new Map(
    missing.map((subjectIndex, position) => [
      subjectIndex,
      required(latest[position], "latest") as Version,
    ])
  );
  const subjects = subjectIds.map((subjectId, index) => {
    const current = pairs[index * 2 + 1];
    const version = current?.ok
      ? (current.value as Version)
      : (latestByIndex.get(index) as Version);
    const raw = required(pairs[index * 2], "subject") as SubjectRaw;
    return toSubject(subjectId, raw, version);
  });
  return { ...registrations, subjects };
}

/**
 * Reads the whole registry from state at the latest finalized block: the
 * code and interface checks, every release, registration, deletion and
 * subject with its current version.
 */
export async function readRegistrySnapshot(
  client?: PublicClient
): Promise<RegistrySnapshot> {
  const {
    registry,
    chainId: expectedChainId,
    owner,
    build,
  } = ONCHAIN_MUSEUM_SOURCE;
  if (
    registry.toLowerCase() === ONCHAIN_MUSEUM_REGISTRY_PLACEHOLDER.toLowerCase()
  ) {
    throw new Error("registry_address_pending");
  }
  const counter: Counter = { httpRequests: 0, ethCalls: 0 };
  const rpc = client ?? createOnchainMuseumClient(counter);

  const block = await rpc.getBlock({ blockTag: "finalized" });
  const blockNumber = block.number;
  const [chainId, code] = await Promise.all([
    rpc.getChainId(),
    rpc.getCode({ address: registry, blockNumber }),
  ]);
  if (chainId !== expectedChainId) {
    throw new Error("registry_wrong_chain");
  }
  const codeHash = code === undefined || code === "0x" ? null : keccak256(code);
  const head = await readHead(rpc, blockNumber);
  const listing = await readListing(rpc, blockNumber, head);
  const details = await readDetails(rpc, blockNumber, listing);

  return {
    registry,
    blockNumber: Number(blockNumber),
    blockTimestamp: Number(block.timestamp),
    checks: {
      chainId,
      codeHash,
      codeHashMatches:
        codeHash?.toLowerCase() === build.runtimeCodeHash.toLowerCase(),
      supportsRegistryInterface: head.supportsRegistryInterface,
      erc165Conforms: head.erc165Conforms,
      owner: head.owner,
      ownerMatches: head.owner.toLowerCase() === owner.toLowerCase(),
      frozen: head.frozen,
      successor: head.successor,
    },
    releases: listing.releases,
    recordTypes: details.recordTypes,
    canonicalizations: details.canonicalizations,
    schemas: details.schemas,
    deletions: listing.deletions,
    subjects: details.subjects,
    rpc: { httpRequests: counter.httpRequests, ethCalls: counter.ethCalls },
  };
}
