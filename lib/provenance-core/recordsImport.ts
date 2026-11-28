// Copied from 6529-Collections/6529-provenance-app src/recordsImport.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
import { bytesToHex, isHex, keccak256, toHex, type Hex } from "viem";
import type { RecordInput } from "./actions";
import { literalId } from "./actions";
import {
  arweaveIdFromString,
  cidProblem,
  cidV0ToV1,
  decodeCidBytes,
  parseCid,
  unixfsFileCidV1,
  UNIXFS_MAX_FILE_BYTES,
  ZERO32,
} from "./cid";
import { canonicalize, canonicalizationKind, hashBytes } from "./verify";

/**
 * A record as a release file lists it.
 *
 * - `subjectId` is exactly 32 bytes of hex. `subject` is the text a subject ID is the keccak256 of.
 *   Give one, or both when they agree; a row whose two forms disagree is refused, so a mistyped ID
 *   never becomes another subject.
 * - `recordType`, `schema` and `canonicalization` are literals ("PUBLIC_ENTITY") or 32 bytes of hex;
 *   a value that starts with "0x" must be the full 32 bytes.
 * - `effectiveAt` is Unix seconds, as a positive integer or a string of digits, or an RFC 3339
 *   date-time with a time zone ("2026-11-23T00:00:00Z", "2026-11-23T09:00:00+09:00"). A date-time
 *   without a zone is refused, because two importers could read it in two zones.
 * - A CID is text or hex. A CIDv0 ("Qm...") is converted to its CIDv1, which the registry takes.
 * - expectedVersion may be left out: the package then reads each subject's version count from the
 *   registry when it builds the batch.
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
  expectedVersion?: number | undefined;
}

export interface ParsedRecord {
  input: Omit<RecordInput, "expectedVersion"> & { expectedVersion?: number | undefined };
  row: number;
}

const HEX32 = /^0x[0-9a-fA-F]{64}$/;

const idOf = (v: string | undefined, what: string, row: number): Hex => {
  if (!v) throw new Error(`Row ${row}: ${what} is missing.`);
  if (HEX32.test(v)) return v as Hex;
  if (/^0x/i.test(v))
    throw new Error(`Row ${row}: ${what} "${v}" starts with 0x but is not 32 bytes of hex.`);
  if (/^[\x21-\x7e]{1,128}$/.test(v)) return literalId(v);
  throw new Error(`Row ${row}: ${what} "${v}" is neither a 32-byte hex ID nor a literal.`);
};

// RFC 3339 date-time with a required zone: Z or a numeric offset.
const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/;

// Date.parse rolls an impossible date over (2026-02-30 becomes 2 March), so each field is checked.
function calendarProblem(m: RegExpExecArray): boolean {
  const [year, month, day, hour, minute, second] = [1, 2, 3, 4, 5, 6].map((k) => Number(m[k]));
  const daysInMonth = new Date(Date.UTC(year!, month!, 0)).getUTCDate();
  const offsetBad = m[9] !== undefined && (Number(m[9]) > 23 || Number(m[10]) > 59);
  return (
    month! < 1 ||
    month! > 12 ||
    day! < 1 ||
    day! > daysInMonth ||
    hour! > 23 ||
    minute! > 59 ||
    second! > 59 ||
    offsetBad
  );
}

function effectiveSeconds(v: unknown, row: number): bigint {
  const bad = () =>
    new Error(
      `Row ${row}: effectiveAt ${JSON.stringify(v)} is neither Unix seconds nor an RFC 3339 date-time with a time zone.`,
    );
  let seconds: bigint;
  if (typeof v === "number") {
    if (!Number.isSafeInteger(v)) throw bad();
    seconds = BigInt(v);
  } else if (typeof v === "string" && /^\d+$/.test(v)) {
    seconds = BigInt(v);
  } else if (typeof v === "string" && DATE_TIME.test(v)) {
    if (calendarProblem(DATE_TIME.exec(v)!))
      throw new Error(`Row ${row}: effectiveAt ${JSON.stringify(v)} is not a date and time that exists.`);
    const ms = Date.parse(v);
    if (!Number.isFinite(ms)) throw bad();
    seconds = BigInt(Math.floor(ms / 1000));
  } else {
    throw bad();
  }
  if (seconds <= 0n || seconds >= 2n ** 64n)
    throw new Error(`Row ${row}: effectiveAt is ${seconds}; the registry takes 1 to 2^64 - 1 Unix seconds.`);
  return seconds;
}

function subjectIdOf(r: RecordRow, row: number): Hex {
  if (r.subjectId === undefined && r.subject === undefined)
    throw new Error(
      `Row ${row}: give subjectId (32 bytes of hex), or subject (the text its ID is the keccak256 of).`,
    );
  let fromId: Hex | undefined;
  if (r.subjectId !== undefined) {
    if (typeof r.subjectId !== "string" || !HEX32.test(r.subjectId))
      throw new Error(`Row ${row}: subjectId ${JSON.stringify(r.subjectId)} is not 32 bytes of hex.`);
    fromId = r.subjectId.toLowerCase() as Hex;
  }
  let fromText: Hex | undefined;
  if (r.subject !== undefined) {
    if (typeof r.subject !== "string" || r.subject === "")
      throw new Error(`Row ${row}: subject is the non-empty text a subject ID is the keccak256 of.`);
    fromText = keccak256(toHex(utf8.encode(r.subject)));
  }
  if (fromId && fromText && fromId !== fromText)
    throw new Error(
      `Row ${row}: subjectId ${fromId} is not the keccak256 of subject ${JSON.stringify(r.subject)}, which is ${fromText}.`,
    );
  return (fromId ?? fromText)!;
}

const utf8 = new TextEncoder();

export function parseRecordRows(text: string): ParsedRecord[] {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(`The records file is not JSON: ${(e as Error).message}`, { cause: e });
  }
  const rows = Array.isArray(json) ? json : (json as { records?: unknown })?.records;
  if (!Array.isArray(rows))
    throw new Error('The records file is a JSON array, or an object with a "records" array.');
  return rows.map((raw, i) => {
    const row = i + 1;
    const r = raw as RecordRow;
    const subjectId = subjectIdOf(r, row);
    if (subjectId.toLowerCase() === ZERO32) throw new Error(`Row ${row}: the subject ID is zero.`);
    if (r.algorithm !== 1 && r.algorithm !== 2)
      throw new Error(`Row ${row}: algorithm is 1 (Keccak-256) or 2 (SHA-256).`);
    if (!(isHex(r.digest) && r.digest.length === 66))
      throw new Error(`Row ${row}: digest is 32 bytes of hex.`);
    const effectiveAt = effectiveSeconds(r.effectiveAt, row);
    let cid: Hex = "0x";
    if (r.cid) {
      let bytes: Uint8Array;
      try {
        bytes = parseCid(r.cid);
        if (decodeCidBytes(bytes).version === 0) bytes = cidV0ToV1(bytes);
      } catch (e) {
        throw new Error(`Row ${row}: ${(e as Error).message}`, { cause: e });
      }
      const problem = cidProblem(bytes);
      if (problem) throw new Error(`Row ${row}: ${problem}`);
      cid = bytesToHex(bytes);
    }
    if (r.arweaveId && /^0x/i.test(r.arweaveId) && !HEX32.test(r.arweaveId))
      throw new Error(`Row ${row}: the Arweave ID ${r.arweaveId} is not 32 bytes.`);
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
  pointer?: string | undefined;
}

export interface FileRecord {
  name: string;
  input: Omit<RecordInput, "expectedVersion">;
  /**
   * The canonical bytes the record commits to. Pin exactly these bytes, with the UnixFS settings of
   * `unixfsFileCidV1`, so the pinned CID equals `input.cid`.
   */
  canonical: Uint8Array;
  /** The length of `canonical`. */
  canonicalLength: number;
}

/**
 * Builds a record from a file's bytes: canonical form, digest, CIDv1 and subject ID. The CID is the
 * one IPFS gives the canonical bytes with the settings `unixfsFileCidV1` documents: a raw block up
 * to 1 MiB, a dag-pb root over 1 MiB raw leaves above it. Throws for a canonicalization the package
 * does not know, since it cannot say what bytes to commit to, and for a file over
 * `UNIXFS_MAX_FILE_BYTES`.
 */
export function recordFromFile(name: string, bytes: Uint8Array, o: FileRecordOptions): FileRecord {
  const kind = canonicalizationKind(o.canonicalization);
  if (kind === "unknown")
    throw new Error(`${name}: the package does not know the canonicalization ${o.canonicalization}.`);
  const canonical = canonicalize(kind, bytes, o.pointer ?? "");
  if (canonical.bytes.length > UNIXFS_MAX_FILE_BYTES)
    throw new Error(
      `${name}: ${canonical.bytes.length} bytes is over the ${UNIXFS_MAX_FILE_BYTES} this package can address with one UnixFS root.`,
    );
  const digest = hashBytes(o.algorithm, canonical.bytes);
  let label = "";
  if (o.label === "name") label = name;
  if (o.label === "heading") {
    const m = /^#{1,6}\s+(.+?)\s*#*\s*$/m.exec(new TextDecoder().decode(canonical.bytes));
    label = m?.[1] ?? name;
  }
  // Drops whole code points, so a surrogate pair is never split.
  const points = Array.from(label);
  while (utf8.encode(points.join("")).length > 128) points.pop();
  label = points.join("");
  return {
    name,
    canonical: canonical.bytes,
    canonicalLength: canonical.bytes.length,
    input: {
      subjectId: keccak256(toHex(utf8.encode(o.subjectTemplate.replaceAll("{name}", name)))),
      recordType: literalId(o.recordType),
      schemaId: literalId(o.schema),
      contentHash: { algorithm: o.algorithm, digest, canonicalizationId: literalId(o.canonicalization) },
      effectiveAt: o.effectiveAt,
      cid: bytesToHex(unixfsFileCidV1(canonical.bytes)),
      arweaveId: ZERO32,
      label,
    },
  };
}
