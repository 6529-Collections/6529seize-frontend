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
import { getNodeEnv } from "@/config/env";
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
import type { ApiE2eeDevice, ApiE2eeDeviceGrant } from "./api-types";
import { isHex } from "./bytes";

/** Contract section 2: wallet-signed EIP-712 device grants. */

export const E2EE_SALT = keccak256(
  toBytes("6529 Network pre-genesis interim 1")
);
/**
 * MLS_128_MLKEM768X25519_AES128GCM_SHA256_Ed25519 (0x004F, contract 3.6):
 * X-Wing hybrid ML-KEM-768 + X25519. The only suite; it must equal the WASM
 * module's `ciphersuite`, and it is also the suite a combined sign-in grant
 * (NC8) names. A draft code point: if it changes, devices stored
 * under the old value re-enroll (engine/enroll.ts).
 */
export const E2EE_CIPHERSUITE = 0x004f;
const ETHEREUM_MAINNET_CHAIN_ID = 1;
const GRANT_LIFETIME_SECONDS = 15_552_000; // 180 days
const GRANT_MAX_LIFETIME_SECONDS = 181 * 86_400;
const CREDENTIAL_PREFIX = "6529-e2ee-v1";

const GRANT_DOMAIN = {
  name: "6529 Encrypted Messages",
  version: "1",
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

const GRANT_PRIMARY_TYPE = "MlsDeviceGrant";

/** The app hosts a combined sign-in grant (NC8) may name, exactly. */
const APP_GRANT_HOSTS: ReadonlySet<string> = new Set([
  "6529.io",
  "staging.6529.io",
]);

/** Builds that may accept local hosts; anything else fails closed. */
const DEV_BUILD_ENVS: ReadonlySet<string> = new Set([
  "development",
  "test",
  "local",
]);

/** Local development host names (dev builds only), any port. */
const DEV_GRANT_HOSTNAMES: ReadonlySet<string> = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
]);

const isDevGrantHost = (host: string): boolean => {
  let hostname: string;
  try {
    hostname = new URL(`https://${host}`).hostname;
  } catch {
    return false;
  }
  return (
    DEV_GRANT_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".test")
  );
};

/**
 * The host a SIWE domain names, or null unless it is exactly one bare host
 * (no scheme, path, query, fragment, user info, whitespace or empty label).
 */
function toExactHost(domain: string): string | null {
  const value = domain.toLowerCase();
  if (value.split(".").includes("")) {
    return null;
  }
  try {
    return new URL(`https://${value}`).host === value ? value : null;
  } catch {
    return null;
  }
}

/**
 * Sign-in grants count only when signed on the app itself: exactly 6529.io
 * or staging.6529.io, never another 6529.io subdomain (IPFS or media
 * gateways serve content others control). Development builds also accept
 * local hosts.
 */
export function isAllowedE2eeGrantDomain(domain: string): boolean {
  const host = toExactHost(domain);
  if (host === null) {
    return false;
  }
  if (APP_GRANT_HOSTS.has(host)) {
    return true;
  }
  return DEV_BUILD_ENVS.has(getNodeEnv() ?? "") && isDevGrantHost(host);
}

interface GrantMessage {
  statement: string;
  wallet: `0x${string}`;
  deviceKey: `0x${string}`;
  ciphersuite: number;
  issuedAt: bigint;
  expiresAt: bigint;
  origin: string;
}

interface GrantTypedData {
  domain: typeof GRANT_DOMAIN;
  types: typeof GRANT_TYPES;
  primaryType: typeof GRANT_PRIMARY_TYPE;
  message: GrantMessage;
}

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

export function buildGrant(input: {
  wallet: string;
  deviceKey: string;
  issuedAtSeconds: number;
  origin: string;
}): ApiE2eeDeviceGrant {
  return {
    wallet: input.wallet.toLowerCase(),
    device_key: input.deviceKey.toLowerCase(),
    ciphersuite: E2EE_CIPHERSUITE,
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
  return {
    domain: GRANT_DOMAIN,
    types: GRANT_TYPES,
    primaryType: GRANT_PRIMARY_TYPE,
    message: {
      statement: renderGrantStatement(grant.device_key, grant.expires_at),
      wallet: getAddress(grant.wallet),
      deviceKey: grant.device_key.toLowerCase() as `0x${string}`,
      ciphersuite: grant.ciphersuite,
      issuedAt: BigInt(grant.issued_at),
      expiresAt: BigInt(grant.expires_at),
      origin: grant.origin,
    },
  };
}

export const computeGrantId = (grant: ApiE2eeDeviceGrant): `0x${string}` =>
  hashTypedData(buildGrantTypedData(grant));

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
  /** Verified by this client (EOA recovery or its own EIP-1271 call). */
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

function checkGrantFields(
  grant: ApiE2eeDeviceGrant,
  atMs: number
): string | null {
  if (grant.ciphersuite !== E2EE_CIPHERSUITE) {
    return "ciphersuite";
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
      ...typedData,
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
    mls.ciphersuite === grant.ciphersuite &&
    mls.expiresAtSeconds === grant.expires_at &&
    parsed.address.toLowerCase() === grant.wallet.toLowerCase() &&
    parsed.domain === grant.origin.toLowerCase() &&
    parseSiweIssuedAtSeconds(message) === grant.issued_at;
  return matches ? null : "login-grant-mismatch";
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
    mls.ciphersuite === grant.ciphersuite &&
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
    return isAppGrantMessage(device.grant_message)
      ? await verifyAppGrant(device, device.grant_message, options)
      : await verifyLoginGrant(device, device.grant_message, options);
  }
  let typedData: GrantTypedData;
  try {
    typedData = buildGrantTypedData(grant);
  } catch {
    return failed("malformed");
  }
  const grantId = hashTypedData(typedData);
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
