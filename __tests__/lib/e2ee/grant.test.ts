/**
 * @jest-environment node
 */
import { privateKeyToAccount } from "viem/accounts";

import type { ApiE2eeDevice } from "@/lib/e2ee/api-types";
import {
  buildGrant,
  buildGrantTypedData,
  computeGrantId,
  credentialIdentity,
  E2EE_SALT,
  grantExpiresAt,
  parseCredentialIdentity,
  renderGrantStatement,
  verifyGrant,
} from "@/lib/e2ee/grant";

// Copied verbatim from the backend's shared vector file (e2ee-grant-vectors.json).
const VECTOR = {
  wallet_private_key:
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  salt: "0x4887f15a22b96f574a9f835b87e01e293dc7587acbfc13b5f224b89cd2d8c8aa",
  grant: {
    wallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    device_key:
      "0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
    ciphersuite: 1,
    issued_at: 1760270400,
    expires_at: 1775822400,
    origin: "staging.6529.io",
  },
  statement:
    "Let this device send and read end-to-end encrypted messages as you until 2026-04-10 12:00 UTC (device key d75a9801...f707511a). 6529 cannot read these messages. This signature cannot move funds, change your handle or act as an admin, and it does not create a blockchain transaction or cost gas.",
  checksummed_wallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  grant_id: "0x071474c69e205b3bb03834c8d99c99b2b826caad6eec914c233e67eaca3b2200",
  signature:
    "0xa280cc8335dfaf00e13a7b6b83a2c7f217398dde4d0649b560b3cb3c5e6a9a665bf3d84f35540243c0f462cedbe96153e00db006627f0a3fe75257c219c495f31b",
  verify_at_seconds: 1760274000,
} as const;

const deviceRecord = (overrides: Partial<ApiE2eeDevice> = {}): ApiE2eeDevice => ({
  device_key: VECTOR.grant.device_key,
  profile_id: "profile-1",
  grant: { ...VECTOR.grant },
  grant_id: VECTOR.grant_id,
  wallet_signature: VECTOR.signature,
  verified_via: "eoa",
  label: "Device",
  platform: "web",
  created_at: 1760270400000,
  last_seen_at: null,
  revoked_at: null,
  revocation: null,
  ...overrides,
});

const atMs = VECTOR.verify_at_seconds * 1000;

describe("grant (contract 2.1)", () => {
  it("uses the DN1 salt", () => {
    expect(E2EE_SALT).toBe(VECTOR.salt);
  });

  it("computes the 180-day minute-aligned expiry", () => {
    expect(grantExpiresAt(VECTOR.grant.issued_at)).toBe(VECTOR.grant.expires_at);
    expect(grantExpiresAt(VECTOR.grant.issued_at + 59)).toBe(VECTOR.grant.expires_at);
  });

  it("renders the exact statement", () => {
    expect(renderGrantStatement(VECTOR.grant.device_key, VECTOR.grant.expires_at)).toBe(
      VECTOR.statement
    );
  });

  it("builds the grant and typed data of the vector", () => {
    const grant = buildGrant({
      wallet: VECTOR.checksummed_wallet,
      deviceKey: VECTOR.grant.device_key,
      issuedAtSeconds: VECTOR.grant.issued_at,
      origin: VECTOR.grant.origin,
    });
    expect(grant).toEqual(VECTOR.grant);
    const typed = buildGrantTypedData(grant);
    expect(typed.primaryType).toBe("MlsDeviceGrant");
    expect(typed.domain).toEqual({
      name: "6529 Encrypted Messages",
      version: "1",
      salt: VECTOR.salt,
    });
    expect(typed.message).toEqual({
      statement: VECTOR.statement,
      wallet: VECTOR.checksummed_wallet,
      deviceKey: VECTOR.grant.device_key,
      ciphersuite: 1,
      issuedAt: BigInt(VECTOR.grant.issued_at),
      expiresAt: BigInt(VECTOR.grant.expires_at),
      origin: VECTOR.grant.origin,
    });
    expect(Object.keys(typed.types)).toEqual(["MlsDeviceGrant"]);
  });

  it("computes the vector grant_id", () => {
    expect(computeGrantId(VECTOR.grant)).toBe(VECTOR.grant_id);
  });

  it("signs exactly the vector signature with viem", async () => {
    const account = privateKeyToAccount(VECTOR.wallet_private_key);
    expect(account.address.toLowerCase()).toBe(VECTOR.grant.wallet);
    const signature = await account.signTypedData(buildGrantTypedData(VECTOR.grant));
    expect(signature).toBe(VECTOR.signature);
  });

  it("maps credentials to and from wallet + grant_id (2.3)", () => {
    const identity = credentialIdentity(VECTOR.checksummed_wallet, VECTOR.grant_id);
    expect(identity).toBe(`6529-e2ee-v1:${VECTOR.grant.wallet}:${VECTOR.grant_id}`);
    expect(parseCredentialIdentity(identity)).toEqual({
      wallet: VECTOR.grant.wallet,
      grantId: VECTOR.grant_id,
    });
    expect(parseCredentialIdentity("6529-e2ee-v2:0x00:0x00")).toBeNull();
    expect(parseCredentialIdentity(`6529-e2ee-v1:${VECTOR.grant.wallet}`)).toBeNull();
  });
});

describe("verifyGrant (contract 2.2)", () => {
  it("accepts the vector as an EOA grant", async () => {
    await expect(verifyGrant(deviceRecord(), { atMs })).resolves.toEqual({
      ok: true,
      verified: true,
      via: "eoa",
      reason: null,
    });
  });

  it("rejects an expired grant", async () => {
    const result = await verifyGrant(deviceRecord(), {
      atMs: VECTOR.grant.expires_at * 1000,
    });
    expect(result).toMatchObject({ ok: false, reason: "expired" });
  });

  it("rejects a grant longer than 181 days or not minute aligned", async () => {
    const long = deviceRecord({
      grant: { ...VECTOR.grant, issued_at: VECTOR.grant.issued_at - 2 * 86_400 },
    });
    await expect(verifyGrant(long, { atMs })).resolves.toMatchObject({
      ok: false,
      reason: "too-long",
    });
    const unaligned = deviceRecord({
      grant: { ...VECTOR.grant, expires_at: VECTOR.grant.expires_at + 1 },
    });
    await expect(verifyGrant(unaligned, { atMs })).resolves.toMatchObject({
      ok: false,
      reason: "not-minute-aligned",
    });
  });

  it("rejects a changed field (statement rebuilt, grant_id differs)", async () => {
    const changed = deviceRecord({ grant: { ...VECTOR.grant, origin: "6529.io" } });
    await expect(verifyGrant(changed, { atMs })).resolves.toMatchObject({
      ok: false,
      reason: "grant-id-mismatch",
    });
  });

  it("rejects a signature by another wallet", async () => {
    const other = privateKeyToAccount(
      "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
    );
    const signature = await other.signTypedData(buildGrantTypedData(VECTOR.grant));
    await expect(
      verifyGrant(deviceRecord({ wallet_signature: signature }), { atMs })
    ).resolves.toMatchObject({ ok: false, reason: "bad-signature" });
  });

  it("rejects a record whose device key differs from the grant", async () => {
    await expect(
      verifyGrant(deviceRecord({ device_key: `0x${"ab".repeat(32)}` }), { atMs })
    ).resolves.toMatchObject({ ok: false, reason: "device-key-mismatch" });
  });

  it("checks the expected profile", async () => {
    await expect(
      verifyGrant(deviceRecord(), { atMs, expectedProfileId: "someone-else" })
    ).resolves.toMatchObject({ ok: false, reason: "profile-mismatch" });
  });

  it("verifies contract wallets through the injected EIP-1271 verifier", async () => {
    const verifier = jest.fn().mockResolvedValue(true);
    const record = deviceRecord({ wallet_signature: "0x", verified_via: "eip1271" });
    await expect(
      verifyGrant(record, { atMs, verifyContractSignature: verifier })
    ).resolves.toEqual({ ok: true, verified: true, via: "eip1271", reason: null });
    expect(verifier).toHaveBeenCalledWith(VECTOR.grant.wallet, VECTOR.grant_id, "0x");
  });

  it("falls back to the server's word without an RPC (verified false)", async () => {
    const record = deviceRecord({ wallet_signature: "0x", verified_via: "eip1271" });
    await expect(verifyGrant(record, { atMs })).resolves.toEqual({
      ok: true,
      verified: false,
      via: "server",
      reason: null,
    });
    await expect(
      verifyGrant(deviceRecord({ wallet_signature: "0x" }), { atMs })
    ).resolves.toMatchObject({ ok: false });
  });

  it("rejects when the EIP-1271 verifier says no", async () => {
    const record = deviceRecord({ wallet_signature: "0x", verified_via: "eip1271" });
    await expect(
      verifyGrant(record, { atMs, verifyContractSignature: async () => false })
    ).resolves.toMatchObject({ ok: false, reason: "bad-signature" });
  });
});
