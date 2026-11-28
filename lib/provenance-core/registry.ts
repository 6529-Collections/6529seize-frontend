// Copied from 6529-Collections/6529-provenance-app src/registry.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  keccak256,
  zeroAddress,
  type Address,
  type ContractFunctionReturnType,
  type Hex,
  type PublicClient,
} from "viem";
import { provenanceRegistryAbi as abi } from "./abi/provenanceRegistry";
import { rc2GetReleaseAbi } from "./abi/legacy";
import {
  buildForCodeHash,
  ERC165_ID,
  ERC165_INVALID_ID,
  knownBuilds,
  type KnownBuild,
} from "./config/builds";

export type Version = ContractFunctionReturnType<typeof abi, "view", "current">;
export type Subject = ContractFunctionReturnType<typeof abi, "view", "subject">;
export type Release = ContractFunctionReturnType<typeof abi, "view", "getRelease">;
export type Schema = ContractFunctionReturnType<typeof abi, "view", "schema">;
export type Deletion = ContractFunctionReturnType<typeof abi, "view", "deletion">;
export type PublisherChange = ContractFunctionReturnType<typeof abi, "view", "publisherChangeAt">;
export type OwnerRecord = ContractFunctionReturnType<typeof abi, "view", "ownerAt">;
export type HashRef = Version["contentHash"];

/** Calls per eth_call through Multicall3. The public Sepolia endpoint caps a call at 50M gas. */
const MULTICALL_CHUNK = 100;

// Every read takes an optional block number. Reads made in several calls, such as a page of
// subjects and then their versions, give one consistent state only when they share a block.
async function multi<T>(
  client: PublicClient,
  contracts: readonly {
    address: Address;
    abi: typeof abi | typeof rc2GetReleaseAbi;
    functionName: string;
    args?: readonly unknown[];
  }[],
  blockNumber?: bigint,
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < contracts.length; i += MULTICALL_CHUNK) {
    const chunk = contracts.slice(i, i + MULTICALL_CHUNK);
    const res = await client.multicall({
      contracts: chunk as never,
      allowFailure: false,
      batchSize: 0,
      ...(blockNumber === undefined ? {} : { blockNumber }),
    });
    out.push(...(res as T[]));
  }
  return out;
}

type Call = {
  address: Address;
  abi: typeof abi | typeof rc2GetReleaseAbi;
  functionName: string;
  args?: readonly unknown[];
};

// Like multi, for calls 0 to count - 1 made by `make`: each chunk's calls are built when it is sent,
// so a long list never sits in memory as call objects.
async function multiRange<T>(
  client: PublicClient,
  count: number,
  make: (i: number) => Call,
  blockNumber?: bigint,
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < count; i += MULTICALL_CHUNK) {
    const n = Math.min(MULTICALL_CHUNK, count - i);
    out.push(
      ...(await multi<T>(
        client,
        Array.from({ length: n }, (_, k) => make(i + k)),
        blockNumber,
      )),
    );
  }
  return out;
}

const at = (blockNumber: bigint | undefined) => (blockNumber === undefined ? {} : { blockNumber });

// One block for a read made of several calls: the given block, or the latest block when the read starts.
const blockFor = async (client: PublicClient, blockNumber: bigint | undefined): Promise<bigint> =>
  blockNumber ?? (await client.getBlockNumber({ cacheTime: 0 }));

/** Thrown when a client is on another chain than the one a registry or pin names. */
export class ChainMismatchError extends Error {
  constructor(
    readonly expected: number,
    readonly actual: number,
  ) {
    super(`The RPC endpoint is on chain ${actual}, not chain ${expected}.`);
    this.name = "ChainMismatchError";
  }
}

/**
 * Throws ChainMismatchError unless the client's endpoint answers eth_chainId with `expected`. A
 * registry and a Safe can sit at the same addresses on two chains, so the address alone does not
 * say which chain a read came from.
 */
export async function assertChain(client: PublicClient, expected: number): Promise<void> {
  const actual = await client.getChainId();
  if (actual !== expected) throw new ChainMismatchError(expected, actual);
}

// A revert or an empty return means the call is not supported; anything else, such as a dropped
// request, is an error the caller retries.
function isRevert(e: unknown): boolean {
  return (
    e instanceof ContractFunctionExecutionError &&
    (e.cause instanceof ContractFunctionRevertedError || e.cause instanceof ContractFunctionZeroDataError)
  );
}

export interface RegistryCheck {
  hasCode: boolean;
  codeHash?: Hex | undefined;
  codeBytes: number;
  build?: KnownBuild | undefined;
  /** supportsInterface results; undefined when the call reverted. */
  erc165?: boolean | undefined;
  invalidIdRejected?: boolean | undefined;
  interfaces: { build: KnownBuild; supported?: boolean | undefined }[];
}

/**
 * Checks an address the way the contract's integrator guide describes: ERC-165 detection, then the
 * runtime code hash. With `chainId`, it first throws ChainMismatchError when the client is on
 * another chain. A transport error throws; only a revert counts as "not supported".
 */
export async function checkRegistry(
  client: PublicClient,
  address: Address,
  options: { chainId?: number; blockNumber?: bigint } = {},
): Promise<RegistryCheck> {
  if (options.chainId !== undefined) await assertChain(client, options.chainId);
  const code = await client.getCode({ address, ...at(options.blockNumber) });
  if (!code || code === "0x") return { hasCode: false, codeBytes: 0, interfaces: [] };
  const codeHash = keccak256(code);
  const call = async (id: Hex) => {
    try {
      return await client.readContract({
        address,
        abi,
        functionName: "supportsInterface",
        args: [id],
        ...at(options.blockNumber),
      });
    } catch (e) {
      if (isRevert(e)) return undefined;
      throw e;
    }
  };
  const [erc165, invalid, ...ifaces] = await Promise.all([
    call(ERC165_ID),
    call(ERC165_INVALID_ID),
    ...knownBuilds.map((b) => call(b.interfaceId)),
  ]);
  return {
    hasCode: true,
    codeHash,
    codeBytes: (code.length - 2) / 2,
    build: buildForCodeHash(codeHash),
    erc165,
    invalidIdRejected: invalid === undefined ? undefined : !invalid,
    interfaces: knownBuilds.map((build, i) => ({ build, supported: ifaces[i] })),
  };
}

export interface Overview {
  owner: Address;
  pendingOwner: Address;
  frozen: boolean;
  frozenAt: number;
  successor: Address;
  subjectCount: number;
  sequenceCount: number;
  releaseCount: number;
  openReleaseId: number;
  deletionCount: number;
  schemaCount: number;
  recordTypeCount: number;
  canonicalizationCount: number;
  ownerCount: number;
  publisherChangeCount: number;
}

const OVERVIEW_FIELDS = [
  "owner",
  "pendingOwner",
  "frozen",
  "frozenAt",
  "successor",
  "subjectCount",
  "sequenceCount",
  "releaseCount",
  "openReleaseId",
  "deletionCount",
  "schemaCount",
  "recordTypeCount",
  "canonicalizationCount",
  "ownerCount",
  "publisherChangeCount",
] as const;

/** Reads the registry's counters and state. With `chainId`, throws ChainMismatchError first on another chain. */
export async function readOverview(
  client: PublicClient,
  address: Address,
  options: { chainId?: number; blockNumber?: bigint } = {},
): Promise<Overview> {
  if (options.chainId !== undefined) await assertChain(client, options.chainId);
  const values = await multi<unknown>(
    client,
    OVERVIEW_FIELDS.map((functionName) => ({ address, abi, functionName })),
    options.blockNumber,
  );
  const o: Record<string, unknown> = {};
  OVERVIEW_FIELDS.forEach((k, i) => {
    const v = values[i];
    o[k] = typeof v === "bigint" ? Number(v) : v;
  });
  return o as unknown as Overview;
}

export interface Registration {
  id: Hex;
  literal: string;
  registeredAt: number;
}
export interface SchemaRegistration extends Registration {
  documentHash: HashRef;
  cid: Hex;
  chunkCount: number;
  documentLength: number;
}
export interface CanonicalizationRegistration extends Registration {
  specCid: Hex;
}

export interface Registrations {
  canonicalizations: CanonicalizationRegistration[];
  recordTypes: Registration[];
  schemas: SchemaRegistration[];
}

export async function readRegistrations(
  client: PublicClient,
  address: Address,
  o: Overview,
  block?: bigint,
): Promise<Registrations> {
  const blockNumber = await blockFor(client, block);
  const [canonIds, typeIds, schemaIds] = await Promise.all([
    multiRange<Hex>(
      client,
      o.canonicalizationCount,
      (i) => ({ address, abi, functionName: "canonicalizationAt", args: [BigInt(i)] }),
      blockNumber,
    ),
    multiRange<Hex>(
      client,
      o.recordTypeCount,
      (i) => ({ address, abi, functionName: "recordTypeAt", args: [BigInt(i)] }),
      blockNumber,
    ),
    multiRange<Hex>(
      client,
      o.schemaCount,
      (i) => ({ address, abi, functionName: "schemaAt", args: [BigInt(i)] }),
      blockNumber,
    ),
  ]);
  type C = { literal: string; specCid: Hex; registeredAt: number };
  type T = { literal: string; registeredAt: number };
  const [canons, types, schemas] = await Promise.all([
    multi<C>(
      client,
      canonIds.map((id) => ({ address, abi, functionName: "canonicalization", args: [id] })),
      blockNumber,
    ),
    multi<T>(
      client,
      typeIds.map((id) => ({ address, abi, functionName: "recordType", args: [id] })),
      blockNumber,
    ),
    multi<Schema>(
      client,
      schemaIds.map((id) => ({ address, abi, functionName: "schema", args: [id] })),
      blockNumber,
    ),
  ]);
  return {
    canonicalizations: canons.map((c, i) => ({
      id: canonIds[i]!,
      literal: c.literal,
      specCid: c.specCid,
      registeredAt: Number(c.registeredAt),
    })),
    recordTypes: types.map((t, i) => ({
      id: typeIds[i]!,
      literal: t.literal,
      registeredAt: Number(t.registeredAt),
    })),
    schemas: schemas.map((s, i) => ({
      id: schemaIds[i]!,
      literal: s.literal,
      registeredAt: Number(s.registeredAt),
      documentHash: s.documentHash,
      cid: s.cid,
      chunkCount: s.chunks.length,
      documentLength: Number(s.documentLength),
    })),
  };
}

/** Maps an ID to its literal across the three registries, for display. */
export function literalIndex(r: Registrations | undefined): Map<string, string> {
  const m = new Map<string, string>();
  if (!r) return m;
  for (const x of [...r.canonicalizations, ...r.recordTypes, ...r.schemas])
    m.set(x.id.toLowerCase(), x.literal);
  return m;
}

export interface SubjectSummary {
  id: Hex;
  subject: Subject;
  latest?: Version | undefined;
}

export async function readSubjectPage(
  client: PublicClient,
  address: Address,
  offset: number,
  limit: number,
  blockNumber?: bigint,
): Promise<SubjectSummary[]> {
  const block = blockNumber ?? (await client.getBlockNumber({ cacheTime: 0 }));
  const ids = (await client.readContract({
    address,
    abi,
    functionName: "subjects",
    args: [BigInt(offset), BigInt(limit)],
    blockNumber: block,
  })) as readonly Hex[];
  return readSubjectSummaries(client, address, ids, block);
}

export async function readSubjectSummaries(
  client: PublicClient,
  address: Address,
  ids: readonly Hex[],
  blockNumber?: bigint,
): Promise<SubjectSummary[]> {
  const block = blockNumber ?? (await client.getBlockNumber({ cacheTime: 0 }));
  const subjects = await multi<Subject>(
    client,
    ids.map((id) => ({ address, abi, functionName: "subject", args: [id] })),
    block,
  );
  const latest = await multi<Version>(
    client,
    ids.map((id) => ({ address, abi, functionName: "latest", args: [id] })),
    block,
  );
  return ids.map((id, i) => ({ id, subject: subjects[i]!, latest: latest[i] }));
}

export async function readVersions(
  client: PublicClient,
  address: Address,
  subjectId: Hex,
  versionCount: number,
  blockNumber?: bigint,
): Promise<Version[]> {
  const block = blockNumber ?? (await client.getBlockNumber({ cacheTime: 0 }));
  const out: Version[] = [];
  const page = 50;
  for (let from = 1; from <= versionCount; from += page) {
    const res = (await client.readContract({
      address,
      abi,
      functionName: "getVersions",
      args: [subjectId, from, page],
      blockNumber: block,
    })) as readonly Version[];
    out.push(...res);
  }
  return out;
}

/**
 * The known build at `address`, from its runtime code hash, or undefined for unknown code.
 */
export async function readBuild(
  client: PublicClient,
  address: Address,
  blockNumber?: bigint,
): Promise<KnownBuild | undefined> {
  const code = await client.getCode({ address, ...at(blockNumber) });
  return code ? buildForCodeHash(keccak256(code)) : undefined;
}

/**
 * Whether `getRelease` at a registry of this build returns `sealedBy`. Builds before v1.0.0-rc.3
 * do not; unknown code is read with the pinned ABI.
 */
export function releaseHasSealedBy(build: KnownBuild | undefined): boolean {
  return build === undefined || build.sealedBy;
}

/**
 * Releases `from` to `from + count - 1`, a page at a time, all read at one block: `blockNumber`, or
 * the latest block when the first page is read. Memory holds one page. A registry of a build
 * before v1.0.0-rc.3 does not record who sealed a release, so `sealedBy` reads as the zero address
 * there.
 */
export async function* iterateReleases(
  client: PublicClient,
  address: Address,
  count: number,
  o: { from?: number | undefined; pageSize?: number | undefined; blockNumber?: bigint | undefined } = {},
): AsyncGenerator<Release[]> {
  const blockNumber = await blockFor(client, o.blockNumber);
  const withSealedBy = releaseHasSealedBy(await readBuild(client, address, blockNumber));
  const first = o.from ?? 1;
  const pageSize = o.pageSize ?? 500;
  for (let start = 0; start < count; start += pageSize) {
    const n = Math.min(pageSize, count - start);
    const page = await multiRange<Release>(
      client,
      n,
      (k) => ({
        address,
        abi: withSealedBy ? abi : rc2GetReleaseAbi,
        functionName: "getRelease",
        args: [first + start + k],
      }),
      blockNumber,
    );
    yield withSealedBy ? page : page.map((r) => ({ ...r, sealedBy: zeroAddress }));
  }
}

/** Releases 1 to `count`, read at one block. `iterateReleases` reads them a page at a time. */
export async function readReleases(
  client: PublicClient,
  address: Address,
  count: number,
  blockNumber?: bigint,
): Promise<Release[]> {
  const out: Release[] = [];
  for await (const page of iterateReleases(client, address, count, { blockNumber })) out.push(...page);
  return out;
}

export async function readDeletions(
  client: PublicClient,
  address: Address,
  count: number,
  blockNumber?: bigint,
): Promise<Deletion[]> {
  const block = await blockFor(client, blockNumber);
  return multiRange<Deletion>(
    client,
    count,
    (i) => ({ address, abi, functionName: "deletion", args: [i + 1] }),
    block,
  );
}

export async function readPublisherLog(
  client: PublicClient,
  address: Address,
  count: number,
  blockNumber?: bigint,
): Promise<{ log: PublisherChange[]; current: Map<Address, boolean> }> {
  const block = await blockFor(client, blockNumber);
  const log = await multiRange<PublisherChange>(
    client,
    count,
    (i) => ({ address, abi, functionName: "publisherChangeAt", args: [BigInt(i)] }),
    block,
  );
  const keys = [...new Set(log.map((c) => c.publisher))];
  const flags = await multi<boolean>(
    client,
    keys.map((k) => ({ address, abi, functionName: "isPublisher", args: [k] })),
    block,
  );
  return { log, current: new Map(keys.map((k, i) => [k, flags[i]!])) };
}

export async function readOwnerLog(
  client: PublicClient,
  address: Address,
  count: number,
  blockNumber?: bigint,
): Promise<OwnerRecord[]> {
  const block = await blockFor(client, blockNumber);
  return multiRange<OwnerRecord>(
    client,
    count,
    (i) => ({ address, abi, functionName: "ownerAt", args: [BigInt(i)] }),
    block,
  );
}

export interface IndexedVersion extends Version {
  subjectId: Hex;
  recordType: Hex;
}

/**
 * Every version of every subject, from state, a page of subjects at a time, in subject order. Memory
 * holds one page of subject IDs and their versions. Every call reads the same block,
 * `blockNumber` or the latest block when the first page is read, so a publish during the read
 * cannot mix two states. A page's versions are in subject order, not sequence order.
 */
export async function* iterateAllVersions(
  client: PublicClient,
  address: Address,
  subjectCount: number,
  o: { blockNumber?: bigint | undefined; subjectsPerPage?: number | undefined } = {},
): AsyncGenerator<IndexedVersion[]> {
  const block = await blockFor(client, o.blockNumber);
  const perPage = o.subjectsPerPage ?? 100;
  for (let off = 0; off < subjectCount; off += perPage) {
    const chunk = (await client.readContract({
      address,
      abi,
      functionName: "subjects",
      args: [BigInt(off), BigInt(Math.min(perPage, subjectCount - off))],
      blockNumber: block,
    })) as readonly Hex[];
    const subjects = await multi<Subject>(
      client,
      chunk.map((id) => ({ address, abi, functionName: "subject", args: [id] })),
      block,
    );
    const calls: Call[] = [];
    const owners: { id: Hex; recordType: Hex }[] = [];
    chunk.forEach((id, k) => {
      const s = subjects[k]!;
      for (let from = 1; from <= s.versionCount; from += 50) {
        calls.push({ address, abi, functionName: "getVersions", args: [id, from, 50] });
        owners.push({ id, recordType: s.recordType });
      }
    });
    const pages = await multi<readonly Version[]>(client, calls, block);
    const out: IndexedVersion[] = [];
    pages.forEach((page, k) => {
      for (const v of page) out.push({ ...v, subjectId: owners[k]!.id, recordType: owners[k]!.recordType });
    });
    yield out;
  }
}

/**
 * Every version of every subject, from state, sorted by sequence. A release's records are the
 * versions whose sequence falls in its range; no read function lists them directly, so this reads
 * the whole registry and holds it in memory. For a registry too large for that, use
 * `iterateAllVersions`. Pass the block `subjectCount` was read at.
 */
export async function readAllVersions(
  client: PublicClient,
  address: Address,
  subjectCount: number,
  onProgress?: (done: number, total: number) => void,
  blockNumber?: bigint,
): Promise<IndexedVersion[]> {
  const out: IndexedVersion[] = [];
  const subjectsPerPage = 100;
  let done = 0;
  for await (const page of iterateAllVersions(client, address, subjectCount, {
    blockNumber,
    subjectsPerPage,
  })) {
    out.push(...page);
    // Each page covers subjectsPerPage subjects, the last one the remainder.
    done = Math.min(done + subjectsPerPage, subjectCount);
    onProgress?.(done, subjectCount);
  }
  out.sort((a, b) => a.sequence - b.sequence);
  return out;
}

export async function readSchemaDocument(
  client: PublicClient,
  address: Address,
  schemaId: Hex,
  blockNumber?: bigint,
): Promise<Hex> {
  return (await client.readContract({
    address,
    abi,
    functionName: "schemaDocument",
    args: [schemaId],
    ...at(blockNumber),
  })) as Hex;
}
