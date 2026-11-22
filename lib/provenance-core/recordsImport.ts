// Copied from 6529-Collections/6529-provenance-app src/recordsImport.ts at commit 117e850026f6e1d754e76a687e526f51cceca4a0.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
import { bytesToHex, isHex, keccak256, toHex, type Hex } from "viem";
import type { RecordInput } from "./actions";
import { literalId } from "./actions";
import { arweaveIdFromString, decodeCidBytes, parseCid, rawCidV1, ZERO32 } from "./cid";
import { canonicalize, canonicalizationKind, hashBytes } from "./verify";

/**
 * A record as a release file lists it. IDs can be given as literals ("PUBLIC_ENTITY") or as
 * 32-byte hex; a subject as hex or as the text its ID is the keccak256 of; a CID as text or hex.
 * expectedVersion may be left out: the app then reads each subject's version count from the
 * registry when it builds the batch.
 */
export interface RecordRow {
  subjectId?: string;
  subject?: string;
  recordType: string;
  schema?: string;
  schemaId?: string;
  algorithm: number;
  digest: string;
  canonicalization?: string;
  canonicalizationId?: string;
  effectiveAt: number | string;
  cid?: string;
  arweaveId?: string;
  label?: string;
  expectedVersion?: number;
}

export interface ParsedRecord {
  input: Omit<RecordInput, "expectedVersion"> & { expectedVersion?: number };
  row: number;
}

const idOf = (v: string | undefined, what: string, row: number): Hex => {
  if (!v) throw new Error(`Row ${row}: ${what} is missing.`);
  if (isHex(v) && v.length === 66) return v as Hex;
  if (/^[\x21-\x7e]{1,128}$/.test(v)) return literalId(v);
  throw new Error(`Row ${row}: ${what} "${v}" is neither a 32-byte hex ID nor a literal.`);
};

const utf8 = new TextEncoder();

export function parseRecordRows(text: string): ParsedRecord[] {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(`The records file is not JSON: ${(e as Error).message}`);
  }
  const rows = Array.isArray(json) ? json : (json as { records?: unknown })?.records;
  if (!Array.isArray(rows))
    throw new Error('The records file is a JSON array, or an object with a "records" array.');
  return rows.map((raw, i) => {
    const row = i + 1;
    const r = raw as RecordRow;
    const subjectId = r.subjectId
      ? idOf(r.subjectId, "subjectId", row)
      : r.subject
        ? keccak256(toHex(utf8.encode(r.subject)))
        : (() => {
            throw new Error(`Row ${row}: give subjectId, or subject (the text its ID is the keccak256 of).`);
          })();
    if (r.algorithm !== 1 && r.algorithm !== 2)
      throw new Error(`Row ${row}: algorithm is 1 (Keccak-256) or 2 (SHA-256).`);
    if (!(isHex(r.digest) && r.digest.length === 66))
      throw new Error(`Row ${row}: digest is 32 bytes of hex.`);
    const effectiveAt = BigInt(
      typeof r.effectiveAt === "string" && !/^\d+$/.test(r.effectiveAt)
        ? Math.floor(Date.parse(r.effectiveAt) / 1000)
        : r.effectiveAt,
    );
    if (effectiveAt <= 0n)
      throw new Error(`Row ${row}: effectiveAt is Unix seconds or an ISO date, after 1970.`);
    let cid: Hex = "0x";
    if (r.cid) {
      cid = bytesToHex(parseCid(r.cid));
      decodeCidBytes(cid);
    }
    const arweaveId: Hex = r.arweaveId
      ? isHex(r.arweaveId)
        ? (r.arweaveId as Hex)
        : arweaveIdFromString(r.arweaveId)
      : ZERO32;
    if (cid === "0x" && arweaveId === ZERO32)
      throw new Error(`Row ${row}: a record needs a CID or an Arweave ID.`);
    const label = r.label ?? "";
    if (utf8.encode(label).length > 128) throw new Error(`Row ${row}: the label is over 128 bytes.`);
    return {
      row,
      input: {
        subjectId,
        recordType: idOf(r.recordType, "recordType", row),
        schemaId: idOf(r.schemaId ?? r.schema, "schema", row),
        contentHash: {
          algorithm: r.algorithm,
          digest: r.digest as Hex,
          canonicalizationId: idOf(r.canonicalizationId ?? r.canonicalization, "canonicalization", row),
        },
        effectiveAt,
        cid,
        arweaveId,
        label,
        expectedVersion: r.expectedVersion,
      },
    };
  });
}

/**
 * Fills in expectedVersion from the registry's version counts. A subject listed twice gets
 * consecutive values, so its versions publish in order within the release.
 */
export function assignExpectedVersions(
  records: ParsedRecord[],
  versionCounts: Map<string, number>,
): RecordInput[] {
  const next = new Map(versionCounts);
  return records.map(({ input }) => {
    const key = input.subjectId.toLowerCase();
    const current = next.get(key) ?? 0;
    const expectedVersion = input.expectedVersion ?? current;
    next.set(key, expectedVersion + 1);
    return { ...input, expectedVersion };
  });
}

export interface FileRecordOptions {
  recordType: string;
  schema: string;
  canonicalization: string;
  algorithm: 1 | 2;
  /** The text a subject ID is the keccak256 of, with {name} replaced by the file name. */
  subjectTemplate: string;
  effectiveAt: bigint;
  /** "name" uses the file name; "heading" uses a Markdown file's first heading, else the name. */
  label: "name" | "heading" | "none";
  pointer?: string;
}

export interface FileRecord {
  name: string;
  input: Omit<RecordInput, "expectedVersion">;
  canonicalBytes: number;
}

/** Builds a record from a file's bytes: canonical form, digest, raw CIDv1 and subject ID. */
export function recordFromFile(name: string, bytes: Uint8Array, o: FileRecordOptions): FileRecord {
  const kind = canonicalizationKind(o.canonicalization);
  const canonical = canonicalize(kind, bytes, o.pointer ?? "");
  const digest = hashBytes(o.algorithm, canonical.bytes);
  let label = "";
  if (o.label === "name") label = name;
  if (o.label === "heading") {
    const m = /^#{1,6}\s+(.+?)\s*#*\s*$/m.exec(new TextDecoder().decode(canonical.bytes));
    label = m?.[1] ?? name;
  }
  while (utf8.encode(label).length > 128) label = label.slice(0, -1);
  return {
    name,
    canonicalBytes: canonical.bytes.length,
    input: {
      subjectId: keccak256(toHex(utf8.encode(o.subjectTemplate.replaceAll("{name}", name)))),
      recordType: literalId(o.recordType),
      schemaId: literalId(o.schema),
      contentHash: { algorithm: o.algorithm, digest, canonicalizationId: literalId(o.canonicalization) },
      effectiveAt: o.effectiveAt,
      cid: bytesToHex(rawCidV1(canonical.bytes)),
      arweaveId: ZERO32,
      label,
    },
  };
}
