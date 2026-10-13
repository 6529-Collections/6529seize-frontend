import {
  getAddress,
  hashTypedData,
  isAddress,
  keccak256,
  recoverTypedDataAddress,
  toBytes,
} from "viem";
import type { ApiE2eeDevice, ApiE2eeDeviceGrant } from "./api-types";
import { isHex } from "./bytes";

/** Contract section 2: wallet-signed EIP-712 device grants. */

export const E2EE_SALT = keccak256(
  toBytes("6529 Network pre-genesis interim 1")
);
export const E2EE_CIPHERSUITE = 1;
export const GRANT_LIFETIME_SECONDS = 15_552_000; // 180 days
export const GRANT_MAX_LIFETIME_SECONDS = 181 * 86_400;
export const CREDENTIAL_PREFIX = "6529-e2ee-v1";

export const GRANT_DOMAIN = {
  name: "6529 Encrypted Messages",
  version: "1",
  salt: E2EE_SALT,
} as const;

export const GRANT_TYPES = {
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

export const GRANT_PRIMARY_TYPE = "MlsDeviceGrant";

export interface GrantMessage {
  statement: string;
  wallet: `0x${string}`;
  deviceKey: `0x${string}`;
  ciphersuite: number;
  issuedAt: bigint;
  expiresAt: bigint;
  origin: string;
}

export interface GrantTypedData {
  domain: typeof GRANT_DOMAIN;
  types: typeof GRANT_TYPES;
  primaryType: typeof GRANT_PRIMARY_TYPE;
  message: GrantMessage;
}

/** expiresAt = floor(issuedAt/60)*60 + 180 days, minute aligned. */
export const grantExpiresAt = (issuedAtSeconds: number): number =>
  Math.floor(issuedAtSeconds / 60) * 60 + GRANT_LIFETIME_SECONDS;

const pad2 = (value: number): string => String(value).padStart(2, "0");

export function formatGrantExpiry(expiresAtSeconds: number): string {
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

export interface VerifyGrantOptions {
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

/**
 * Contract 2.2 verification of a device record as a client. Contract wallets
 * without an available verifier are accepted on the server's `verified_via`
 * word and reported as `verified: false` (the documented residual).
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
  const contractResult = await verifyContract(
    options,
    wallet,
    grantId,
    device.wallet_signature
  );
  if (contractResult === true) {
    return { ok: true, verified: true, via: "eip1271", reason: null };
  }
  if (contractResult === null && device.verified_via === "eip1271") {
    return { ok: true, verified: false, via: "server", reason: null };
  }
  return failed("bad-signature");
}
