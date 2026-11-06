// The 6529 Validator authorization a phone signs (P53 §5.2; the validator's
// keys::provisional and its page's checkTypedData in node-ui grant.js). The
// phone page checks the node's draft against these fixed parts before any
// wallet sees it, and signs only when its own EIP-712 digest equals the
// node's.

import { hashTypedData, type Address, type Hex } from "viem";

export const GRANT_PURPOSE =
  "These keys may sign daily TDH roots for this account and nothing else. They cannot move NFTs or funds.";
const DOMAIN_NAME = "6529 Validator";
const DOMAIN_VERSION = "1";
// registryDomain of 6529-validator-1 (node_api::network).
export const MAINNET_SALT =
  "0xa4d41ae1171d32737944fb118f91b8dba1d7084559658d457310a4bf12e52bf0";

const GRANT_TYPES = {
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

const DOMAIN_TYPE = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "salt", type: "bytes32" },
] as const;

const MESSAGE_FIELDS = GRANT_TYPES.ValidatorGrant.map(({ name }) => name);
const MAX_UINT64 = (1n << 64n) - 1n;
const MAX_SHARE = 10_000;

const PUBLIC_KEY = /^0x[0-9a-fA-F]{96}$/;
const BYTES32 = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const DECIMAL = /^(0|[1-9]\d{0,19})$/;

/** A grant that passed checkTypedData, with its numbers as typed. */
export type GrantTypedData = {
  readonly domain: {
    readonly name: string;
    readonly version: string;
    readonly salt: Hex;
  };
  readonly primaryType: "ValidatorGrant";
  readonly message: {
    readonly purpose: string;
    readonly account: Address;
    readonly authVersion: string | number;
    readonly refBlockNumber: string | number;
    readonly refBlockHash: Hex;
    readonly keys: readonly {
      readonly pubkey: Hex;
      readonly share: string | number;
    }[];
  };
};

type JsonObject = Readonly<Record<string, unknown>>;

function asObject(value: unknown): JsonObject | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

/** True when `object` has exactly these keys, in any order. */
function hasExactKeys(object: JsonObject, keys: readonly string[]): boolean {
  const own = Object.keys(object);
  return own.length === keys.length && keys.every((key) => own.includes(key));
}

function sameFields(
  list: unknown,
  want: readonly { readonly name: string; readonly type: string }[]
): boolean {
  return (
    Array.isArray(list) &&
    list.length === want.length &&
    want.every((field, index) => {
      const given = asObject(list[index]);
      return (
        given !== null &&
        Object.keys(given).length === 2 &&
        given["name"] === field.name &&
        given["type"] === field.type
      );
    })
  );
}

function asUint(value: unknown, max: bigint): bigint | null {
  let text: string | null = null;
  if (typeof value === "string") {
    text = value;
  } else if (typeof value === "number" && Number.isSafeInteger(value)) {
    text = String(value);
  }
  if (text === null || !DECIMAL.test(text)) {
    return null;
  }
  const number = BigInt(text);
  return number <= max ? number : null;
}

type CheckOptions = {
  /** The connected wallet. */
  readonly account: string;
  readonly network: string;
  /** The validator's own public keys, from the session. */
  readonly sessionKeys: readonly string[];
};

function checkDomain(domain: JsonObject, network: string): string[] {
  const problems: string[] = [];
  if (!hasExactKeys(domain, ["name", "version", "salt"])) {
    problems.push("Its domain has other fields than name, version and salt.");
  }
  if (domain["name"] !== DOMAIN_NAME) {
    problems.push("Its domain name isn't 6529 Validator.");
  }
  if (domain["version"] !== DOMAIN_VERSION) {
    problems.push("Its domain version isn't 1.");
  }
  const salt = domain["salt"];
  if (typeof salt !== "string" || !BYTES32.test(salt)) {
    problems.push("Its domain salt isn't 32 bytes.");
  } else if (network === "mainnet" && salt.toLowerCase() !== MAINNET_SALT) {
    problems.push("Its domain salt isn't the mainnet one.");
  }
  return problems;
}

function checkTypes(types: JsonObject): string[] {
  const problems: string[] = [];
  if (!sameFields(types["EIP712Domain"], DOMAIN_TYPE)) {
    problems.push("Its EIP712Domain type isn't the grant's.");
  }
  if (!sameFields(types["ValidatorGrant"], GRANT_TYPES.ValidatorGrant)) {
    problems.push("Its ValidatorGrant type isn't the grant's.");
  }
  if (!sameFields(types["ValidatorKey"], GRANT_TYPES.ValidatorKey)) {
    problems.push("Its ValidatorKey type isn't the grant's.");
  }
  const extra = Object.keys(types).filter(
    (name) => !["EIP712Domain", "ValidatorGrant", "ValidatorKey"].includes(name)
  );
  if (extra.length > 0) {
    problems.push(`It defines other types: ${extra.join(", ")}.`);
  }
  return problems;
}

function checkMessage(message: JsonObject, account: string): string[] {
  const problems: string[] = [];
  if (!hasExactKeys(message, MESSAGE_FIELDS)) {
    problems.push("Its message has other fields than the grant's.");
  }
  if (message["purpose"] !== GRANT_PURPOSE) {
    problems.push("Its purpose isn't the grant's sentence, word for word.");
  }
  const messageAccount = message["account"];
  if (
    typeof messageAccount !== "string" ||
    !ADDRESS.test(messageAccount) ||
    messageAccount.toLowerCase() !== account.toLowerCase()
  ) {
    problems.push("It is for another account than the connected wallet.");
  }
  if (asUint(message["authVersion"], MAX_UINT64) === null) {
    problems.push("Its authVersion isn't a whole number.");
  }
  if (asUint(message["refBlockNumber"], MAX_UINT64) === null) {
    problems.push("Its refBlockNumber isn't a whole number.");
  }
  const blockHash = message["refBlockHash"];
  if (typeof blockHash !== "string" || !BYTES32.test(blockHash)) {
    problems.push("Its refBlockHash isn't 32 bytes.");
  }
  return problems;
}

/** One key of the grant: its public key in lower case, or a problem. */
function readKey(entry: unknown): { pubkey: string } | { problem: string } {
  const key = asObject(entry);
  const pubkey = key?.["pubkey"];
  if (
    key === null ||
    Object.keys(key).length !== 2 ||
    typeof pubkey !== "string" ||
    !PUBLIC_KEY.test(pubkey)
  ) {
    return { problem: "A key in it isn't a 48-byte public key." };
  }
  const share = asUint(key["share"], BigInt(MAX_SHARE));
  if (share === null || share < 1n) {
    return { problem: "A key in it has a share outside 1 to 10,000." };
  }
  return { pubkey: pubkey.toLowerCase() };
}

function checkKeys(keys: unknown, sessionKeys: readonly string[]): string[] {
  // No keys is a stop: from its day, no key signs for the account.
  if (!Array.isArray(keys)) {
    return ["It lists no keys."];
  }
  const problems: string[] = [];
  const listed = new Set<string>();
  for (const entry of keys) {
    const key = readKey(entry);
    if ("problem" in key) {
      problems.push(key.problem);
    } else {
      listed.add(key.pubkey);
    }
  }
  if (sessionKeys.some((key) => !listed.has(key.toLowerCase()))) {
    problems.push("It doesn't list this validator's key.");
  }
  return problems;
}

/**
 * Checks the node's draft before any wallet sees it. Returns a list of
 * problems; empty means it is exactly a 6529 Validator authorization for
 * `account` that lists every one of the validator's keys.
 */
export function checkTypedData(
  typed: unknown,
  { account, network, sessionKeys }: CheckOptions
): string[] {
  const root = asObject(typed);
  if (!root) {
    return ["It isn't EIP-712 typed data."];
  }
  const message = asObject(root["message"]) ?? {};
  return [
    ...(root["primaryType"] === "ValidatorGrant"
      ? []
      : ["Its primary type isn't ValidatorGrant."]),
    ...checkDomain(asObject(root["domain"]) ?? {}, network),
    ...checkTypes(asObject(root["types"]) ?? {}),
    ...checkMessage(message, account),
    ...checkKeys(message["keys"], sessionKeys),
  ];
}

/**
 * The grant as viem and the wallet take it: the domain without chainId, the
 * types without EIP712Domain (viem adds it from the domain), and the
 * decimal numbers as numbers.
 */
export function toSignableTypedData(typed: GrantTypedData) {
  const { domain, message } = typed;
  return {
    domain: { name: domain.name, version: domain.version, salt: domain.salt },
    types: GRANT_TYPES,
    primaryType: "ValidatorGrant" as const,
    message: {
      purpose: message.purpose,
      account: message.account,
      authVersion: BigInt(message.authVersion),
      refBlockNumber: BigInt(message.refBlockNumber),
      refBlockHash: message.refBlockHash,
      keys: message.keys.map((key) => ({
        pubkey: key.pubkey,
        // uint16: a number holds every value exactly.
        share: Number(key.share),
      })),
    },
  };
}

/** The EIP-712 digest of a grant that passed checkTypedData. */
export function grantDigest(typed: GrantTypedData): Hex {
  return hashTypedData(toSignableTypedData(typed));
}
