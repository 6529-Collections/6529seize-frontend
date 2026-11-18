/**
 * @jest-environment node
 */
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";

import { publicEnv } from "@/config/env";
import type { ApiE2eeDevice } from "@/lib/e2ee/api-types";
import {
  buildGrant,
  buildGrantTypedData,
  computeGrantId,
  credentialIdentity,
  E2EE_CIPHERSUITE,
  E2EE_LEGACY_CIPHERSUITE,
  E2EE_SALT,
  grantCoversSuite,
  grantExpiresAt,
  grantSuites,
  parseCredentialIdentity,
  renderGrantStatement,
  verifyGrant,
} from "@/lib/e2ee/grant";

/** viem's overloads do not take the grant v1 | v2 typed-data union (D172). */
const signTyped = (signer: PrivateKeyAccount, typedData: unknown) =>
  signer.signTypedData(
    typedData as Parameters<PrivateKeyAccount["signTypedData"]>[0]
  );

// Copied verbatim from the backend's shared vector file (e2ee-grant-vectors.json).
const VECTOR = {
  wallet_private_key:
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  salt: "0x4887f15a22b96f574a9f835b87e01e293dc7587acbfc13b5f224b89cd2d8c8aa",
  grant: {
    wallet: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    device_key:
      "0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
    ciphersuite: 79,
    issued_at: 1760270400,
    expires_at: 1775822400,
    origin: "staging.6529.io",
  },
  statement:
    "Let this device send and read end-to-end encrypted messages as you until 2026-04-10 12:00 UTC (device key d75a9801...f707511a). 6529 cannot read these messages. This signature cannot move funds, change your handle or act as an admin, and it does not create a blockchain transaction or cost gas.",
  checksummed_wallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  grant_id:
    "0xa0d5e242c157cdf18a9bec3c34decb63815d19d048621a3aee19a5fdb18243c0",
  signature:
    "0xfda409a1ca8e0464eeda29d07ffa05abd066f75999672156ed7f03d1e790bce9540fa06de1640e708841c8a635e66da45ef270e39a615f79599afc26c1f039091b",
  verify_at_seconds: 1760274000,
} as const;

// Grant v2 (D172) of the same wallet, key and times, signed for {0x004E}.
// Computed with ethers from the typed data alone (backend e2ee-grant-v2.test).
const VECTOR_V2 = {
  grant: {
    version: 2,
    wallet: VECTOR.grant.wallet,
    device_key: VECTOR.grant.device_key,
    ciphersuite: 78,
    ciphersuites: [78],
    issued_at: VECTOR.grant.issued_at,
    expires_at: VECTOR.grant.expires_at,
    origin: VECTOR.grant.origin,
  },
  grant_id:
    "0x644ebe12cda087010bf3e47ed0d4d495867f9b5add5247156cc6e7f0cb7b2a88",
  signature:
    "0x130adfb724a264fed9bebd65c0a4e379fb18f86f1a8239874fb2c68e7a2d3b5d66004f3537b6a8a516eca4476e8c38450a74fb0b714fe6b1619e8382bb8b8b1f1c",
} as const;

const v2Grant = (
  change: Partial<ApiE2eeDevice["grant"]> = {}
): ApiE2eeDevice["grant"] => ({
  ...VECTOR_V2.grant,
  ciphersuites: [...VECTOR_V2.grant.ciphersuites],
  ...change,
});

const deviceRecord = (
  overrides: Partial<ApiE2eeDevice> = {}
): ApiE2eeDevice => ({
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

  it("grants 0x004E to new devices; v1 grants named 0x004F (D172)", () => {
    expect(E2EE_CIPHERSUITE).toBe(0x004e);
    expect(E2EE_LEGACY_CIPHERSUITE).toBe(0x004f);
    expect(VECTOR.grant.ciphersuite).toBe(E2EE_LEGACY_CIPHERSUITE);
  });

  it("computes the 180-day minute-aligned expiry", () => {
    expect(grantExpiresAt(VECTOR.grant.issued_at)).toBe(
      VECTOR.grant.expires_at
    );
    expect(grantExpiresAt(VECTOR.grant.issued_at + 59)).toBe(
      VECTOR.grant.expires_at
    );
  });

  it("renders the exact statement", () => {
    expect(
      renderGrantStatement(VECTOR.grant.device_key, VECTOR.grant.expires_at)
    ).toBe(VECTOR.statement);
  });

  it("builds a v2 grant of the v2 vector, its typed data, id and signature", async () => {
    const grant = buildGrant({
      wallet: VECTOR.checksummed_wallet,
      deviceKey: VECTOR.grant.device_key,
      issuedAtSeconds: VECTOR.grant.issued_at,
      origin: VECTOR.grant.origin,
    });
    expect(grant).toEqual(VECTOR_V2.grant);
    const typed = buildGrantTypedData(grant);
    expect(typed.domain).toEqual({
      name: "6529 Encrypted Messages",
      version: "2",
      salt: VECTOR.salt,
    });
    expect(typed.message).toEqual({
      statement: VECTOR.statement,
      wallet: VECTOR.checksummed_wallet,
      deviceKey: VECTOR.grant.device_key,
      ciphersuites: [78],
      issuedAt: BigInt(VECTOR.grant.issued_at),
      expiresAt: BigInt(VECTOR.grant.expires_at),
      origin: VECTOR.grant.origin,
    });
    expect(computeGrantId(grant)).toBe(VECTOR_V2.grant_id);
    const account = privateKeyToAccount(VECTOR.wallet_private_key);
    await expect(signTyped(account, typed)).resolves.toBe(VECTOR_V2.signature);
  });

  it("builds the v1 typed data of the v1 vector", () => {
    const grant = { ...VECTOR.grant };
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
      ciphersuite: 79,
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
    const signature = await signTyped(
      account,
      buildGrantTypedData(VECTOR.grant)
    );
    expect(signature).toBe(VECTOR.signature);
  });

  it("maps credentials to and from wallet + grant_id (2.3)", () => {
    const identity = credentialIdentity(
      VECTOR.checksummed_wallet,
      VECTOR.grant_id
    );
    expect(identity).toBe(
      `6529-e2ee-v1:${VECTOR.grant.wallet}:${VECTOR.grant_id}`
    );
    expect(parseCredentialIdentity(identity)).toEqual({
      wallet: VECTOR.grant.wallet,
      grantId: VECTOR.grant_id,
    });
    expect(parseCredentialIdentity("6529-e2ee-v2:0x00:0x00")).toBeNull();
    expect(
      parseCredentialIdentity(`6529-e2ee-v1:${VECTOR.grant.wallet}`)
    ).toBeNull();
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

  describe("in the production build", () => {
    const baseEndpoint = publicEnv.BASE_ENDPOINT;
    beforeEach(() => {
      publicEnv.BASE_ENDPOINT = "https://6529.io";
    });
    afterEach(() => {
      publicEnv.BASE_ENDPOINT = baseEndpoint;
    });

    it("keeps a grant signed for staging.6529.io acceptable but never verified", async () => {
      await expect(verifyGrant(deviceRecord(), { atMs })).resolves.toEqual({
        ok: true,
        verified: false,
        via: "eoa",
        reason: "unrecognized-origin",
      });
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
      grant: {
        ...VECTOR.grant,
        issued_at: VECTOR.grant.issued_at - 2 * 86_400,
      },
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

  it("rejects a grant for the classical 0x0001 suite", async () => {
    const classical = deviceRecord({
      grant: { ...VECTOR.grant, ciphersuite: 1 },
    });
    await expect(verifyGrant(classical, { atMs })).resolves.toMatchObject({
      ok: false,
      reason: "ciphersuite",
    });
  });

  it("accepts the v2 vector (D172)", async () => {
    const record = deviceRecord({
      grant: v2Grant(),
      grant_id: VECTOR_V2.grant_id,
      wallet_signature: VECTOR_V2.signature,
    });
    await expect(verifyGrant(record, { atMs })).resolves.toEqual({
      ok: true,
      verified: true,
      via: "eoa",
      reason: null,
    });
  });

  it.each([
    ["an empty set", { ciphersuites: [] }, "ciphersuites"],
    ["an unordered set", { ciphersuites: [79, 78] }, "ciphersuites"],
    ["a repeated suite", { ciphersuites: [78, 78] }, "ciphersuites"],
    ["five suites", { ciphersuites: [1, 2, 3, 4, 78] }, "ciphersuites"],
    ["a ciphersuite other than the lowest", { ciphersuite: 79 }, "ciphersuite"],
  ])("rejects a v2 grant with %s", async (_label, change, reason) => {
    const record = deviceRecord({
      grant: v2Grant(change),
      grant_id: VECTOR_V2.grant_id,
      wallet_signature: VECTOR_V2.signature,
    });
    await expect(verifyGrant(record, { atMs })).resolves.toMatchObject({
      ok: false,
      reason,
    });
  });

  it("covers a suite through an alias only when the signed set names its source", () => {
    const aliases = [{ from: 0x004e, to: 0x0050 }];
    expect(grantSuites(v2Grant())).toEqual([0x004e]);
    expect(grantSuites(v2Grant(), aliases)).toEqual([0x004e, 0x0050]);
    expect(grantSuites({ ...VECTOR.grant }, aliases)).toEqual([0x004f]);
    expect(grantCoversSuite(v2Grant(), E2EE_CIPHERSUITE)).toBe(true);
    expect(grantCoversSuite({ ...VECTOR.grant }, E2EE_CIPHERSUITE)).toBe(false);
    // A v1 grant for any suite other than 0x004F covers nothing.
    expect(grantSuites({ ...VECTOR.grant, ciphersuite: 0x004e })).toEqual([]);
  });

  it("rejects an unknown grant version", async () => {
    const record = deviceRecord({
      grant: { ...VECTOR.grant, version: 3 as unknown as 2 },
    });
    await expect(verifyGrant(record, { atMs })).resolves.toMatchObject({
      ok: false,
      reason: "version",
    });
  });

  it("does not take a v2 signature for the v1 grant with the same terms", async () => {
    const record = deviceRecord({
      grant: { ...VECTOR.grant, ciphersuite: 78 },
      grant_id: VECTOR_V2.grant_id,
      wallet_signature: VECTOR_V2.signature,
    });
    await expect(verifyGrant(record, { atMs })).resolves.toMatchObject({
      ok: false,
    });
  });

  it("rejects a changed field (statement rebuilt, grant_id differs)", async () => {
    const changed = deviceRecord({
      grant: { ...VECTOR.grant, origin: "6529.io" },
    });
    await expect(verifyGrant(changed, { atMs })).resolves.toMatchObject({
      ok: false,
      reason: "grant-id-mismatch",
    });
  });

  it("rejects a signature by another wallet", async () => {
    const other = privateKeyToAccount(
      "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
    );
    const signature = await signTyped(other, buildGrantTypedData(VECTOR.grant));
    await expect(
      verifyGrant(deviceRecord({ wallet_signature: signature }), { atMs })
    ).resolves.toMatchObject({ ok: false, reason: "bad-signature" });
  });

  it("rejects a record whose device key differs from the grant", async () => {
    await expect(
      verifyGrant(deviceRecord({ device_key: `0x${"ab".repeat(32)}` }), {
        atMs,
      })
    ).resolves.toMatchObject({ ok: false, reason: "device-key-mismatch" });
  });

  it("checks the expected profile", async () => {
    await expect(
      verifyGrant(deviceRecord(), { atMs, expectedProfileId: "someone-else" })
    ).resolves.toMatchObject({ ok: false, reason: "profile-mismatch" });
  });

  it("verifies contract wallets through the injected EIP-1271 verifier", async () => {
    const verifier = jest.fn().mockResolvedValue(true);
    const record = deviceRecord({
      wallet_signature: "0x",
      verified_via: "eip1271",
    });
    await expect(
      verifyGrant(record, { atMs, verifyContractSignature: verifier })
    ).resolves.toEqual({
      ok: true,
      verified: true,
      via: "eip1271",
      reason: null,
    });
    expect(verifier).toHaveBeenCalledWith(
      VECTOR.grant.wallet,
      VECTOR.grant_id,
      "0x"
    );
  });

  it("falls back to the server's word without an RPC (verified false)", async () => {
    const record = deviceRecord({
      wallet_signature: "0x",
      verified_via: "eip1271",
    });
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
    const record = deviceRecord({
      wallet_signature: "0x",
      verified_via: "eip1271",
    });
    await expect(
      verifyGrant(record, { atMs, verifyContractSignature: async () => false })
    ).resolves.toMatchObject({ ok: false, reason: "bad-signature" });
  });
});
