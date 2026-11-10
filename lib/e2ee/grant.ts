import {
  getAddress,
  hashMessage,
  hashTypedData,
  isAddress,
  keccak256,
  recoverMessageAddress,
  recoverTypedDataAddress,
  toBytes,
} from "viem";
import {
  type AppGrantFields,
  computeAppGrantId,
  isAppGrantMessage,
  parseAppGrantMessage,
  recoverAppGrantSigner,
} from "@/lib/device-signing/app-grant";
import {
  parseDeviceGrantMessage,
  parseSiweIssuedAtSeconds,
} from "@/lib/device-signing/grant-message";
import {
  isRecognizedAppGrantOrigin,
  isRecognizedGrantHost,
} from "@/lib/device-signing/grant-origins";
import type { ApiE2eeDevice, ApiE2eeDeviceGrant } from "./api-types";
import { isHex } from "./bytes";

/** Contract section 2: wallet-signed EIP-712 device grants. */

export const E2EE_SALT = keccak256(
  toBytes("6529 Network pre-genesis interim 1")
);
/**
 * MLS_128_MLKEM768X25519_AES256GCM_SHA384_Ed25519 (0x004E): the suite of new
 * devices and groups (D172). The same X-Wing key exchange and Ed25519 device
 * keys as 0x004F with AES-256-GCM and SHA-384: under 0x004F the epoch secrets
 * travel in HPKE sealed with AES-128-GCM, so the floor is the AES-128 /
 * SHA-256 level; 0x004E raises it. A draft code point (TBD2). A stored device
 * whose grant does not cover it is retired, keeping its history
 * (engine/enroll.ts), and enrolls again.
 */
export const E2EE_CIPHERSUITE = 0x004e;

/** 0x004F, the suite encrypted messages launched on (v1 grants). */
export const E2EE_LEGACY_CIPHERSUITE = 0x004f;

/** The suite set a new (v2) grant signs. */
export const E2EE_GRANT_SUITES: readonly number[] = [E2EE_CIPHERSUITE];

/**
 * A grant naming `from` also covers `to` (D172): whether a grant for a
 * provisional code point covers the RFC's final one is an owner decision;
 * empty until decided. Mirrors the backend's E2EE_SUITE_ALIASES.
 */
const E2EE_SUITE_ALIASES: readonly { from: number; to: number }[] = [];

const MAX_GRANT_SUITES = 4;
const MAX_UINT16 = 0xffff;

/** 1 to 4 code points, strictly ascending (one encoding per set). */
function isCanonicalSuiteSet(value: unknown): value is number[] {
  if (!Array.isArray(value) || value.length < 1) {
    return false;
  }
  if (value.length > MAX_GRANT_SUITES) {
    return false;
  }
  let previous = 0;
  for (const suite of value) {
    if (!Number.isInteger(suite) || suite <= previous || suite > MAX_UINT16) {
      return false;
    }
    previous = suite as number;
  }
  return true;
}

/**
 * The suites a grant covers: a v1 grant only 0x004F, a v2 grant its signed
 * set plus aliases. Whether the server still honours v1 grants is its
 * business (its listings stop offering them when the window closes).
 */
export function grantSuites(
  grant: ApiE2eeDeviceGrant,
  aliases: readonly { from: number; to: number }[] = E2EE_SUITE_ALIASES
): number[] {
  if (grant.version !== 2) {
    return grant.ciphersuite === E2EE_LEGACY_CIPHERSUITE
      ? [E2EE_LEGACY_CIPHERSUITE]
      : [];
  }
  const signed = isCanonicalSuiteSet(grant.ciphersuites)
    ? grant.ciphersuites
    : [];
  const covered = new Set(signed);
  for (const alias of aliases) {
    if (covered.has(alias.from)) {
      covered.add(alias.to);
    }
  }
  return Array.from(covered).sort((a, b) => a - b);
}

/** Whether the grant lets its device join groups of `suite`. */
export const grantCoversSuite = (
  grant: ApiE2eeDeviceGrant,
  suite: number
): boolean => grantSuites(grant).includes(suite);

const ETHEREUM_MAINNET_CHAIN_ID = 1;
const GRANT_LIFETIME_SECONDS = 15_552_000; // 180 days
const GRANT_MAX_LIFETIME_SECONDS = 181 * 86_400;
const CREDENTIAL_PREFIX = "6529-e2ee-v1";

const GRANT_DOMAIN = {
  name: "6529 Encrypted Messages",
  version: "1",
  salt: E2EE_SALT,
} as const;

const GRANT_DOMAIN_V2 = {
  name: "6529 Encrypted Messages",
  version: "2",
  salt: E2EE_SALT,
} as const;

const GRANT_TYPES = {
  MlsDeviceGrant: [
    { name: "statement", type: "string" },
    { name: "wallet", type: "address" },
    { name: "deviceKey", type: "bytes32" },
    { name: "ciphersuite", type: "uint16" },
    { name: "issuedAt", type: "uint64" },
    { name: "expiresAt", type: "uint64" },
    { name: "origin", type: "string" },
  ],
} as const;

const GRANT_TYPES_V2 = {
  MlsDeviceGrant: [
    { name: "statement", type: "string" },
    { name: "wallet", type: "address" },
    { name: "deviceKey", type: "bytes32" },
    { name: "ciphersuites", type: "uint16[]" },
    { name: "issuedAt", type: "uint64" },
    { name: "expiresAt", type: "uint64" },
    { name: "origin", type: "string" },
  ],
} as const;

const GRANT_PRIMARY_TYPE = "MlsDeviceGrant";

/**
 * Sign-in grants count only when signed on the app itself: exactly 6529.io
 * (and staging.6529.io outside production), never another 6529.io subdomain
 * (IPFS or media gateways serve content others control). Development builds
 * also accept local hosts.
 */
export const isAllowedE2eeGrantDomain = (domain: string): boolean =>
  isRecognizedGrantHost(domain);

interface GrantMessageFields {
  statement: string;
  wallet: `0x${string}`;
  deviceKey: `0x${string}`;
  issuedAt: bigint;
  expiresAt: bigint;
  origin: string;
}

type GrantTypedData =
  | {
      domain: typeof GRANT_DOMAIN;
      types: typeof GRANT_TYPES;
      primaryType: typeof GRANT_PRIMARY_TYPE;
      message: GrantMessageFields & { ciphersuite: number };
    }
  | {
      domain: typeof GRANT_DOMAIN_V2;
      types: typeof GRANT_TYPES_V2;
      primaryType: typeof GRANT_PRIMARY_TYPE;
      message: GrantMessageFields & { ciphersuites: number[] };
    };

/** expiresAt = floor(issuedAt/60)*60 + 180 days, minute aligned. */
export const grantExpiresAt = (issuedAtSeconds: number): number =>
  Math.floor(issuedAtSeconds / 60) * 60 + GRANT_LIFETIME_SECONDS;

const pad2 = (value: number): string => String(value).padStart(2, "0");

function formatGrantExpiry(expiresAtSeconds: number): string {
  const date = new Date(expiresAtSeconds * 1000);
  const day = `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
  return `${day} ${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
}

export function renderGrantStatement(
  deviceKey: string,
  expiresAtSeconds: number
): string {
  const body = deviceKey.toLowerCase().replace(/^0x/u, "");
  const short = `${body.slice(0, 8)}...${body.slice(-8)}`;
  return (
    `Let this device send and read end-to-end encrypted messages as you until ` +
    `${formatGrantExpiry(expiresAtSeconds)} UTC (device key ${short}). ` +
    `6529 cannot read these messages. This signature cannot move funds, ` +
    `change your handle or act as an admin, and it does not create a ` +
    `blockchain transaction or cost gas.`
  );
}

/** A new (v2) grant for this device: the suite set E2EE_GRANT_SUITES. */
export function buildGrant(input: {
  wallet: string;
  deviceKey: string;
  issuedAtSeconds: number;
  origin: string;
}): ApiE2eeDeviceGrant {
  const ciphersuites = [...E2EE_GRANT_SUITES];
  return {
    version: 2,
    wallet: input.wallet.toLowerCase(),
    device_key: input.deviceKey.toLowerCase(),
    ciphersuite: ciphersuites[0] ?? E2EE_CIPHERSUITE,
    ciphersuites,
    issued_at: input.issuedAtSeconds,
    expires_at: grantExpiresAt(input.issuedAtSeconds),
    origin: input.origin,
  };
}

export function buildGrantTypedData(grant: ApiE2eeDeviceGrant): GrantTypedData {
  if (!isAddress(grant.wallet, { strict: false })) {
    throw new Error("Grant wallet is not an address");
  }
  if (!isHex(grant.device_key.toLowerCase(), 32)) {
    throw new Error("Grant device key is not 32 bytes");
  }
  const fields: GrantMessageFields = {
    statement: renderGrantStatement(grant.device_key, grant.expires_at),
    wallet: getAddress(grant.wallet),
    deviceKey: grant.device_key.toLowerCase() as `0x${string}`,
    issuedAt: BigInt(grant.issued_at),
    expiresAt: BigInt(grant.expires_at),
    origin: grant.origin,
  };
  if (grant.version === 2) {
    // Field order matters only in the types; the message is keyed.
    return {
      domain: GRANT_DOMAIN_V2,
      types: GRANT_TYPES_V2,
      primaryType: GRANT_PRIMARY_TYPE,
      message: { ...fields, ciphersuites: [...(grant.ciphersuites ?? [])] },
    };
  }
  return {
    domain: GRANT_DOMAIN,
    types: GRANT_TYPES,
    primaryType: GRANT_PRIMARY_TYPE,
    message: { ...fields, ciphersuite: grant.ciphersuite },
  };
}

/** viem's typed-data parameter, for either grant version. */
type AnyTypedData = Parameters<typeof hashTypedData>[0];
const asTypedData = (typedData: GrantTypedData): AnyTypedData =>
  typedData as unknown as AnyTypedData;

export const computeGrantId = (grant: ApiE2eeDeviceGrant): `0x${string}` =>
  hashTypedData(asTypedData(buildGrantTypedData(grant)));

export const credentialIdentity = (wallet: string, grantId: string): string =>
  `${CREDENTIAL_PREFIX}:${wallet.toLowerCase()}:${grantId.toLowerCase()}`;

export function parseCredentialIdentity(
  identity: string
): { wallet: string; grantId: string } | null {
  const parts = identity.split(":");
  if (parts.length !== 3 || parts[0] !== CREDENTIAL_PREFIX) {
    return null;
  }
  const wallet = parts[1] ?? "";
  const grantId = parts[2] ?? "";
  if (!isHex(wallet, 20) || !isHex(grantId, 32)) {
    return null;
  }
  return { wallet, grantId };
}

/**
 * How a grant was accepted, in the terms signed drops use (#4520):
 * "eoa": the signature recovers to the wallet (verified);
 * "eip1271": this client's EIP-1271 check on Ethereum mainnet returned the
 * magic value (contract-verified);
 * "server": a contract-wallet grant this client could not check
 * (unverifiable), accepted only on the server's `verified_via` word as the
 * documented D109 2.2 residual and never reported as verified.
 */
export type GrantVerifiedVia = "eoa" | "eip1271" | "server";

export interface GrantVerification {
  /** The grant is acceptable (cryptographically or by the server's word). */
  ok: boolean;
  /**
   * Verified by this client (EOA recovery or its own EIP-1271 call) for an
   * origin it recognizes; "unrecognized-origin" in `reason` otherwise.
   */
  verified: boolean;
  via: GrantVerifiedVia | null;
  reason: string | null;
}

const failed = (reason: string): GrantVerification => ({
  ok: false,
  verified: false,
  via: null,
  reason,
});

interface VerifyGrantOptions {
  /** Unix ms; the time at which the grant must be valid. */
  atMs: number;
  verifyContractSignature?:
    | ((wallet: string, hash: string, sig: string) => Promise<boolean>)
    | undefined;
  /** When set, the device record must belong to this profile. */
  expectedProfileId?: string | undefined;
}

/**
 * Whether a grant's suite terms are well formed: v1 names 0x004F, v2 a
 * canonical set whose lowest entry is `ciphersuite`. This is about the
 * grant's authenticity only; which groups a device may join is enforced
 * where it matters (suite-filtered listings and claims, the WASM's add
 * check and the Welcome gate), so an earlier-suite device of a contact
 * still verifies during the move (D172).
 */
function checkGrantSuites(grant: ApiE2eeDeviceGrant): string | null {
  if (grant.version === 2) {
    if (!isCanonicalSuiteSet(grant.ciphersuites)) {
      return "ciphersuites";
    }
    return grant.ciphersuite === grant.ciphersuites[0] ? null : "ciphersuite";
  }
  // Server data: any other version (not just the typed ones) is refused.
  const version: unknown = grant.version;
  if (version !== undefined && version !== 1) {
    return "version";
  }
  return grant.ciphersuite === E2EE_LEGACY_CIPHERSUITE ? null : "ciphersuite";
}

function checkGrantFields(
  grant: ApiE2eeDeviceGrant,
  atMs: number
): string | null {
  const suiteError = checkGrantSuites(grant);
  if (suiteError) {
    return suiteError;
  }
  if (
    !Number.isInteger(grant.issued_at) ||
    !Number.isInteger(grant.expires_at)
  ) {
    return "times";
  }
  if (grant.expires_at % 60 !== 0) {
    return "not-minute-aligned";
  }
  if (grant.expires_at - grant.issued_at > GRANT_MAX_LIFETIME_SECONDS) {
    return "too-long";
  }
  if (grant.expires_at <= grant.issued_at) {
    return "times";
  }
  if (grant.expires_at * 1000 <= atMs) {
    return "expired";
  }
  return null;
}

async function recoverEoa(
  typedData: GrantTypedData,
  signature: string
): Promise<string | null> {
  if (!isHex(signature, 65)) {
    return null;
  }
  try {
    const signer = await recoverTypedDataAddress({
      ...asTypedData(typedData),
      signature: signature as `0x${string}`,
    });
    return signer.toLowerCase();
  } catch {
    return null;
  }
}

async function verifyContract(
  options: VerifyGrantOptions,
  wallet: string,
  grantId: string,
  signature: string
): Promise<boolean | null> {
  if (!options.verifyContractSignature) {
    return null;
  }
  try {
    return await options.verifyContractSignature(wallet, grantId, signature);
  } catch {
    return null;
  }
}

async function recoverMessageSigner(
  message: string,
  signature: string
): Promise<string | null> {
  if (!isHex(signature, 65)) {
    return null;
  }
  try {
    const signer = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });
    return signer.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * NC8: the record's grant fields must be exactly the MLS resource of the
 * signed sign-in message (key, ciphersuite, expiry), its wallet, domain and
 * Issued At, so a server cannot attach a sign-in grant to another key.
 */
function checkLoginGrantTerms(
  device: ApiE2eeDevice,
  message: string
): string | null {
  const parsed = parseDeviceGrantMessage(message);
  const mls = parsed?.mls;
  if (!parsed || !mls) {
    return "login-grant-malformed";
  }
  if (!isAllowedE2eeGrantDomain(parsed.domain)) {
    return "login-grant-domain";
  }
  const grant = device.grant;
  const matches =
    mls.deviceKeyHex === grant.device_key.toLowerCase() &&
    sameSuites(mls.version, mls.ciphersuites, grant) &&
    mls.expiresAtSeconds === grant.expires_at &&
    parsed.address.toLowerCase() === grant.wallet.toLowerCase() &&
    parsed.domain === grant.origin.toLowerCase() &&
    parseSiweIssuedAtSeconds(message) === grant.issued_at;
  return matches ? null : "login-grant-mismatch";
}

/** The signed version and suites equal the record's (v1: one suite). */
function sameSuites(
  version: 1 | 2,
  suites: readonly number[],
  grant: ApiE2eeDeviceGrant
): boolean {
  const recordVersion = grant.version === 2 ? 2 : 1;
  const recordSuites =
    recordVersion === 2 ? (grant.ciphersuites ?? []) : [grant.ciphersuite];
  return (
    version === recordVersion &&
    suites.length === recordSuites.length &&
    suites.every((suite, index) => suite === recordSuites[index])
  );
}

/** Combined sign-in grant (NC8): EIP-191 over the exact SIWE message. */
async function verifyLoginGrant(
  device: ApiE2eeDevice,
  message: string,
  options: VerifyGrantOptions
): Promise<GrantVerification> {
  const termsError = checkLoginGrantTerms(device, message);
  if (termsError) {
    return failed(termsError);
  }
  const grantId = hashMessage(message);
  if (grantId !== device.grant_id.toLowerCase()) {
    return failed("grant-id-mismatch");
  }
  const wallet = device.grant.wallet.toLowerCase();
  const signer = await recoverMessageSigner(message, device.wallet_signature);
  if (signer === wallet) {
    return { ok: true, verified: true, via: "eoa", reason: null };
  }
  // As for signed drops, contract code is only read on Ethereum mainnet; a
  // sign-in on another chain cannot be contract-verified (unverifiable).
  if (parseDeviceGrantMessage(message)?.chainId !== ETHEREUM_MAINNET_CHAIN_ID) {
    return unverifiable(device);
  }
  return await verifyContractOrServer(device, options, wallet, grantId);
}

/**
 * The record's grant fields must be exactly the encrypted-messages half of a
 * signed app grant (6529 Mobile or Desktop): key, ciphersuite, wallet,
 * origin, Issued At and expiry.
 */
function checkAppGrantTerms(
  device: ApiE2eeDevice,
  fields: AppGrantFields
): string | null {
  const mls = fields.mls;
  if (!mls) {
    return "app-grant-without-e2ee";
  }
  const grant = device.grant;
  const matches =
    mls.deviceKeyHex === grant.device_key.toLowerCase() &&
    sameSuites(fields.version === 1 ? 1 : 2, mls.ciphersuites, grant) &&
    fields.wallet === grant.wallet.toLowerCase() &&
    fields.origin === grant.origin &&
    fields.issuedAtSeconds === grant.issued_at &&
    fields.expiresAtSeconds === grant.expires_at;
  return matches ? null : "app-grant-mismatch";
}

/** App grant (EIP-712 DeviceGrant, one signature for both keys). */
async function verifyAppGrant(
  device: ApiE2eeDevice,
  message: string,
  options: VerifyGrantOptions
): Promise<GrantVerification> {
  const parsed = parseAppGrantMessage(message);
  if (!parsed) {
    return failed("app-grant-malformed");
  }
  const termsError = checkAppGrantTerms(device, parsed.fields);
  if (termsError) {
    return failed(termsError);
  }
  const grantId = computeAppGrantId(parsed.message);
  if (grantId !== device.grant_id.toLowerCase()) {
    return failed("grant-id-mismatch");
  }
  const wallet = device.grant.wallet.toLowerCase();
  if (
    isHex(device.wallet_signature, 65) &&
    (await recoverAppGrantSigner(parsed.message, device.wallet_signature)) ===
      wallet
  ) {
    return { ok: true, verified: true, via: "eoa", reason: null };
  }
  return await verifyContractOrServer(device, options, wallet, grantId);
}

/** A contract-wallet grant this client cannot check: never verified. */
const unverifiable = (device: ApiE2eeDevice): GrantVerification =>
  device.verified_via === "eip1271"
    ? { ok: true, verified: false, via: "server", reason: null }
    : failed("bad-signature");

async function verifyContractOrServer(
  device: ApiE2eeDevice,
  options: VerifyGrantOptions,
  wallet: string,
  grantId: string
): Promise<GrantVerification> {
  const contractResult = await verifyContract(
    options,
    wallet,
    grantId,
    device.wallet_signature
  );
  if (contractResult === true) {
    return { ok: true, verified: true, via: "eip1271", reason: null };
  }
  // null: no RPC, or the check threw. Unverifiable, never verified.
  return contractResult === null
    ? unverifiable(device)
    : failed("bad-signature");
}

/**
 * Contract 2.2 verification of a device record as a client. Contract wallets
 * without an available verifier are accepted on the server's `verified_via`
 * word and reported as `verified: false` (the documented residual). A device
 * enrolled by a combined sign-in grant (NC8) carries the signed SIWE message
 * instead of an EIP-712 grant and is verified against it; one enrolled by an
 * app grant (6529 Mobile or Desktop) carries that grant's typed data as JSON.
 */
export async function verifyGrant(
  device: ApiE2eeDevice,
  options: VerifyGrantOptions
): Promise<GrantVerification> {
  const grant = device.grant;
  if (grant.device_key.toLowerCase() !== device.device_key.toLowerCase()) {
    return failed("device-key-mismatch");
  }
  if (
    options.expectedProfileId !== undefined &&
    device.profile_id !== options.expectedProfileId
  ) {
    return failed("profile-mismatch");
  }
  const fieldError = checkGrantFields(grant, options.atMs);
  if (fieldError) {
    return failed(fieldError);
  }
  if (typeof device.grant_message === "string") {
    // A sign-in grant's domain is checked against the app hosts above.
    return isAppGrantMessage(device.grant_message)
      ? withRecognizedOrigin(
          grant.origin,
          await verifyAppGrant(device, device.grant_message, options)
        )
      : await verifyLoginGrant(device, device.grant_message, options);
  }
  return withRecognizedOrigin(
    grant.origin,
    await verifyTypedGrant(device, options)
  );
}

/**
 * A grant whose signed origin is neither a 6529 app nor a host of the 6529
 * app is never reported as verified by this client. It stays acceptable
 * (ok): honest clients may have signed origins this list does not know, such
 * as earlier app builds, and every client must keep agreeing on which
 * devices a group may hold.
 */
const withRecognizedOrigin = (
  origin: string,
  result: GrantVerification
): GrantVerification =>
  result.verified && !isRecognizedAppGrantOrigin(origin)
    ? { ...result, verified: false, reason: "unrecognized-origin" }
    : result;

/** An encrypted-messages grant: EIP-712 MlsDeviceGrant over the record. */
async function verifyTypedGrant(
  device: ApiE2eeDevice,
  options: VerifyGrantOptions
): Promise<GrantVerification> {
  const grant = device.grant;
  let typedData: GrantTypedData;
  try {
    typedData = buildGrantTypedData(grant);
  } catch {
    return failed("malformed");
  }
  const grantId = hashTypedData(asTypedData(typedData));
  if (grantId !== device.grant_id.toLowerCase()) {
    return failed("grant-id-mismatch");
  }
  const wallet = grant.wallet.toLowerCase();
  const signer = await recoverEoa(typedData, device.wallet_signature);
  if (signer === wallet) {
    return { ok: true, verified: true, via: "eoa", reason: null };
  }
  return await verifyContractOrServer(device, options, wallet, grantId);
}
