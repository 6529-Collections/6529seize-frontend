import { keccak256, toBytes, zeroHash, type Address, type Hex } from "viem";
import { HASH_ALGORITHM_KECCAK256, ONCHAIN_MUSEUM_SOURCE } from "./constants";
import type { CidFetcher } from "./ipfs";
import type {
  RegistryRelease,
  RegistrySchema,
  RegistrySnapshot,
  RegistrySubject,
} from "./registry";

/**
 * Test fixtures: a registry snapshot built from the release's own record
 * list and payloads, as a conforming registry would return it. The route
 * reads them only when the server is started with a fixture root for a
 * Playwright run; unit tests build them directly.
 */
export interface ProfileFixtureRecord {
  readonly local_id: string;
  readonly record_type: string;
  readonly schema: string;
  readonly subjectId: Hex;
  readonly contentHash: Hex;
  readonly canonicalization: string;
  readonly rawCid: Hex;
  readonly effectiveAt: number;
  readonly label: string;
}

export interface ProfileFixture {
  /** CAIP-10 ID of the registry the payloads were built for. */
  readonly registry: string;
  readonly rootCidHex?: Hex | null | undefined;
  readonly records: readonly ProfileFixtureRecord[];
}

function idOf(literal: string): Hex {
  return keccak256(toBytes(literal));
}

/** The address in a CAIP-10 account ID such as `eip155:11155111:0x…`. */
function addressOf(caip10: string): Address {
  const address = caip10.split(":").at(-1) ?? "";
  if (!/^0x[0-9a-fA-F]{40}$/u.test(address)) {
    throw new Error("fixture_registry_invalid");
  }
  return address as Address;
}

/** One sealed release holding every fixture record, in list order. */
export function fixtureRegistrySnapshot(
  fixture: ProfileFixture
): RegistrySnapshot {
  const { owner, build, chainId } = ONCHAIN_MUSEUM_SOURCE;
  const publishedAt = Math.max(
    ...fixture.records.map((record) => record.effectiveAt)
  );
  const recordTypes: Record<Hex, string> = {};
  const canonicalizations: Record<Hex, string> = {};
  const schemas: Record<Hex, RegistrySchema> = {};
  const subjects: RegistrySubject[] = fixture.records.map((record, index) => {
    const recordTypeId = idOf(record.record_type);
    const canonicalizationId = idOf(record.canonicalization);
    const schemaId = idOf(record.schema);
    recordTypes[recordTypeId] = record.record_type;
    canonicalizations[canonicalizationId] = record.canonicalization;
    schemas[schemaId] = {
      schemaId,
      literal: record.schema,
      documentHash: {
        algorithm: HASH_ALGORITHM_KECCAK256,
        digest: zeroHash,
        canonicalizationId: zeroHash,
      },
      cid: "0x",
      documentLength: 0,
    };
    return {
      subjectId: record.subjectId,
      recordType: recordTypeId,
      versionCount: 1,
      liveVersionCount: 1,
      deleted: false,
      deletionId: 0,
      version: {
        version: 1,
        sequence: index + 1,
        releaseId: 1,
        schemaId,
        contentHash: {
          algorithm: HASH_ALGORITHM_KECCAK256,
          digest: record.contentHash,
          canonicalizationId,
        },
        effectiveAt: record.effectiveAt,
        publishedAt,
        publisher: owner,
        deleted: false,
        deletionId: 0,
        cid: record.rawCid,
        arweaveId: zeroHash,
        label: record.label,
      },
    };
  });
  const release: RegistryRelease = {
    releaseId: 1,
    isSealed: true,
    openedAt: publishedAt,
    sealedAt: publishedAt,
    firstSequence: 1,
    recordCount: subjects.length,
    openedBy: owner,
    manifestCid: "0x",
    manifestHash: {
      algorithm: 0,
      digest: zeroHash,
      canonicalizationId: zeroHash,
    },
    rootCid: fixture.rootCidHex ?? "0x",
    sourceCommit: `0x${"00".repeat(20)}`,
    label: "",
  };
  return {
    registry: addressOf(fixture.registry),
    blockNumber: 0,
    blockTimestamp: publishedAt,
    checks: {
      chainId,
      codeHash: build.runtimeCodeHash,
      codeHashMatches: true,
      supportsRegistryInterface: true,
      erc165Conforms: true,
      owner,
      ownerMatches: true,
      frozen: false,
      successor: `0x${"00".repeat(20)}`,
    },
    releases: [release],
    recordTypes,
    canonicalizations,
    schemas,
    deletions: [],
    subjects,
    rpc: { httpRequests: 0, ethCalls: 0 },
  };
}

/**
 * Serves fixture payloads by their raw CID and passes every other CID (texts,
 * the file index, manifests) to `fallback`. The bytes are still checked by
 * the caller, as any gateway's are.
 */
export function fixtureCidFetcher(
  payloads: ReadonlyMap<string, Uint8Array>,
  fallback: CidFetcher
): CidFetcher {
  return async (cid, accept) => {
    const bytes = payloads.get(cid.toLowerCase());
    if (bytes === undefined) return fallback(cid, accept);
    return {
      bytes,
      host: "fixture",
      accepted: accept === undefined || accept(bytes),
    };
  };
}
