import { getAddress, isAddress, type Hex } from "viem";

// Matches the validator's keys::eip712::ValidatorGrant, not a chain transaction.
export const VALIDATOR_GRANT_PURPOSE =
  "These keys may sign daily TDH roots for this account and nothing else. They cannot move NFTs or funds.";
export const VALIDATOR_MAINNET_SALT =
  "0xa4d41ae1171d32737944fb118f91b8dba1d7084559658d457310a4bf12e52bf0";
export const MAX_GRANT_BYTES = 64 * 1024;
export const VALIDATOR_GRANT_TYPES = {
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
} as const;

type GrantErrorCode = "invalid" | "tooLarge" | "network" | "keys";

export class GrantParseError extends Error {
  constructor(readonly code: GrantErrorCode) {
    super(code);
    this.name = "GrantParseError";
  }
}

function record(
  value: unknown,
  fields: readonly string[]
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new GrantParseError("invalid");
  }
  const result = value as Record<string, unknown>;
  const keys = Object.keys(result);
  if (
    keys.length !== fields.length ||
    fields.some((key) => !Object.hasOwn(result, key))
  ) {
    throw new GrantParseError("invalid");
  }
  return result;
}

function uint(value: unknown, max: bigint): bigint {
  const decimal =
    typeof value === "number" && Number.isSafeInteger(value)
      ? String(value)
      : value;
  if (typeof decimal !== "string" || !/^(0|[1-9]\d{0,19})$/.test(decimal)) {
    throw new GrantParseError("invalid");
  }
  const parsed = BigInt(decimal);
  if (parsed > max) throw new GrantParseError("invalid");
  return parsed;
}

function hex(value: unknown, bytes: number): Hex {
  if (
    typeof value !== "string" ||
    value.length !== bytes * 2 + 2 ||
    !/^0x[0-9a-fA-F]+$/.test(value)
  ) {
    throw new GrantParseError("invalid");
  }
  return value as Hex;
}

function checkTypes(value: unknown): void {
  const types = record(value, Object.keys(VALIDATOR_GRANT_TYPES));
  for (const [name, expected] of Object.entries(VALIDATOR_GRANT_TYPES)) {
    const fields = types[name];
    if (!Array.isArray(fields) || fields.length !== expected.length) {
      throw new GrantParseError("invalid");
    }
    expected.forEach((field, index) => {
      const actual = record(fields[index], ["name", "type"]);
      if (actual["name"] !== field.name || actual["type"] !== field.type) {
        throw new GrantParseError("invalid");
      }
    });
  }
}

function parseKeys(value: unknown): { pubkey: Hex; share: number }[] {
  if (!Array.isArray(value) || value.length > 16)
    throw new GrantParseError("keys");
  const seen = new Set<string>();
  return value.map((entry: unknown) => {
    const key = record(entry, ["pubkey", "share"]);
    const pubkey = hex(key["pubkey"], 48);
    const share = Number(uint(key["share"], 10_000n));
    if (share === 0 || seen.has(pubkey.toLowerCase()))
      throw new GrantParseError("keys");
    seen.add(pubkey.toLowerCase());
    return { pubkey, share };
  });
}

/** File contents stay in memory. Never accept user-defined domains or types. */
export function parseValidatorGrant(text: string) {
  if (new TextEncoder().encode(text).byteLength > MAX_GRANT_BYTES) {
    throw new GrantParseError("tooLarge");
  }
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    throw new GrantParseError("invalid");
  }
  const typed = record(input, ["types", "primaryType", "domain", "message"]);
  checkTypes(typed["types"]);
  const domain = record(typed["domain"], ["name", "version", "salt"]);
  if (
    domain["name"] !== "6529 Validator" ||
    domain["version"] !== "1" ||
    typed["primaryType"] !== "ValidatorGrant"
  ) {
    throw new GrantParseError("invalid");
  }
  if (hex(domain["salt"], 32).toLowerCase() !== VALIDATOR_MAINNET_SALT) {
    throw new GrantParseError("network");
  }
  const message = record(typed["message"], [
    "purpose",
    "account",
    "authVersion",
    "refBlockNumber",
    "refBlockHash",
    "keys",
  ]);
  const account = message["account"];
  if (
    message["purpose"] !== VALIDATOR_GRANT_PURPOSE ||
    typeof account !== "string" ||
    !isAddress(account)
  ) {
    throw new GrantParseError("invalid");
  }
  return {
    domain: {
      name: "6529 Validator",
      version: "1",
      salt: VALIDATOR_MAINNET_SALT,
    },
    types: VALIDATOR_GRANT_TYPES,
    primaryType: "ValidatorGrant",
    message: {
      purpose: VALIDATOR_GRANT_PURPOSE,
      account: getAddress(account),
      authVersion: uint(message["authVersion"], 2n ** 64n - 1n),
      refBlockNumber: uint(message["refBlockNumber"], 2n ** 64n - 1n),
      refBlockHash: hex(message["refBlockHash"], 32),
      keys: parseKeys(message["keys"]),
    },
  } as const;
}

export type ValidatorGrant = ReturnType<typeof parseValidatorGrant>;

// P28 §7.8, as enforced by keys::eip712::recover: r/s in range,
// low s, and Ethereum recovery byte 27 or 28. Do not rewrite a wallet's result.
export function isValidatorSignature(value: string): value is Hex {
  if (!/^0x[0-9a-fA-F]{128}1[bBcC]$/.test(value)) return false;
  const order =
    0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
  const r = BigInt(`0x${value.slice(2, 66)}`);
  const s = BigInt(`0x${value.slice(66, 130)}`);
  return r > 0n && r < order && s > 0n && s <= order / 2n;
}
