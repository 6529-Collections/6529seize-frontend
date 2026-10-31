/**
 * @jest-environment node
 */
import { hashMessage } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  buildDeviceGrantUrn,
  buildMlsDeviceGrantUrn,
  renderCombinedGrantStatement,
} from "@/lib/device-signing/grant-message";
import type { ApiE2eeDevice } from "@/lib/e2ee/api-types";
import {
  credentialIdentity,
  E2EE_CIPHERSUITE,
  verifyGrant,
} from "@/lib/e2ee/grant";

// NC8: a device record whose grant is a combined sign-in grant.
const account = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
);
const SIGNING_KEY =
  "0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a";
const MLS_KEY =
  "0x3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c";
const ISSUED_AT = 1792324800; // 2026-10-18T12:00:00Z
const EXPIRES_AT = 1807876800;
const atMs = (ISSUED_AT + 3600) * 1000;

const buildMessage = ({
  mlsKey = MLS_KEY,
  ciphersuite = E2EE_CIPHERSUITE,
  expiresAt = EXPIRES_AT,
}: {
  mlsKey?: string;
  ciphersuite?: number;
  expiresAt?: number;
} = {}): string => {
  const signing = {
    deviceKeyHex: SIGNING_KEY,
    scopes: ["post", "edit", "delete", "react"],
    expiresAtSeconds: expiresAt,
  };
  const mls = {
    deviceKeyHex: mlsKey,
    ciphersuite,
    expiresAtSeconds: expiresAt,
  };
  return [
    "https://staging.6529.io wants you to sign in with your Ethereum account:",
    account.address,
    "",
    renderCombinedGrantStatement(signing, mls),
    "",
    "URI: https://staging.6529.io",
    "Version: 1",
    "Chain ID: 1",
    "Nonce: a1b2c3d4e5f60718293a4b5c6d7e8f90",
    "Issued At: 2026-10-18T12:00:00.000Z",
    "Expiration Time: 2026-10-18T12:05:00.000Z",
    "Resources:",
    `- ${buildDeviceGrantUrn(signing)}`,
    `- ${buildMlsDeviceGrantUrn(mls)}`,
  ].join("\n");
};

const recordFor = async (
  message: string,
  overrides: Partial<ApiE2eeDevice> = {}
): Promise<ApiE2eeDevice> => ({
  device_key: MLS_KEY,
  profile_id: "profile-1",
  grant: {
    wallet: account.address.toLowerCase(),
    device_key: MLS_KEY,
    ciphersuite: E2EE_CIPHERSUITE,
    issued_at: ISSUED_AT,
    expires_at: EXPIRES_AT,
    origin: "staging.6529.io",
  },
  grant_id: hashMessage(message),
  wallet_signature: await account.signMessage({ message }),
  verified_via: "eoa",
  label: "Device",
  platform: "web",
  created_at: ISSUED_AT * 1000,
  last_seen_at: null,
  revoked_at: null,
  revocation: null,
  grant_message: message,
  ...overrides,
});

describe("verifyGrant: combined sign-in grants (NC8)", () => {
  it("verifies an EOA sign-in grant against the signed SIWE message", async () => {
    const message = buildMessage();
    await expect(
      verifyGrant(await recordFor(message), { atMs })
    ).resolves.toEqual({ ok: true, verified: true, via: "eoa", reason: null });
  });

  it("maps the credential to the sign-in grant id", () => {
    const message = buildMessage();
    expect(credentialIdentity(account.address, hashMessage(message))).toBe(
      `6529-e2ee-v1:${account.address.toLowerCase()}:${hashMessage(message)}`
    );
  });

  it.each([
    [
      "the record names another MLS key",
      {
        device_key: `0x${"ab".repeat(32)}`,
      },
    ],
    ["the record shifts the issue time", { issued_at: ISSUED_AT + 60 }],
    ["the record moves the origin", { origin: "6529.io" }],
    ["the record names another wallet", { wallet: `0x${"11".repeat(20)}` }],
  ])("rejects a record whose grant differs: %s", async (_name, change) => {
    const message = buildMessage();
    const base = await recordFor(message);
    const device_key = "device_key" in change ? change.device_key : MLS_KEY;
    const result = await verifyGrant(
      { ...base, device_key, grant: { ...base.grant, ...change } },
      { atMs }
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a sign-in grant signed for a site other than 6529", async () => {
    const message = buildMessage().replaceAll(
      "staging.6529.io",
      "evil.example"
    );
    const base = await recordFor(message);
    const result = await verifyGrant(
      { ...base, grant: { ...base.grant, origin: "evil.example" } },
      { atMs }
    );
    expect(result).toMatchObject({ ok: false, reason: "login-grant-domain" });
  });

  it.each(["ipfs.6529.io", "media.6529.io"])(
    "rejects a sign-in grant signed on the %s gateway",
    async (host) => {
      const message = buildMessage().replaceAll("staging.6529.io", host);
      const base = await recordFor(message);
      const result = await verifyGrant(
        { ...base, grant: { ...base.grant, origin: host } },
        { atMs }
      );
      expect(result).toMatchObject({ ok: false, reason: "login-grant-domain" });
    }
  );

  it("rejects a grant id that is not the message hash", async () => {
    const message = buildMessage();
    const result = await verifyGrant(
      await recordFor(message, { grant_id: `0x${"1".repeat(64)}` }),
      { atMs }
    );
    expect(result).toMatchObject({ ok: false, reason: "grant-id-mismatch" });
  });

  it("rejects a sign-in message signed by another wallet", async () => {
    const message = buildMessage();
    const other = privateKeyToAccount(generatePrivateKey());
    const result = await verifyGrant(
      await recordFor(message, {
        wallet_signature: await other.signMessage({ message }),
      }),
      { atMs }
    );
    expect(result).toMatchObject({ ok: false, reason: "bad-signature" });
  });

  it("rejects a sign-in message for another ciphersuite", async () => {
    // The classical suite 0x0001 the launch moved away from.
    const message = buildMessage({ ciphersuite: 1 });
    const base = await recordFor(message);
    const result = await verifyGrant(
      { ...base, grant: { ...base.grant, ciphersuite: 1 } },
      { atMs }
    );
    expect(result).toMatchObject({ ok: false, reason: "ciphersuite" });
  });

  it("rejects an expired sign-in grant", async () => {
    const message = buildMessage();
    const result = await verifyGrant(await recordFor(message), {
      atMs: EXPIRES_AT * 1000,
    });
    expect(result).toMatchObject({ ok: false, reason: "expired" });
  });

  it("rejects a message that is not a combined grant", async () => {
    const message = buildMessage().replace(
      /\n- urn:6529:mls-device-grant.*$/,
      ""
    );
    const result = await verifyGrant(await recordFor(message), { atMs });
    expect(result).toMatchObject({
      ok: false,
      reason: "login-grant-malformed",
    });
  });

  it("never verifies a contract-wallet grant whose check cannot run (unverifiable)", async () => {
    const message = buildMessage();
    const verifyContractSignature = jest
      .fn()
      .mockRejectedValue(new Error("E2EE_NO_RPC"));
    const record = await recordFor(message, {
      wallet_signature: "0x1234",
      verified_via: "eip1271",
    });
    // Accepted only on the server's word (D109 2.2 residual), never verified.
    await expect(
      verifyGrant(record, { atMs, verifyContractSignature })
    ).resolves.toEqual({
      ok: true,
      verified: false,
      via: "server",
      reason: null,
    });
    // Without that word it is not a grant at all.
    await expect(
      verifyGrant(
        { ...record, verified_via: "eoa" },
        { atMs, verifyContractSignature }
      )
    ).resolves.toMatchObject({ ok: false, reason: "bad-signature" });
  });

  it("does not contract-verify a sign-in made on another chain", async () => {
    const message = buildMessage().replace("Chain ID: 1", "Chain ID: 10");
    const verifyContractSignature = jest.fn().mockResolvedValue(true);
    const result = await verifyGrant(
      await recordFor(message, {
        wallet_signature: "0x1234",
        verified_via: "eip1271",
      }),
      { atMs, verifyContractSignature }
    );
    expect(result).toEqual({
      ok: true,
      verified: false,
      via: "server",
      reason: null,
    });
    expect(verifyContractSignature).not.toHaveBeenCalled();
  });

  it("verifies contract wallets with EIP-1271 over the message hash", async () => {
    const message = buildMessage();
    const verifyContractSignature = jest.fn().mockResolvedValue(true);
    const result = await verifyGrant(
      await recordFor(message, {
        wallet_signature: "0x1234",
        verified_via: "eip1271",
      }),
      { atMs, verifyContractSignature }
    );
    expect(result).toEqual({
      ok: true,
      verified: true,
      via: "eip1271",
      reason: null,
    });
    expect(verifyContractSignature).toHaveBeenCalledWith(
      account.address.toLowerCase(),
      hashMessage(message),
      "0x1234"
    );
  });

  it("keeps EIP-712 grants on their own path when no message is attached", async () => {
    const message = buildMessage();
    const result = await verifyGrant(
      await recordFor(message, { grant_message: null }),
      { atMs }
    );
    // Without the message the SIWE signature cannot verify as EIP-712.
    expect(result.ok).toBe(false);
  });
});
