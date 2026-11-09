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

/** Grant v2 (D172): `uint16[] ciphersuites` in place of `uint16 ciphersuite`. */
const APP_GRANT_DOMAIN_V2 = {
  ...APP_GRANT_DOMAIN,
  version: "2",
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

const APP_GRANT_TYPES_V2 = {
  DeviceGrant: [
    { name: "statement", type: "string" },
    { name: "wallet", type: "address" },
    { name: "deviceKey", type: "bytes32" },
    { name: "scopes", type: "string" },
    { name: "mlsDeviceKey", type: "bytes32" },
    { name: "ciphersuites", type: "uint16[]" },
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
  /**
   * 2 (new grants): signs `ciphersuites`; 1: an earlier grant that signed one
   * `ciphersuite` (0x004F). Absent means 2.
   */
  readonly version?: 1 | 2;
  /**
   * The encrypted-messages key and its suites (v1: the one suite), or null
   * for a signing-only grant.
   */
  readonly mls: {
    readonly deviceKeyHex: string;
    readonly ciphersuites: readonly number[];
  } | null;
  readonly issuedAtSeconds: number;
  readonly expiresAtSeconds: number;
  /** The page host, or "6529 Desktop". */
  readonly origin: string;
}

interface AppGrantTypedFields {
  readonly statement: string;
  readonly wallet: Hex;
  readonly deviceKey: Hex;
  readonly scopes: string;
  readonly mlsDeviceKey: Hex;
  readonly issuedAt: bigint;
  readonly expiresAt: bigint;
  readonly origin: string;
}

/** v1 signs `ciphersuite`, v2 `ciphersuites`. */
type AppGrantTypedMessage = AppGrantTypedFields &
  (
    | { readonly ciphersuite: number; readonly ciphersuites?: undefined }
    | {
        readonly ciphersuites: readonly number[];
        readonly ciphersuite?: undefined;
      }
  );

const isV2 = (fields: Pick<AppGrantFields, "version">): boolean =>
  fields.version !== 1;

/** The EIP-712 domain and types of a typed message's version. */
const typingOf = (message: AppGrantTypedMessage) =>
  message.ciphersuites === undefined
    ? { domain: APP_GRANT_DOMAIN, types: APP_GRANT_TYPES }
    : { domain: APP_GRANT_DOMAIN_V2, types: APP_GRANT_TYPES_V2 };

type StatementRenderer = (fields: AppGrantFields) => string;

/**
 * Approved app-grant wording, mirrored by the backend. The historical Draft1
 * renderer name is retained; the signed statement bytes are unchanged.
 * This is a signed commitment, not UI copy, so it is never localized.
 * Any future wording change must update the frontend, backend and shared
 * vectors together while preserving verification of existing grants.
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

function toTypedMessage(
  fields: AppGrantFields,
  statement: string
): AppGrantTypedMessage {
  // Keys in the order of the typed fields, so the stored JSON matches the
  // backend's byte for byte.
  const head = {
    statement,
    wallet: getAddress(fields.wallet),
    deviceKey: fields.deviceKeyHex as Hex,
    scopes: fields.scopes.join(","),
    mlsDeviceKey: (fields.mls?.deviceKeyHex ?? zeroHash) as Hex,
  };
  const tail = {
    issuedAt: BigInt(fields.issuedAtSeconds),
    expiresAt: BigInt(fields.expiresAtSeconds),
    origin: fields.origin,
  };
  return isV2(fields)
    ? {
        ...head,
        ciphersuites: [...(fields.mls?.ciphersuites ?? [])],
        ...tail,
      }
    : { ...head, ciphersuite: fields.mls?.ciphersuites[0] ?? 0, ...tail };
}

/** The exact typed data the wallet signs for a new grant (v2 unless set). */
export const buildAppGrantTypedData = (fields: AppGrantFields) => {
  const message = toTypedMessage(fields, renderAppGrantStatement(fields));
  return {
    ...typingOf(message),
    primaryType: APP_GRANT_PRIMARY_TYPE as typeof APP_GRANT_PRIMARY_TYPE,
    message,
  };
};

/** The grant id of a typed message: its EIP-712 digest, lowercase. */
export const computeAppGrantId = (message: AppGrantTypedMessage): Hex =>
  hashTypedData({
    ...typingOf(message),
    primaryType: APP_GRANT_PRIMARY_TYPE,
    message,
  } as unknown as Parameters<typeof hashTypedData>[0]).toLowerCase() as Hex;

/** The recovered signer of a typed message, lowercase, or null. */
export async function recoverAppGrantSigner(
  message: AppGrantTypedMessage,
  signature: string
): Promise<string | null> {
  try {
    const signer = await recoverTypedDataAddress({
      ...typingOf(message),
      primaryType: APP_GRANT_PRIMARY_TYPE,
      message,
      signature: signature as Hex,
    } as unknown as Parameters<typeof recoverTypedDataAddress>[0]);
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

const isUint16 = (value: unknown): value is number =>
  Number.isInteger(value) &&
  (value as number) >= 1 &&
  (value as number) <= 0xffff;

/**
 * The signed suites: v1 `ciphersuite` (0 without a key) or v2
 * `ciphersuites` ([] without a key), never both.
 */
const MAX_GRANT_SUITES = 4;

/** v2: 1 to 4 suites, strictly ascending (one encoding per set, D172). */
const isCanonicalSuites = (suites: readonly number[]): boolean =>
  suites.length <= MAX_GRANT_SUITES &&
  suites.every(
    (suite, index) => index === 0 || suite > (suites[index - 1] ?? 0)
  );

function readSuites(
  value: Record<string, unknown>
): { version: 1 | 2; suites: number[] } | null {
  const { ciphersuite, ciphersuites } = value;
  if (typeof ciphersuite === "number" && ciphersuites === undefined) {
    return { version: 1, suites: ciphersuite === 0 ? [] : [ciphersuite] };
  }
  if (ciphersuite === undefined && Array.isArray(ciphersuites)) {
    return { version: 2, suites: ciphersuites as number[] };
  }
  return null;
}

function readFields(
  value: Record<string, unknown>
): { fields: AppGrantFields; statement: string } | null {
  const { statement, wallet, deviceKey, scopes, mlsDeviceKey } = value;
  const { issuedAt, expiresAt, origin } = value;
  const read = readSuites(value);
  if (
    read === null ||
    typeof statement !== "string" ||
    typeof wallet !== "string" ||
    !isAddress(wallet, { strict: false }) ||
    typeof deviceKey !== "string" ||
    !KEY_PATTERN.test(deviceKey) ||
    typeof scopes !== "string" ||
    typeof mlsDeviceKey !== "string" ||
    !isSafeSeconds(issuedAt) ||
    !isSafeSeconds(expiresAt) ||
    typeof origin !== "string"
  ) {
    return null;
  }
  const withoutMls = mlsDeviceKey === zeroHash && read.suites.length === 0;
  if (
    !withoutMls &&
    (!KEY_PATTERN.test(mlsDeviceKey) ||
      mlsDeviceKey === zeroHash ||
      mlsDeviceKey === deviceKey ||
      read.suites.length === 0 ||
      !read.suites.every(isUint16) ||
      (read.version === 1 && read.suites.length !== 1) ||
      (read.version === 2 && !isCanonicalSuites(read.suites)))
  ) {
    return null;
  }
  return {
    statement,
    fields: {
      version: read.version,
      wallet: wallet.toLowerCase(),
      deviceKeyHex: deviceKey,
      scopes: scopes.split(","),
      mls: withoutMls
        ? null
        : { deviceKeyHex: mlsDeviceKey, ciphersuites: read.suites },
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
