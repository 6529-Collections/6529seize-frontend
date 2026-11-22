// Copied from 6529-Collections/6529-provenance-app src/registry.ts at commit 117e850026f6e1d754e76a687e526f51cceca4a0.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import { keccak256, type Address, type ContractFunctionReturnType, type Hex, type PublicClient } from "viem";
import { provenanceRegistryAbi as abi } from "./abi/provenanceRegistry";
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

async function multi<T>(
  client: PublicClient,
  contracts: readonly {
    address: Address;
    abi: typeof abi;
    functionName: string;
    args?: readonly unknown[];
  }[],
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < contracts.length; i += MULTICALL_CHUNK) {
    const chunk = contracts.slice(i, i + MULTICALL_CHUNK);
    const res = await client.multicall({ contracts: chunk as never, allowFailure: false, batchSize: 0 });
    out.push(...(res as T[]));
  }
  return out;
}

export interface RegistryCheck {
  hasCode: boolean;
  codeHash?: Hex;
  codeBytes: number;
  build?: KnownBuild;
  /** supportsInterface results; undefined when the call reverted. */
  erc165?: boolean;
  invalidIdRejected?: boolean;
  interfaces: { build: KnownBuild; supported?: boolean }[];
}

/** Checks an address the way docs/integrators.md describes: ERC-165 detection, then the runtime code hash. */
export async function checkRegistry(client: PublicClient, address: Address): Promise<RegistryCheck> {
  const code = await client.getCode({ address });
  if (!code || code === "0x") return { hasCode: false, codeBytes: 0, interfaces: [] };
  const codeHash = keccak256(code);
  const call = async (id: Hex) => {
    try {
      return await client.readContract({ address, abi, functionName: "supportsInterface", args: [id] });
    } catch {
      return undefined;
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

export async function readOverview(client: PublicClient, address: Address): Promise<Overview> {
  const values = await multi<unknown>(
    client,
    OVERVIEW_FIELDS.map((functionName) => ({ address, abi, functionName })),
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
): Promise<Registrations> {
  const range = (n: number) => Array.from({ length: n }, (_, i) => BigInt(i));
  const [canonIds, typeIds, schemaIds] = await Promise.all([
    multi<Hex>(
      client,
      range(o.canonicalizationCount).map((i) => ({
        address,
        abi,
        functionName: "canonicalizationAt",
        args: [i],
      })),
    ),
    multi<Hex>(
      client,
      range(o.recordTypeCount).map((i) => ({ address, abi, functionName: "recordTypeAt", args: [i] })),
    ),
    multi<Hex>(
      client,
      range(o.schemaCount).map((i) => ({ address, abi, functionName: "schemaAt", args: [i] })),
    ),
  ]);
  type C = { literal: string; specCid: Hex; registeredAt: number };
  type T = { literal: string; registeredAt: number };
  const [canons, types, schemas] = await Promise.all([
    multi<C>(
      client,
      canonIds.map((id) => ({ address, abi, functionName: "canonicalization", args: [id] })),
    ),
    multi<T>(
      client,
      typeIds.map((id) => ({ address, abi, functionName: "recordType", args: [id] })),
    ),
    multi<Schema>(
      client,
      schemaIds.map((id) => ({ address, abi, functionName: "schema", args: [id] })),
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
  latest?: Version;
}

export async function readSubjectPage(
  client: PublicClient,
  address: Address,
  offset: number,
  limit: number,
): Promise<SubjectSummary[]> {
  const ids = (await client.readContract({
    address,
    abi,
    functionName: "subjects",
    args: [BigInt(offset), BigInt(limit)],
  })) as readonly Hex[];
  return readSubjectSummaries(client, address, ids);
}

export async function readSubjectSummaries(
  client: PublicClient,
  address: Address,
  ids: readonly Hex[],
): Promise<SubjectSummary[]> {
  const subjects = await multi<Subject>(
    client,
    ids.map((id) => ({ address, abi, functionName: "subject", args: [id] })),
  );
  const latest = await multi<Version>(
    client,
    ids.map((id) => ({ address, abi, functionName: "latest", args: [id] })),
  );
  return ids.map((id, i) => ({ id, subject: subjects[i]!, latest: latest[i] }));
}

export async function readVersions(
  client: PublicClient,
  address: Address,
  subjectId: Hex,
  versionCount: number,
): Promise<Version[]> {
  const out: Version[] = [];
  const page = 50;
  for (let from = 1; from <= versionCount; from += page) {
    const res = (await client.readContract({
      address,
      abi,
      functionName: "getVersions",
      args: [subjectId, from, page],
    })) as readonly Version[];
    out.push(...res);
  }
  return out;
}

export async function readReleases(
  client: PublicClient,
  address: Address,
  count: number,
): Promise<Release[]> {
  return multi<Release>(
    client,
    Array.from({ length: count }, (_, i) => ({ address, abi, functionName: "getRelease", args: [i + 1] })),
  );
}

export async function readDeletions(
  client: PublicClient,
  address: Address,
  count: number,
): Promise<Deletion[]> {
  return multi<Deletion>(
    client,
    Array.from({ length: count }, (_, i) => ({ address, abi, functionName: "deletion", args: [i + 1] })),
  );
}

export async function readPublisherLog(
  client: PublicClient,
  address: Address,
  count: number,
): Promise<{ log: PublisherChange[]; current: Map<Address, boolean> }> {
  const log = await multi<PublisherChange>(
    client,
    Array.from({ length: count }, (_, i) => ({
      address,
      abi,
      functionName: "publisherChangeAt",
      args: [BigInt(i)],
    })),
  );
  const keys = [...new Set(log.map((c) => c.publisher))];
  const flags = await multi<boolean>(
    client,
    keys.map((k) => ({ address, abi, functionName: "isPublisher", args: [k] })),
  );
  return { log, current: new Map(keys.map((k, i) => [k, flags[i]!])) };
}

export async function readOwnerLog(
  client: PublicClient,
  address: Address,
  count: number,
): Promise<OwnerRecord[]> {
  return multi<OwnerRecord>(
    client,
    Array.from({ length: count }, (_, i) => ({ address, abi, functionName: "ownerAt", args: [BigInt(i)] })),
  );
}

export interface IndexedVersion extends Version {
  subjectId: Hex;
  recordType: Hex;
}

/**
 * Every version of every subject, from state. A release's records are the versions whose
 * sequence falls in its range; no read function lists them directly, so the app reads the whole
 * registry. That costs one call per 50 versions of each subject, batched through Multicall3.
 */
export async function readAllVersions(
  client: PublicClient,
  address: Address,
  subjectCount: number,
  onProgress?: (done: number, total: number) => void,
): Promise<IndexedVersion[]> {
  const ids: Hex[] = [];
  for (let off = 0; off < subjectCount; off += 500) {
    const page = (await client.readContract({
      address,
      abi,
      functionName: "subjects",
      args: [BigInt(off), 500n],
    })) as readonly Hex[];
    ids.push(...page);
  }
  const out: IndexedVersion[] = [];
  const step = 100;
  for (let i = 0; i < ids.length; i += step) {
    const chunk = ids.slice(i, i + step);
    const subjects = await multi<Subject>(
      client,
      chunk.map((id) => ({ address, abi, functionName: "subject", args: [id] })),
    );
    const calls: { address: Address; abi: typeof abi; functionName: string; args: readonly unknown[] }[] = [];
    const owners: { id: Hex; recordType: Hex }[] = [];
    chunk.forEach((id, k) => {
      const s = subjects[k]!;
      for (let from = 1; from <= s.versionCount; from += 50) {
        calls.push({ address, abi, functionName: "getVersions", args: [id, from, 50] });
        owners.push({ id, recordType: s.recordType });
      }
    });
    const pages = await multi<readonly Version[]>(client, calls);
    pages.forEach((page, k) => {
      for (const v of page) out.push({ ...v, subjectId: owners[k]!.id, recordType: owners[k]!.recordType });
    });
    onProgress?.(Math.min(i + step, ids.length), ids.length);
  }
  out.sort((a, b) => a.sequence - b.sequence);
  return out;
}

export async function readSchemaDocument(
  client: PublicClient,
  address: Address,
  schemaId: Hex,
): Promise<Hex> {
  return (await client.readContract({
    address,
    abi,
    functionName: "schemaDocument",
    args: [schemaId],
  })) as Hex;
}
