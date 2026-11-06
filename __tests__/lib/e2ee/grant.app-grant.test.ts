/**
 * @jest-environment node
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  type AppGrantFields,
  buildAppGrantTypedData,
  computeAppGrantId,
} from "@/lib/device-signing/app-grant";
import type { ApiE2eeDevice } from "@/lib/e2ee/api-types";
import { E2EE_CIPHERSUITE, verifyGrant } from "@/lib/e2ee/grant";

// A device enrolled by an app grant (6529 Mobile or Desktop): one EIP-712
// signature for the signing key and this encrypted-messages key.
const account = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
);
const SIGNING_KEY =
  "0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a";
const MLS_KEY =
  "0x3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c";
const ISSUED_AT = 1792324800;
const EXPIRES_AT = 1807876800;
const atMs = (ISSUED_AT + 3600) * 1000;

const appGrant = (overrides: Partial<AppGrantFields> = {}): AppGrantFields => ({
  wallet: account.address.toLowerCase(),
  deviceKeyHex: SIGNING_KEY,
  scopes: ["post", "edit", "delete", "react"],
  mls: { deviceKeyHex: MLS_KEY, ciphersuite: E2EE_CIPHERSUITE },
  issuedAtSeconds: ISSUED_AT,
  expiresAtSeconds: EXPIRES_AT,
  origin: "6529 Desktop",
  ...overrides,
});

const storedMessage = (grant: AppGrantFields): string => {
  const { message } = buildAppGrantTypedData(grant);
  return JSON.stringify({
    ...message,
    issuedAt: Number(message.issuedAt),
    expiresAt: Number(message.expiresAt),
  });
};

const recordFor = async (
  grant: AppGrantFields = appGrant(),
  overrides: Partial<ApiE2eeDevice> = {},
  signer = account
): Promise<ApiE2eeDevice> => {
  const typedData = buildAppGrantTypedData(grant);
  return {
    device_key: MLS_KEY,
    profile_id: "profile-1",
    grant: {
      wallet: account.address.toLowerCase(),
      device_key: MLS_KEY,
      ciphersuite: E2EE_CIPHERSUITE,
      issued_at: ISSUED_AT,
      expires_at: EXPIRES_AT,
      origin: "6529 Desktop",
    },
    grant_id: computeAppGrantId(typedData.message),
    wallet_signature: await signer.signTypedData(typedData),
    verified_via: "eoa",
    label: "6529 Desktop on Windows",
    platform: "desktop",
    created_at: ISSUED_AT * 1000,
    last_seen_at: null,
    revoked_at: null,
    revocation: null,
    grant_message: storedMessage(grant),
    ...overrides,
  } as ApiE2eeDevice;
};

describe("verifyGrant: app grants (6529 Mobile and Desktop)", () => {
  it("verifies an EOA app grant against the signed typed data", async () => {
    await expect(verifyGrant(await recordFor(), { atMs })).resolves.toEqual({
      ok: true,
      verified: true,
      via: "eoa",
      reason: null,
    });
  });

  it.each([
    ["another MLS key", { device_key: `0x${"ab".repeat(32)}` }],
    ["another issue time", { issued_at: ISSUED_AT + 60 }],
    ["another origin", { origin: "6529.io" }],
    ["another wallet", { wallet: `0x${"11".repeat(20)}` }],
  ])("rejects a record whose grant names %s", async (_name, change) => {
    const base = await recordFor();
    const device_key = "device_key" in change ? change.device_key : MLS_KEY;
    const result = await verifyGrant(
      { ...base, device_key, grant: { ...base.grant, ...change } },
      { atMs }
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a signing-only app grant", async () => {
    const result = await verifyGrant(await recordFor(appGrant({ mls: null })), {
      atMs,
    });
    expect(result).toMatchObject({
      ok: false,
      reason: "app-grant-without-e2ee",
    });
  });

  it("rejects a grant id that is not the typed-data digest", async () => {
    const result = await verifyGrant(
      await recordFor(appGrant(), { grant_id: `0x${"1".repeat(64)}` }),
      { atMs }
    );
    expect(result).toMatchObject({ ok: false, reason: "grant-id-mismatch" });
  });

  it("rejects an app grant signed by another wallet", async () => {
    const other = privateKeyToAccount(generatePrivateKey());
    const result = await verifyGrant(await recordFor(appGrant(), {}, other), {
      atMs,
    });
    expect(result).toMatchObject({ ok: false, reason: "bad-signature" });
  });

  it("checks a contract wallet against the typed-data digest", async () => {
    const other = privateKeyToAccount(generatePrivateKey());
    const record = await recordFor(
      appGrant(),
      { verified_via: "eip1271" },
      other
    );
    const verifyContractSignature = jest.fn().mockResolvedValue(true);
    await expect(
      verifyGrant(record, { atMs, verifyContractSignature })
    ).resolves.toMatchObject({ ok: true, verified: true, via: "eip1271" });
    expect(verifyContractSignature).toHaveBeenCalledWith(
      account.address.toLowerCase(),
      record.grant_id,
      record.wallet_signature
    );
  });

  it("rejects a tampered stored message", async () => {
    const record = await recordFor();
    const result = await verifyGrant(
      {
        ...record,
        grant_message: record.grant_message!.replace(
          "6529 Desktop",
          "6529 Mobile"
        ),
      },
      { atMs }
    );
    expect(result.ok).toBe(false);
  });
});
