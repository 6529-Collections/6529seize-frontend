// Copied from 6529-Collections/6529-provenance-app src/actions.ts at commit 906377e17438133e8a61f154edf9c6a5792b9f3f.
// Do not edit here: change the package and run ops/scripts/sync-provenance-core.mjs.
// Replaced by @6529-collections/provenance-core from npm once that is published.
// SPDX-License-Identifier: Apache-2.0
import {
  decodeFunctionData,
  encodeFunctionData,
  isAddress,
  isHex,
  keccak256,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { provenanceRegistryAbi as abi } from "./abi/provenanceRegistry";
import { cidProblem } from "./cid";

export interface HashRefInput {
  algorithm: number;
  digest: Hex;
  canonicalizationId: Hex;
}

export interface RecordInput {
  subjectId: Hex;
  recordType: Hex;
  schemaId: Hex;
  contentHash: HashRefInput;
  effectiveAt: bigint;
  cid: Hex;
  arweaveId: Hex;
  label: string;
  expectedVersion: number;
}

export interface ReleaseInput {
  manifestCid: Hex;
  manifestHash: HashRefInput;
  rootCid: Hex;
  arweaveId: Hex;
  sourceCommit: Hex;
  label: string;
}

/**
 * One call to the registry. A Safe transaction is a list of actions sent through
 * MultiSendCallOnly; a publisher key sends each action as its own transaction.
 */
export type Action =
  | { kind: "registerCanonicalization"; literal: string; specCid: Hex }
  | { kind: "registerRecordType"; literal: string }
  | { kind: "registerSchema"; literal: string; documentHash: HashRefInput; cid: Hex; document: Hex }
  | { kind: "openRelease"; header: ReleaseInput }
  | { kind: "publish"; releaseId: number; records: RecordInput[] }
  | { kind: "sealRelease"; releaseId: number; expectedRecordCount: number }
  | { kind: "deleteVersion"; subjectId: Hex; version: number; reasonDigest: Hex }
  | { kind: "deleteVersions"; subjectId: Hex; fromVersion: number; toVersion: number; reasonDigest: Hex }
  | { kind: "deleteSubject"; subjectId: Hex; reasonDigest: Hex }
  | { kind: "setPublisher"; publisher: Address; authorized: boolean }
  | { kind: "transferOwnership"; newOwner: Address }
  | { kind: "acceptOwnership" }
  | { kind: "freeze" }
  | { kind: "declareSuccessor"; successor: Address };

export type ActionKind = Action["kind"];

/** Calls a publisher key may make. Every other call needs the owner. */
export const PUBLISHER_ACTIONS: ReadonlySet<ActionKind> = new Set(["openRelease", "publish", "sealRelease"]);

export function requiresOwner(a: Action): boolean {
  return !PUBLISHER_ACTIONS.has(a.kind) && a.kind !== "acceptOwnership";
}

export interface Call {
  to: Address;
  value: bigint;
  data: Hex;
}

export function encodeAction(a: Action): Hex {
  switch (a.kind) {
    case "registerCanonicalization":
      return encodeFunctionData({
        abi,
        functionName: "registerCanonicalization",
        args: [a.literal, a.specCid],
      });
    case "registerRecordType":
      return encodeFunctionData({ abi, functionName: "registerRecordType", args: [a.literal] });
    case "registerSchema":
      return encodeFunctionData({
        abi,
        functionName: "registerSchema",
        args: [a.literal, a.documentHash, a.cid, a.document],
      });
    case "openRelease":
      return encodeFunctionData({ abi, functionName: "openRelease", args: [a.header] });
    case "publish":
      return encodeFunctionData({ abi, functionName: "publish", args: [a.releaseId, a.records] });
    case "sealRelease":
      return encodeFunctionData({
        abi,
        functionName: "sealRelease",
        args: [a.releaseId, a.expectedRecordCount],
      });
    case "deleteVersion":
      return encodeFunctionData({
        abi,
        functionName: "deleteVersion",
        args: [a.subjectId, a.version, a.reasonDigest],
      });
    case "deleteVersions":
      return encodeFunctionData({
        abi,
        functionName: "deleteVersions",
        args: [a.subjectId, a.fromVersion, a.toVersion, a.reasonDigest],
      });
    case "deleteSubject":
      return encodeFunctionData({ abi, functionName: "deleteSubject", args: [a.subjectId, a.reasonDigest] });
    case "setPublisher":
      return encodeFunctionData({ abi, functionName: "setPublisher", args: [a.publisher, a.authorized] });
    case "transferOwnership":
      return encodeFunctionData({ abi, functionName: "transferOwnership", args: [a.newOwner] });
    case "acceptOwnership":
      return encodeFunctionData({ abi, functionName: "acceptOwnership" });
    case "freeze":
      return encodeFunctionData({ abi, functionName: "freeze" });
    case "declareSuccessor":
      return encodeFunctionData({ abi, functionName: "declareSuccessor", args: [a.successor] });
  }
}

export function toCall(registry: Address, a: Action): Call {
  return { to: registry, value: 0n, data: encodeAction(a) };
}

const short = (h: string) => (h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-4)}` : h);

export function describeAction(a: Action): string {
  switch (a.kind) {
    case "registerCanonicalization":
      return `Register canonicalization ${a.literal}`;
    case "registerRecordType":
      return `Register record type ${a.literal}`;
    case "registerSchema":
      return `Register schema ${a.literal}${a.document !== "0x" ? `, with its ${(a.document.length - 2) / 2}-byte document on-chain` : ""}`;
    case "openRelease":
      return `Open a release: ${a.header.label || "no label"}`;
    case "publish":
      return `Publish ${a.records.length} record${a.records.length === 1 ? "" : "s"} to release ${a.releaseId}`;
    case "sealRelease":
      return `Seal release ${a.releaseId} with ${a.expectedRecordCount} records`;
    case "deleteVersion":
      return `Delete version ${a.version} of subject ${short(a.subjectId)}`;
    case "deleteVersions":
      return `Delete versions ${a.fromVersion} to ${a.toVersion} of subject ${short(a.subjectId)}`;
    case "deleteSubject":
      return `Delete subject ${short(a.subjectId)} and every version`;
    case "setPublisher":
      return `${a.authorized ? "Authorize" : "Revoke"} publisher key ${a.publisher}`;
    case "transferOwnership":
      return a.newOwner === "0x0000000000000000000000000000000000000000"
        ? "Cancel the pending ownership transfer"
        : `Start an ownership transfer to ${a.newOwner}`;
    case "acceptOwnership":
      return "Accept ownership";
    case "freeze":
      return "Freeze the registry: no release, record, registration or key change can follow";
    case "declareSuccessor":
      return `Declare successor ${a.successor} and freeze`;
  }
}

/** The ID the registry derives from a literal: keccak256 of its ASCII bytes. */
export function literalId(literal: string): Hex {
  return keccak256(toHex(literal));
}

/** Rule REG-2: a literal is 1 to 128 bytes from 0x21 to 0x7E. The registry reverts with InvalidLiteral otherwise. */
export function literalProblem(literal: string): string | undefined {
  if (literal.length === 0) return "A literal needs at least 1 character.";
  if (literal.length > 128) return `A literal has at most 128 characters; this one has ${literal.length}.`;
  if (!/^[\x21-\x7e]+$/.test(literal)) return "A literal is printable ASCII without spaces.";
  return undefined;
}

const ZERO_BYTES32 = `0x${"00".repeat(32)}`;

/**
 * Why the registry would refuse a record in a publish call, for the rules the package can check
 * without reading state: a non-zero subject ID, algorithm 1 or 2, a non-zero digest, effectiveAt
 * after 0, CID-1 for the CID, a 32-byte Arweave ID, a CID or an Arweave ID, and a label of at
 * most 128 bytes. Undefined when none applies; the chain simulation checks the rest.
 */
export function recordProblem(r: RecordInput): string | undefined {
  if (!isBytes32(r.subjectId) || r.subjectId.toLowerCase() === ZERO_BYTES32)
    return "The subject ID is zero or not 32 bytes.";
  if (r.contentHash.algorithm !== 1 && r.contentHash.algorithm !== 2)
    return `Hash algorithm ${r.contentHash.algorithm} is not 1 (Keccak-256) or 2 (SHA-256).`;
  if (!isBytes32(r.contentHash.digest) || r.contentHash.digest.toLowerCase() === ZERO_BYTES32)
    return "The digest is zero or not 32 bytes.";
  if (r.effectiveAt <= 0n) return "effectiveAt is 0.";
  const cid = cidProblem(r.cid);
  if (cid) return cid;
  if (!isBytes32(r.arweaveId)) return `The Arweave ID ${r.arweaveId as string} is not 32 bytes.`;
  if (r.cid === "0x" && r.arweaveId.toLowerCase() === ZERO_BYTES32)
    return "The record has no CID or Arweave ID.";
  const label = new TextEncoder().encode(r.label).length;
  if (label > 128) return `The label is ${label} bytes, over 128.`;
  return undefined;
}

/**
 * Why the registry would refuse a release header (REL-3): the manifest hash rule, a manifest CID or
 * Arweave ID, CID-1 for both CIDs, and a label of at most 128 bytes. Undefined when none applies.
 */
export function releaseHeaderProblem(h: ReleaseInput): string | undefined {
  if (h.manifestHash.algorithm !== 1 && h.manifestHash.algorithm !== 2)
    return `Manifest hash algorithm ${h.manifestHash.algorithm} is not 1 (Keccak-256) or 2 (SHA-256).`;
  if (!isBytes32(h.manifestHash.digest) || h.manifestHash.digest.toLowerCase() === ZERO_BYTES32)
    return "The manifest digest is zero or not 32 bytes.";
  const manifest = cidProblem(h.manifestCid);
  if (manifest) return `Manifest CID: ${manifest}`;
  const root = cidProblem(h.rootCid);
  if (root) return `Root CID: ${root}`;
  if (!isBytes32(h.arweaveId)) return `The Arweave ID ${h.arweaveId as string} is not 32 bytes.`;
  if (h.manifestCid === "0x" && h.arweaveId.toLowerCase() === ZERO_BYTES32)
    return "The release has no manifest CID or Arweave ID.";
  const label = new TextEncoder().encode(h.label).length;
  if (label > 128) return `The label is ${label} bytes, over 128.`;
  return undefined;
}

export const isBytes32 = (h: string): h is Hex => isHex(h) && h.length === 66;
export { isAddress };

/** The release ID the next openRelease will return. */
export function nextReleaseId(releaseCount: number): number {
  return releaseCount + 1;
}

/** Counts records across the publish actions of one release, for sealRelease's expectedRecordCount. */
export function countRecords(actions: readonly Action[], releaseId: number): number {
  return actions.reduce(
    (n, a) => (a.kind === "publish" && a.releaseId === releaseId ? n + a.records.length : n),
    0,
  );
}

/** Reads registry calldata back into an action, for showing what a batch file or proposal does. */
export function decodeAction(data: Hex): Action {
  const { functionName, args } = decodeFunctionData({ abi, data });
  const a = (args ?? []) as readonly unknown[];
  switch (functionName) {
    case "registerCanonicalization":
      return { kind: functionName, literal: a[0] as string, specCid: a[1] as Hex };
    case "registerRecordType":
      return { kind: functionName, literal: a[0] as string };
    case "registerSchema":
      return {
        kind: functionName,
        literal: a[0] as string,
        documentHash: a[1] as HashRefInput,
        cid: a[2] as Hex,
        document: a[3] as Hex,
      };
    case "openRelease":
      return { kind: functionName, header: a[0] as ReleaseInput };
    case "publish":
      return { kind: functionName, releaseId: a[0] as number, records: [...(a[1] as RecordInput[])] };
    case "sealRelease":
      return { kind: functionName, releaseId: a[0] as number, expectedRecordCount: a[1] as number };
    case "deleteVersion":
      return {
        kind: functionName,
        subjectId: a[0] as Hex,
        version: a[1] as number,
        reasonDigest: a[2] as Hex,
      };
    case "deleteVersions":
      return {
        kind: functionName,
        subjectId: a[0] as Hex,
        fromVersion: a[1] as number,
        toVersion: a[2] as number,
        reasonDigest: a[3] as Hex,
      };
    case "deleteSubject":
      return { kind: functionName, subjectId: a[0] as Hex, reasonDigest: a[1] as Hex };
    case "setPublisher":
      return { kind: functionName, publisher: a[0] as Address, authorized: a[1] as boolean };
    case "transferOwnership":
      return { kind: functionName, newOwner: a[0] as Address };
    case "acceptOwnership":
      return { kind: functionName };
    case "freeze":
      return { kind: functionName };
    case "declareSuccessor":
      return { kind: functionName, successor: a[0] as Address };
    default:
      throw new Error(`${functionName} is a read function, not a registry write`);
  }
}
