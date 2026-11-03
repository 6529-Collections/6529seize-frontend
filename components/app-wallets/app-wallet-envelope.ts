// Pure shape checks for stored app-wallet encrypted payloads. This module must
// stay free of `crypto` and `Buffer` so shared code (providers, validation) can
// use it without pulling the Node crypto polyfills into every route.

export const APP_WALLET_ENCRYPTION_ALGORITHM = "aes-256-gcm";
export const APP_WALLET_LEGACY_KDF_ITERATIONS = 100000;
export const APP_WALLET_CURRENT_ENCRYPTION_VERSION = 2;
export const APP_WALLET_CURRENT_KDF_ITERATIONS = 600000;
export const APP_WALLET_CURRENT_KDF_SALT_BYTES = 16;
export const APP_WALLET_CURRENT_IV_BYTES = 12;
export const APP_WALLET_ENCRYPTION_KEY_BYTES = 32;

const MIN_V2_DECRYPT_KDF_ITERATIONS = APP_WALLET_LEGACY_KDF_ITERATIONS + 1;
const AUTH_TAG_BYTES = 16;
const HEX_PATTERN = /^[0-9a-f]+$/i;

export interface AppWalletEncryptedEnvelopeV2 {
  version: typeof APP_WALLET_CURRENT_ENCRYPTION_VERSION;
  algorithm: typeof APP_WALLET_ENCRYPTION_ALGORITHM;
  kdf: {
    name: "pbkdf2";
    hash: "sha256";
    iterations: number;
    salt: string;
    key_length: number;
  };
  iv: string;
  auth_tag: string;
  ciphertext: string;
}

// Parsed JSON is untrusted until every field has been checked.
interface EnvelopeCandidate {
  version?: unknown;
  algorithm?: unknown;
  kdf?: {
    name?: unknown;
    hash?: unknown;
    iterations?: unknown;
    salt?: unknown;
    key_length?: unknown;
  } | null;
  iv?: unknown;
  auth_tag?: unknown;
  ciphertext?: unknown;
}

function isHex(value: unknown): value is string {
  return typeof value === "string" && HEX_PATTERN.test(value);
}

// Byte length of a validated hex string, matching `Buffer.from(hex, "hex")`,
// which ignores a trailing odd nibble.
function hexByteLength(hex: string): number {
  return Math.floor(hex.length / 2);
}

function isValidKdfIterations(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= MIN_V2_DECRYPT_KDF_ITERATIONS &&
    value <= APP_WALLET_CURRENT_KDF_ITERATIONS
  );
}

function isValidKdf(kdf: EnvelopeCandidate["kdf"]): boolean {
  return (
    kdf?.name === "pbkdf2" &&
    kdf.hash === "sha256" &&
    isValidKdfIterations(kdf.iterations) &&
    kdf.key_length === APP_WALLET_ENCRYPTION_KEY_BYTES &&
    isHex(kdf.salt) &&
    hexByteLength(kdf.salt) >= APP_WALLET_CURRENT_KDF_SALT_BYTES
  );
}

function isValidCipherFields(envelope: EnvelopeCandidate): boolean {
  return (
    isHex(envelope.iv) &&
    hexByteLength(envelope.iv) === APP_WALLET_CURRENT_IV_BYTES &&
    isHex(envelope.auth_tag) &&
    hexByteLength(envelope.auth_tag) === AUTH_TAG_BYTES &&
    isHex(envelope.ciphertext)
  );
}

function isEnvelopeV2(
  candidate: EnvelopeCandidate
): candidate is AppWalletEncryptedEnvelopeV2 {
  return (
    candidate.version === APP_WALLET_CURRENT_ENCRYPTION_VERSION &&
    candidate.algorithm === APP_WALLET_ENCRYPTION_ALGORITHM &&
    isValidKdf(candidate.kdf) &&
    isValidCipherFields(candidate)
  );
}

export function parseAppWalletEnvelope(
  encryptedData: string
): AppWalletEncryptedEnvelopeV2 | null {
  try {
    // JSON.parse may yield null or a primitive; reading a field of null
    // throws and is treated as "not an envelope".
    const parsed = JSON.parse(encryptedData) as EnvelopeCandidate;
    return isEnvelopeV2(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function isAppWalletEncryptedEnvelope(value: unknown): boolean {
  return typeof value === "string" && parseAppWalletEnvelope(value) !== null;
}

export function getAppWalletEncryptionVersion(value: unknown): 1 | 2 | null {
  if (typeof value !== "string" || !value) {
    return null;
  }

  return parseAppWalletEnvelope(value) ? 2 : 1;
}
