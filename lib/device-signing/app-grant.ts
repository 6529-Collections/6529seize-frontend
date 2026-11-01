import {
  getAddress,
  hashTypedData,
  isAddress,
  recoverTypedDataAddress,
  zeroHash,
  type Hex,
} from "viem";
import {
  areCanonicalDeviceScopes,
  describeDeviceScopes,
  formatGrantExpiryDate,
  getDeviceKeyFingerprint,
} from "./grant-message";

/**
 * App device grant: the EIP-712 grant 6529 Mobile and 6529 Desktop ask the
 * wallet to sign outside a web sign-in (their sign-in is not SIWE). One
 * signature grants this device's Ed25519 signing key and, when `mls` is set,
 * its encrypted-messages key, like the website's combined sign-in grant.
 * Mirrors the backend's app-device-grant.ts; the server stores the signed
 * typed-data message as JSON (it starts with "{"; a SIWE message never does)
 * and its EIP-712 digest is the grant id.
 */

export const APP_GRANT_DOMAIN = {
  name: "6529 Device Grant",
  version: "1",
  /** keccak256("6529 Network pre-genesis interim 1"), shared with E2EE grants. */
  salt: "0x4887f15a22b96f574a9f835b87e01e293dc7587acbfc13b5f224b89cd2d8c8aa",
} as const;

const APP_GRANT_PRIMARY_TYPE = "DeviceGrant";

const APP_GRANT_TYPES = {
  DeviceGrant: [
    { name: "statement", type: "string" },
    { name: "wallet", type: "address" },
    { name: "deviceKey", type: "bytes32" },
    { name: "scopes", type: "string" },
    { name: "mlsDeviceKey", type: "bytes32" },
    { name: "ciphersuite", type: "uint16" },
    { name: "issuedAt", type: "uint64" },
    { name: "expiresAt", type: "uint64" },
    { name: "origin", type: "string" },
  ],
} as const;

/** Same lifetime as a sign-in grant: 180 days, minute aligned. */
const APP_GRANT_TTL_SECONDS = 180 * 24 * 60 * 60;
/** The server accepts at most 181 days. */
const APP_GRANT_MAX_LIFETIME_SECONDS = 181 * 24 * 60 * 60;
const KEY_PATTERN = /^0x[0-9a-f]{64}$/;
const ORIGIN_MAX_LENGTH = 64;
const PRINTABLE_ASCII = /^[\x20-\x7e]+$/;

export interface AppGrantFields {
  /** Lowercase 0x address. */
  readonly wallet: string;
  /** 0x-prefixed lowercase hex of the Ed25519 signing key. */
  readonly deviceKeyHex: string;
  /** Canonical order, includes "post". */
  readonly scopes: readonly string[];
  /** The encrypted-messages key, or null for a signing-only grant. */
  readonly mls: {
    readonly deviceKeyHex: string;
    readonly ciphersuite: number;
  } | null;
  readonly issuedAtSeconds: number;
  readonly expiresAtSeconds: number;
  /** The page host, or "6529 Desktop". */
  readonly origin: string;
}

interface AppGrantTypedMessage {
  readonly statement: string;
  readonly wallet: Hex;
  readonly deviceKey: Hex;
  readonly scopes: string;
  readonly mlsDeviceKey: Hex;
  readonly ciphersuite: number;
  readonly issuedAt: bigint;
  readonly expiresAt: bigint;
  readonly origin: string;
}

type StatementRenderer = (fields: AppGrantFields) => string;

/**
 * DRAFT wording, NOT owner-approved yet (the backend renders the same): the
 * approved sign-in statements without "Sign in to 6529 and", because the app
 * grant is not a sign-in. Like the sign-in statements it is a signed
 * commitment, not UI copy, so it is never localized. Before release, change
 * this renderer and the backend's together with the shared vectors.
 */
const renderAppGrantStatementDraft1: StatementRenderer = (fields) => {
  const keys =
    fields.mls === null
      ? `(Device key ${getDeviceKeyFingerprint(fields.deviceKeyHex)})`
      : `(Device key ${getDeviceKeyFingerprint(fields.deviceKeyHex)}, ` +
        `encrypted messages key ${getDeviceKeyFingerprint(fields.mls.deviceKeyHex)})`;
  return (
    `Turn on signed messages on this device until ` +
    `${formatGrantExpiryDate(fields.expiresAtSeconds)}. ` +
    `This device will sign your ${describeDeviceScopes(fields.scopes)} ` +
    `so anyone can verify they came from your wallet. ` +
    (fields.mls === null
      ? ""
      : `It will also encrypt (send) and decrypt (read) your end-to-end ` +
        `encrypted messages, which 6529.io cannot read. `) +
    `It can't move funds, change your handle, add devices or act as an admin. ` +
    `No transaction, no gas, no token approvals. ` +
    keys
  );
};

/**
 * Statements, newest first. New grants use the first; every entry keeps
 * verifying, so grants signed under an earlier wording stay valid.
 */
const APP_GRANT_STATEMENTS: readonly StatementRenderer[] = [
  renderAppGrantStatementDraft1,
];

const renderAppGrantStatement = (fields: AppGrantFields): string =>
  renderAppGrantStatementDraft1(fields);

/** Unix seconds, and the minute-aligned expiry 180 days later. */
export function appGrantTimes(nowMs: number): {
  readonly issuedAtSeconds: number;
  readonly expiresAtSeconds: number;
} {
  const issuedAtSeconds = Math.floor(nowMs / 1000);
  return {
    issuedAtSeconds,
    expiresAtSeconds:
      Math.floor(issuedAtSeconds / 60) * 60 + APP_GRANT_TTL_SECONDS,
  };
}

const toTypedMessage = (
  fields: AppGrantFields,
  statement: string
): AppGrantTypedMessage => ({
  statement,
  wallet: getAddress(fields.wallet),
  deviceKey: fields.deviceKeyHex as Hex,
  scopes: fields.scopes.join(","),
  mlsDeviceKey: (fields.mls?.deviceKeyHex ?? zeroHash) as Hex,
  ciphersuite: fields.mls?.ciphersuite ?? 0,
  issuedAt: BigInt(fields.issuedAtSeconds),
  expiresAt: BigInt(fields.expiresAtSeconds),
  origin: fields.origin,
});

/** The exact typed data the wallet signs for a new grant. */
export const buildAppGrantTypedData = (fields: AppGrantFields) => ({
  domain: APP_GRANT_DOMAIN,
  types: APP_GRANT_TYPES,
  primaryType: APP_GRANT_PRIMARY_TYPE as typeof APP_GRANT_PRIMARY_TYPE,
  message: toTypedMessage(fields, renderAppGrantStatement(fields)),
});

/** The grant id of a typed message: its EIP-712 digest, lowercase. */
export const computeAppGrantId = (message: AppGrantTypedMessage): Hex =>
  hashTypedData({
    domain: APP_GRANT_DOMAIN,
    types: APP_GRANT_TYPES,
    primaryType: APP_GRANT_PRIMARY_TYPE,
    message,
  }).toLowerCase() as Hex;

/** The recovered signer of a typed message, lowercase, or null. */
export async function recoverAppGrantSigner(
  message: AppGrantTypedMessage,
  signature: string
): Promise<string | null> {
  try {
    const signer = await recoverTypedDataAddress({
      domain: APP_GRANT_DOMAIN,
      types: APP_GRANT_TYPES,
      primaryType: APP_GRANT_PRIMARY_TYPE,
      message,
      signature: signature as Hex,
    });
    return signer.toLowerCase();
  } catch {
    return null;
  }
}

/** Whether a stored grant message is an app grant (JSON), not SIWE text. */
export const isAppGrantMessage = (message: string): boolean =>
  message.startsWith("{");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSafeSeconds = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

function readFields(
  value: Record<string, unknown>
): { fields: AppGrantFields; statement: string } | null {
  const { statement, wallet, deviceKey, scopes, mlsDeviceKey, ciphersuite } =
    value;
  const { issuedAt, expiresAt, origin } = value;
  if (
    typeof statement !== "string" ||
    typeof wallet !== "string" ||
    !isAddress(wallet, { strict: false }) ||
    typeof deviceKey !== "string" ||
    !KEY_PATTERN.test(deviceKey) ||
    typeof scopes !== "string" ||
    typeof mlsDeviceKey !== "string" ||
    typeof ciphersuite !== "number" ||
    !isSafeSeconds(issuedAt) ||
    !isSafeSeconds(expiresAt) ||
    typeof origin !== "string"
  ) {
    return null;
  }
  const withoutMls = mlsDeviceKey === zeroHash && ciphersuite === 0;
  if (
    !withoutMls &&
    (!KEY_PATTERN.test(mlsDeviceKey) ||
      mlsDeviceKey === deviceKey ||
      !Number.isInteger(ciphersuite) ||
      ciphersuite < 1 ||
      ciphersuite > 0xffff)
  ) {
    return null;
  }
  return {
    statement,
    fields: {
      wallet: wallet.toLowerCase(),
      deviceKeyHex: deviceKey,
      scopes: scopes.split(","),
      mls: withoutMls ? null : { deviceKeyHex: mlsDeviceKey, ciphersuite },
      issuedAtSeconds: issuedAt,
      expiresAtSeconds: expiresAt,
      origin,
    },
  };
}

const hasValidTerms = (fields: AppGrantFields): boolean =>
  areCanonicalDeviceScopes(fields.scopes) &&
  fields.origin.length <= ORIGIN_MAX_LENGTH &&
  PRINTABLE_ASCII.test(fields.origin) &&
  fields.expiresAtSeconds % 60 === 0 &&
  fields.expiresAtSeconds > fields.issuedAtSeconds &&
  fields.expiresAtSeconds - fields.issuedAtSeconds <=
    APP_GRANT_MAX_LIFETIME_SECONDS;

/**
 * Reads a stored app grant message. Null unless every field is well formed
 * and the statement is one this client renders for exactly those fields.
 */
export function parseAppGrantMessage(text: string): {
  readonly fields: AppGrantFields;
  readonly message: AppGrantTypedMessage;
} | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const read = isRecord(parsed) ? readFields(parsed) : null;
  if (
    !read ||
    !hasValidTerms(read.fields) ||
    !APP_GRANT_STATEMENTS.some(
      (render) => render(read.fields) === read.statement
    )
  ) {
    return null;
  }
  return {
    fields: read.fields,
    message: toTypedMessage(read.fields, read.statement),
  };
}
