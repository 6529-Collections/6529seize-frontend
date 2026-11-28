// Copied from 6529-Collections/6529-provenance-app src/reconcile.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
import { bytesToHex, type Address, type Hex, type PublicClient } from "viem";
import { provenanceRegistryAbi as abi } from "./abi/provenanceRegistry";
import { rc2GetReleaseAbi } from "./abi/legacy";
import { parseCid } from "./cid";
import { decodeUtf8Strict, parseStrictJson, type JsonValue } from "./jcs";
import { readBuild, releaseHasSealedBy, type Version } from "./registry";
import { verifyBytes, type VerifyResult } from "./verify";

/**
 * Release-manifest reconciliation. Sealing a release checks only its record count (contract rule
 * REL-6), so a sealed release says how many records it holds, not which. A release manifest lists
 * them; reconciling the manifest with the chain shows that the release holds exactly those records.
 *
 * The manifest format, version 1, is a JSON object hashed and located by the release header:
 *
 * - `kind`: "6529-provenance release manifest v1";
 * - `records`: one row per record of the release, in sequence order, so row i (from 0) is the
 *   record at sequence `firstSequence + i`. A row has `subject_id` (32 bytes of hex) and `digest`
 *   (the version's content-hash digest, 32 bytes of hex), and may have `version` (the subject's
 *   version number), `cid` (text or hex) and other fields, such as `local_id` and `record_type`,
 *   that reconciliation does not read.
 *
 * The Sepolia Museum profile registry's release 1 manifest has this form.
 */
export const RELEASE_MANIFEST_KIND = "6529-provenance release manifest v1";

export interface ReconcileRow {
  index: number;
  /** The sequence the row names: the release's first sequence plus the row's index. */
  sequence: number;
  subjectId: Hex | undefined;
  /** The version found at that sequence, when one was. */
  version?: number | undefined;
  /** True when that version has been deleted. Its digest stays in state, so it still reconciles. */
  deleted?: boolean | undefined;
  ok: boolean;
  problem?: string | undefined;
}

export interface Reconciliation {
  releaseId: number;
  block: bigint;
  /** From the chain: the release is sealed and takes no more records. */
  sealed: boolean;
  firstSequence: number;
  recordCount: number;
  /** The manifest bytes checked against the release header's manifest hash and CID. */
  manifest: VerifyResult;
  /**
   * True when the manifest verifies and its rows are exactly the release's records: one row per
   * record, each naming the subject, digest and, where given, the version and CID at its sequence.
   * A screen says a release "holds its manifest" only when `sealed` and `reconciled` are both true.
   */
  reconciled: boolean;
  rows: ReconcileRow[];
  problems: string[];
}

type Release = {
  isSealed: boolean;
  firstSequence: number;
  recordCount: number;
  manifestCid: Hex;
  manifestHash: { algorithm: number; digest: Hex; canonicalizationId: Hex };
};

const HEX32 = /^0x[0-9a-fA-F]{64}$/;
const CHUNK = 100;

async function multi<T>(
  client: PublicClient,
  calls: { address: Address; abi: typeof abi; functionName: string; args: readonly unknown[] }[],
  blockNumber: bigint,
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < calls.length; i += CHUNK) {
    const res = await client.multicall({
      contracts: calls.slice(i, i + CHUNK) as never,
      allowFailure: false,
      batchSize: 0,
      blockNumber,
    });
    out.push(...(res as T[]));
  }
  return out;
}

function rowsOf(value: JsonValue): { rows: JsonValue[] } | { problem: string } {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { problem: "The manifest is not a JSON object." };
  if (value["kind"] !== RELEASE_MANIFEST_KIND)
    return {
      problem: `The manifest's kind is ${JSON.stringify(value["kind"])}, not "${RELEASE_MANIFEST_KIND}".`,
    };
  const records = value["records"];
  if (!Array.isArray(records)) return { problem: "The manifest has no records array." };
  return { rows: records };
}

/**
 * Reconciles release `releaseId` with its manifest, all at one block: `blockNumber`, or the latest
 * block when the check starts. It checks the manifest bytes against the release header, then each
 * row against the version at the row's sequence. It sends nothing; reads only.
 */
export async function reconcileRelease(
  client: PublicClient,
  registry: Address,
  releaseId: number,
  manifestBytes: Uint8Array,
  blockNumber?: bigint,
): Promise<Reconciliation> {
  const block = blockNumber ?? (await client.getBlockNumber({ cacheTime: 0 }));
  const withSealedBy = releaseHasSealedBy(await readBuild(client, registry, block));
  const release = (await client.readContract({
    address: registry,
    abi: withSealedBy ? abi : rc2GetReleaseAbi,
    functionName: "getRelease",
    args: [releaseId],
    blockNumber: block,
  })) as Release;
  const canon = (await client.readContract({
    address: registry,
    abi,
    functionName: "canonicalization",
    args: [release.manifestHash.canonicalizationId],
    blockNumber: block,
  })) as { literal: string };
  const manifest = verifyBytes(manifestBytes, {
    algorithm: release.manifestHash.algorithm,
    digest: release.manifestHash.digest,
    canonicalizationLiteral: canon.literal,
    cid: release.manifestCid,
  });
  const base = {
    releaseId,
    block,
    sealed: release.isSealed,
    firstSequence: release.firstSequence,
    recordCount: release.recordCount,
    manifest,
  };
  const problems: string[] = [];
  if (!manifest.verified)
    problems.push(`The manifest bytes do not verify against the release header: ${manifest.verdict}.`);

  let parsed: ReturnType<typeof rowsOf>;
  try {
    parsed = rowsOf(parseStrictJson(decodeUtf8Strict(manifestBytes)));
  } catch (e) {
    parsed = { problem: `The manifest is not I-JSON: ${(e as Error).message}` };
  }
  if ("problem" in parsed)
    return { ...base, reconciled: false, rows: [], problems: [...problems, parsed.problem] };
  const raw = parsed.rows;
  if (raw.length !== release.recordCount)
    problems.push(`The manifest lists ${raw.length} records; the release holds ${release.recordCount}.`);

  // The versions of the release, found per subject the manifest names. A subject's versions are
  // in sequence order and a release's sequences are contiguous, so its versions in this release
  // are one run. A subject of up to 50 versions is read in one call; for a longer one, a binary
  // search finds the first version at or after the release's first sequence, and the run is read
  // from there. The calls per subject stay bounded by the log of its history plus the release's
  // records, whatever its version count.
  const ids = [
    ...new Set(
      raw
        .map((r) => (r && typeof r === "object" && !Array.isArray(r) ? r["subject_id"] : undefined))
        .filter((v): v is string => typeof v === "string" && HEX32.test(v))
        .map((v) => v.toLowerCase()),
    ),
  ] as Hex[];
  const lastSequence = release.firstSequence + release.recordCount - 1;
  const subjects = await multi<{ versionCount: number }>(
    client,
    ids.map((id) => ({ address: registry, abi, functionName: "subject", args: [id] })),
    block,
  );
  const bySequence = new Map<number, { subjectId: Hex; v: Version }>();
  const keep = (subjectId: Hex, versions: readonly Version[]) => {
    for (const v of versions)
      if (v.sequence >= release.firstSequence && v.sequence <= lastSequence)
        bySequence.set(v.sequence, { subjectId, v });
  };
  const small = ids.filter((_, k) => subjects[k]!.versionCount <= 50);
  const pages = await multi<readonly Version[]>(
    client,
    small.map((id) => ({ address: registry, abi, functionName: "getVersions", args: [id, 1, 50] })),
    block,
  );
  small.forEach((id, k) => keep(id, pages[k]!));
  const getVersion = async (id: Hex, n: number) =>
    (await client.readContract({
      address: registry,
      abi,
      functionName: "getVersion",
      args: [id, n],
      blockNumber: block,
    })) as Version;
  for (const [k, id] of ids.entries()) {
    const count = subjects[k]!.versionCount;
    if (count <= 50) continue;
    let lo = 1;
    let hi = count + 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if ((await getVersion(id, mid)).sequence < release.firstSequence) lo = mid + 1;
      else hi = mid;
    }
    for (let from = lo; from <= count; from += 50) {
      const page = (await client.readContract({
        address: registry,
        abi,
        functionName: "getVersions",
        args: [id, from, 50],
        blockNumber: block,
      })) as readonly Version[];
      keep(id, page);
      if (page.length === 0 || page.at(-1)!.sequence >= lastSequence) break;
    }
  }

  const rows: ReconcileRow[] = raw.map((r, index) => {
    const sequence = release.firstSequence + index;
    const fail = (problem: string, extra: Partial<ReconcileRow> = {}): ReconcileRow => ({
      index,
      sequence,
      subjectId: undefined,
      ok: false,
      problem,
      ...extra,
    });
    if (!r || typeof r !== "object" || Array.isArray(r)) return fail("The row is not a JSON object.");
    const subjectId = typeof r["subject_id"] === "string" ? r["subject_id"].toLowerCase() : undefined;
    const digest = typeof r["digest"] === "string" ? r["digest"].toLowerCase() : undefined;
    if (!subjectId || !HEX32.test(subjectId)) return fail("subject_id is not 32 bytes of hex.");
    if (!digest || !HEX32.test(digest))
      return fail("digest is not 32 bytes of hex.", { subjectId: subjectId as Hex });
    const hit = bySequence.get(sequence);
    const at = { subjectId: subjectId as Hex };
    if (!hit || hit.subjectId.toLowerCase() !== subjectId)
      return fail(`The subject has no version at sequence ${sequence}.`, at);
    const v = hit.v;
    const found = { ...at, version: v.version, deleted: v.deleted };
    if (v.releaseId !== releaseId)
      return fail(`The version at sequence ${sequence} belongs to release ${v.releaseId}.`, found);
    if (v.contentHash.digest.toLowerCase() !== digest)
      return fail(`The digest at sequence ${sequence} is ${v.contentHash.digest}, not ${digest}.`, found);
    if (r["version"] !== undefined && r["version"] !== v.version)
      return fail(
        `The row says version ${String(r["version"])}; sequence ${sequence} holds version ${v.version}.`,
        found,
      );
    if (typeof r["cid"] === "string" && !v.deleted) {
      let cid: Hex;
      try {
        cid = bytesToHex(parseCid(r["cid"]));
      } catch (e) {
        return fail(`The row's CID does not parse: ${(e as Error).message}`, found);
      }
      if (cid.toLowerCase() !== v.cid.toLowerCase())
        return fail(`The row's CID is not the CID at sequence ${sequence}.`, found);
    }
    return { index, sequence, ...found, ok: true };
  });
  const badRows = rows.filter((r) => !r.ok).length;
  if (badRows) problems.push(`${badRows} of ${rows.length} rows do not match the chain.`);
  return { ...base, reconciled: problems.length === 0, rows, problems };
}
