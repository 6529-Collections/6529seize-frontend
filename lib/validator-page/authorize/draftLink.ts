// The draft link, v1: a validator's Authorize step puts its draft grant in
// the fragment of 6529.io/validator/authorize#<base64url>, which no server
// ever sees. This rebuilds the node's own typed data from it, byte for byte
// (keys/src/eip712.rs typed_data_json), or refuses the link.

import { GRANT_PURPOSE, MAINNET_SALT } from "./typedData";

const FORMAT = 1;
const NETWORK_MAINNET = 0;
const NETWORK_TEST = 1;
const MAX_KEYS = 16;
const MAX_SHARE = 10_000;
const MAX_LEB128_BYTES = 10;
const MAX_UINT64 = (1n << 64n) - 1n;
const PUBLIC_KEY_BYTES = 48;
const BASE64URL = /^[A-Za-z0-9_-]*$/;

export type DraftKey = {
  readonly pubkey: string;
  readonly share: number;
  /** The key of the validator that made the link. */
  readonly mine: boolean;
};

export type Draft = {
  /** From the salt: only the mainnet salt is mainnet. */
  readonly network: "mainnet" | "test";
  /** The EIP-712 domain salt the wallet signs. */
  readonly salt: string;
  readonly account: string;
  readonly authVersion: bigint;
  readonly keys: readonly DraftKey[];
  /** The typed data as the node writes it: sorted keys, two-space indent. */
  readonly typedDataJson: string;
};

function hex(bytes: Uint8Array): string {
  let text = "0x";
  for (const byte of bytes) {
    text += byte.toString(16).padStart(2, "0");
  }
  return text;
}

function encodeBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

/** Strict base64url without padding: anything else, or spare bits, is null. */
function decodeBase64url(text: string): Uint8Array | null {
  if (!BASE64URL.test(text) || text.length % 4 === 1) {
    return null;
  }
  let binary: string;
  try {
    binary = atob(text.replaceAll("-", "+").replaceAll("_", "/"));
  } catch {
    return null;
  }
  const bytes = Uint8Array.from(
    binary,
    (character) => character.codePointAt(0) ?? 0
  );
  // One link per draft: refuse a fragment that only decodes the same.
  return encodeBase64url(bytes) === text ? bytes : null;
}

class Reader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get done(): boolean {
    return this.offset === this.bytes.length;
  }

  take(count: number): Uint8Array {
    if (this.offset + count > this.bytes.length) {
      throw new RangeError("the link ends early");
    }
    const slice = this.bytes.subarray(this.offset, this.offset + count);
    this.offset += count;
    return slice;
  }

  u8(): number {
    return this.take(1)[0] ?? 0;
  }

  u16(): number {
    const [high = 0, low = 0] = this.take(2);
    return high * 256 + low;
  }

  /** Unsigned LEB128, at most 10 bytes, below 2^64, minimal. */
  leb128(): bigint {
    let value = 0n;
    for (let index = 0; index < MAX_LEB128_BYTES; index += 1) {
      const byte = this.u8();
      value |= BigInt(byte & 0x7f) << BigInt(7 * index);
      if ((byte & 0x80) === 0) {
        if (byte === 0 && index > 0) {
          throw new RangeError("a number isn't in its shortest form");
        }
        if (value > MAX_UINT64) {
          throw new RangeError("a number is too large");
        }
        return value;
      }
    }
    throw new RangeError("a number is too long");
  }
}

function typedDataJson(fields: {
  readonly salt: string;
  readonly account: string;
  readonly authVersion: bigint;
  readonly refBlockNumber: bigint;
  readonly refBlockHash: string;
  readonly keys: readonly DraftKey[];
}): string {
  // Keys in sorted order, as serde_json writes the node's typed data.
  const typed = {
    domain: { name: "6529 Validator", salt: fields.salt, version: "1" },
    message: {
      account: fields.account,
      authVersion: fields.authVersion.toString(),
      keys: fields.keys.map((key) => ({
        pubkey: key.pubkey,
        share: key.share.toString(),
      })),
      purpose: GRANT_PURPOSE,
      refBlockHash: fields.refBlockHash,
      refBlockNumber: fields.refBlockNumber.toString(),
    },
    primaryType: "ValidatorGrant",
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "salt", type: "bytes32" },
      ],
      ValidatorGrant: [
        { name: "purpose", type: "string" },
        { name: "account", type: "address" },
        { name: "authVersion", type: "uint64" },
        { name: "refBlockNumber", type: "uint64" },
        { name: "refBlockHash", type: "bytes32" },
        { name: "keys", type: "ValidatorKey[]" },
      ],
      ValidatorKey: [
        { name: "pubkey", type: "bytes" },
        { name: "share", type: "uint16" },
      ],
    },
  };
  return JSON.stringify(typed, null, 2);
}

function readKeys(reader: Reader): DraftKey[] {
  const count = reader.u8();
  if (count > MAX_KEYS) {
    throw new RangeError("the link lists too many keys");
  }
  const mine = reader.u16();
  if (mine >> count !== 0) {
    throw new RangeError("the link marks a key it doesn't list");
  }
  const keys: DraftKey[] = [];
  for (let index = 0; index < count; index += 1) {
    const pubkey = hex(reader.take(PUBLIC_KEY_BYTES));
    const share = reader.u16();
    if (share < 1 || share > MAX_SHARE) {
      throw new RangeError("a share is outside 1 to 10,000");
    }
    keys.push({ pubkey, share, mine: ((mine >> index) & 1) === 1 });
  }
  return keys;
}

/**
 * Decodes a link's fragment (with or without its #). Returns null for any
 * link that isn't exactly a v1 draft: every byte must be read.
 */
export function decodeDraftLink(fragment: string): Draft | null {
  const bytes = decodeBase64url(fragment.replace(/^#/, ""));
  if (!bytes || bytes.length === 0) {
    return null;
  }
  try {
    const reader = new Reader(bytes);
    if (reader.u8() !== FORMAT) {
      return null;
    }
    const network = reader.u8();
    let salt: string;
    if (network === NETWORK_MAINNET) {
      salt = MAINNET_SALT;
    } else if (network === NETWORK_TEST) {
      salt = hex(reader.take(32));
      // The validator writes the mainnet salt only as network 0, so a test
      // link that carries it would sign for mainnet under a test label.
      if (salt === MAINNET_SALT) {
        return null;
      }
    } else {
      return null;
    }
    const account = hex(reader.take(20));
    const authVersion = reader.leb128();
    const refBlockNumber = reader.leb128();
    const refBlockHash = hex(reader.take(32));
    const keys = readKeys(reader);
    if (!reader.done) {
      return null;
    }
    return {
      network: network === NETWORK_MAINNET ? "mainnet" : "test",
      salt,
      account,
      authVersion,
      keys,
      typedDataJson: typedDataJson({
        salt,
        account,
        authVersion,
        refBlockNumber,
        refBlockHash,
        keys,
      }),
    };
  } catch {
    return null;
  }
}
