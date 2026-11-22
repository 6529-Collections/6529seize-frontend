import { keccak256, sha256, type Hex } from "viem";
import { decodeCe, encodeCe, hexBytes, toHex } from "@/lib/chain/codec/ce";
import {
  bytes,
  bytes32,
  list,
  string,
  struct,
  u32,
  u8,
  type ValueOf,
} from "@/lib/chain/codec/schema";

/**
 * The profile document a PROFILE_REPLACE points at (P37 4.2): the chain
 * holds its CID, the gateway's document store holds its bytes. The form is
 * the one the import writes, so imported and edited documents read alike:
 *
 *   ProfileDoc.v1 = string schema ("6529.ProfileDoc.v1") || bytes32 principal
 *                || uint32 version || bytes prev (<= 64) || bytes32 nonce
 *                || list<(string key, string value)> fields (<= 256),
 *                   keys strictly ascending
 *                || bytes sig (<= 1,024)
 *   docCid = 0x01 0x55 0x12 0x20 || sha256(docBytes)
 */
const PROFILE_FIELD = struct("ProfileField", [
  ["key", string(128)],
  ["value", string(65_536)],
]);

const PROFILE_DOC = struct("ProfileDoc", [
  ["schema", string(64)],
  ["principal", bytes32],
  ["version", u32],
  ["prev", bytes(64)],
  ["nonce", bytes32],
  ["fields", list(PROFILE_FIELD, 256)],
  ["sig", bytes(1_024)],
]);

const SCHEMA = "6529.ProfileDoc.v1";
const CID_PREFIX = "0x01551220";

type ProfileDocValue = ValueOf<typeof PROFILE_DOC>;

/** The profile fields this site edits, by their document keys. */
export const PROFILE_DOC_KEYS = {
  avatar: "avatar",
  banner1: "banner1",
  banner2: "banner2",
  bio: "bio",
  classification: "classification",
  displayName: "displayName",
  subClassification: "subClassification",
  website: "website",
} as const;

export interface ProfileDoc {
  readonly principal: Hex;
  readonly version: number;
  readonly prev: Hex;
  readonly fields: ReadonlyMap<string, string>;
}

const compareKeys = (a: string, b: string): number => {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const length = Math.min(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return left.length - right.length;
};

const randomNonce = (): Hex => {
  const nonce = new Uint8Array(32);
  globalThis.crypto.getRandomValues(nonce);
  return toHex(nonce);
};

/**
 * A later document's signature (P37 4.2, INTERFACES 5.4): CE
 * `(uint8 keyType, bytes32 keyId, bytes signature)` by a key that can sign
 * PROFILE_REPLACE for the identity, over the EIP-712 `ProfileDocument`.
 */
export interface ProfileDocSignature {
  readonly keyType: number;
  readonly keyId: Hex;
  readonly signature: Hex;
}

const PROFILE_DOC_SIGNATURE = struct("ProfileDocSignature", [
  ["keyType", u8],
  ["keyId", bytes32],
  ["signature", bytes(1_024)],
]);

/** The EIP-712 typed data a later document's signature covers. */
export const profileDocumentTypedData = (
  networkId: Hex,
  principal: Hex,
  version: number,
  docHash: Hex
) => ({
  domain: { name: "6529 Network", version: "1", salt: networkId },
  types: {
    ProfileDocument: [
      { name: "principal", type: "bytes32" },
      { name: "version", type: "uint32" },
      { name: "docHash", type: "bytes32" },
    ],
  },
  primaryType: "ProfileDocument" as const,
  message: { principal, version, docHash },
});

/** The document as written before its signature, and its docHash. */
export function prepareProfileDoc(
  doc: ProfileDoc,
  nonce: Hex = randomNonce()
): { readonly unsigned: Uint8Array; readonly docHash: Hex } {
  const { bytes: whole } = encodeProfileDoc(doc, nonce);
  // An empty `sig` is its 4-byte zero length; the hash covers what precedes it.
  const unsigned = whole.slice(0, whole.length - 4);
  return { unsigned, docHash: keccak256(unsigned) };
}

/** The signed document's bytes and CID. */
export function signedProfileDoc(
  unsigned: Uint8Array,
  signature: ProfileDocSignature
): { readonly bytes: Uint8Array; readonly cid: Hex } {
  const sig = encodeCe(PROFILE_DOC_SIGNATURE, signature);
  const out = new Uint8Array(unsigned.length + 4 + sig.length);
  out.set(unsigned, 0);
  new DataView(out.buffer).setUint32(unsigned.length, sig.length);
  out.set(sig, unsigned.length + 4);
  return { bytes: out, cid: profileDocCid(out) };
}

/** The document's bytes and CID, with an empty signature. Empty values are left out. */
function encodeProfileDoc(
  doc: ProfileDoc,
  nonce: Hex = randomNonce()
): { readonly bytes: Uint8Array; readonly cid: Hex } {
  const fields = [...doc.fields.entries()]
    .map(([key, value]) => [key, value.trim()] as const)
    .filter(([, value]) => value.length > 0)
    .sort(([a], [b]) => compareKeys(a, b))
    .map(([key, value]) => ({ key, value }));
  const value: ProfileDocValue = {
    schema: SCHEMA,
    principal: doc.principal,
    version: doc.version,
    prev: doc.prev,
    nonce,
    fields,
    sig: "0x",
  };
  const encoded = encodeCe(PROFILE_DOC, value);
  return { bytes: encoded, cid: profileDocCid(encoded) };
}

function profileDocCid(docBytes: Uint8Array): Hex {
  return `${CID_PREFIX}${sha256(docBytes).slice(2)}`;
}

/** Reads a document's bytes; null when they are not a ProfileDoc.v1. */
export function decodeProfileDoc(docBytes: Uint8Array): ProfileDoc | null {
  try {
    const value = decodeCe(PROFILE_DOC, docBytes);
    if (value.schema !== SCHEMA) {
      return null;
    }
    return {
      principal: value.principal,
      version: value.version,
      prev: value.prev,
      fields: new Map(value.fields.map((field) => [field.key, field.value])),
    };
  } catch {
    return null;
  }
}

/** Whether `docBytes` are the document `cid` names. */
export function matchesCid(docBytes: Uint8Array, cid: Hex): boolean {
  return profileDocCid(docBytes) === toHex(hexBytes(cid));
}
