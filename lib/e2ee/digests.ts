import { encodeAbiParameters, keccak256 } from "viem";
import { concatBytes, hexToBytes, isHex, utf8Encode } from "./bytes";

/**
 * Hash helpers of contract sections 1, 2.4, 3.1-3.4 and 4.1.
 * `H(name, f1..fk) = keccak256(abi.encode(bytes32 TAG(name), f1..fk))`.
 */

type Hex = `0x${string}`;

type DigestField =
  | { readonly type: "bytes32"; readonly value: string }
  | { readonly type: "uint8" | "uint32"; readonly value: number }
  | { readonly type: "uint64"; readonly value: number | bigint };

const ENTRY_KIND_COMMIT = 1;
const ENTRY_KIND_PROPOSAL = 2;

const entryKindCode = (kind: "commit" | "proposal"): number =>
  kind === "commit" ? ENTRY_KIND_COMMIT : ENTRY_KIND_PROPOSAL;

export const TAG = (name: string): Hex => keccak256(utf8Encode(name));

const assertBytes32 = (value: string): Hex => {
  const normalized = value.toLowerCase();
  if (!isHex(normalized, 32)) {
    throw new Error("Expected a 32-byte hex value");
  }
  return normalized as Hex;
};

function H(name: string, fields: readonly DigestField[]): Hex {
  const types = [{ type: "bytes32" }, ...fields.map((f) => ({ type: f.type }))];
  const values: (Hex | number | bigint)[] = [TAG(name)];
  for (const field of fields) {
    values.push(
      field.type === "bytes32" ? assertBytes32(field.value) : field.value
    );
  }
  return keccak256(encodeAbiParameters(types, values));
}

/** fp(x): first 8 bytes of keccak256(x) as 16 lowercase hex chars, no 0x. */
export const fp = (bytes: Uint8Array): string => keccak256(bytes).slice(2, 18);

interface EntryDigestInput {
  readonly g: string;
  readonly epoch: number;
  readonly kind: "commit" | "proposal";
  readonly entryHash: string;
  readonly epochCommitment: string;
  readonly nextCommitKey: string;
  readonly paddedLen: number;
}

export const entryDigest = (input: EntryDigestInput): Hex =>
  H("6529.MlsEntry.v1", [
    { type: "bytes32", value: input.g },
    { type: "uint32", value: input.epoch },
    { type: "uint8", value: entryKindCode(input.kind) },
    { type: "bytes32", value: input.entryHash },
    { type: "bytes32", value: input.epochCommitment },
    { type: "bytes32", value: input.nextCommitKey },
    { type: "uint32", value: input.paddedLen },
  ]);

export const epochCommitment = (
  g: string,
  epoch: number,
  groupContextHash: string
): Hex =>
  H("6529.MlsEpoch.v1", [
    { type: "bytes32", value: g },
    { type: "uint32", value: epoch },
    { type: "bytes32", value: groupContextHash },
  ]);

export const aadEntry = (
  g: string,
  epoch: number,
  kind: "commit" | "proposal"
): Hex =>
  H("6529.MlsWrapE.v1", [
    { type: "bytes32", value: g },
    { type: "uint32", value: epoch },
    { type: "uint8", value: entryKindCode(kind) },
  ]);

export const aadMessage = (g: string, epoch: number): Hex =>
  H("6529.MlsWrapM.v1", [
    { type: "bytes32", value: g },
    { type: "uint32", value: epoch },
  ]);

export const messageDigest = (
  g: string,
  epoch: number,
  body: Uint8Array
): Hex =>
  H("6529.MlsMessageSig.v1", [
    { type: "bytes32", value: g },
    { type: "uint32", value: epoch },
    { type: "bytes32", value: keccak256(body) },
  ]);

export const revokeDigest = (
  targetDeviceKey: string,
  revokerDeviceKey: string,
  revokedAtSeconds: number | bigint
): Hex =>
  H("6529.MlsDeviceRevoke.v1", [
    { type: "bytes32", value: targetDeviceKey },
    { type: "bytes32", value: revokerDeviceKey },
    { type: "uint64", value: revokedAtSeconds },
  ]);

/** Device keys sorted as 32-byte values (lowercase hex sorts identically). */
export const sortDeviceKeys = (deviceKeys: readonly string[]): string[] =>
  [...new Set(deviceKeys.map((key) => assertBytes32(key)))].sort(compareAscii);

export function rosterDigest(
  g: string,
  epoch: number,
  deviceKeys: readonly string[]
): Hex {
  const concatenated = concatBytes(
    ...sortDeviceKeys(deviceKeys).map((key) => hexToBytes(key))
  );
  return H("6529.MlsRoster.v1", [
    { type: "bytes32", value: g },
    { type: "uint32", value: epoch },
    { type: "bytes32", value: keccak256(concatenated) },
  ]);
}

export const digestBytes = (digest: string): Uint8Array =>
  hexToBytes(assertBytes32(digest));

function compareAscii(left: string, right: string): number {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}

export const safetyCodeFromFp = (epochFp: string): string =>
  (epochFp.match(/.{1,4}/gu) ?? []).join(" ");
