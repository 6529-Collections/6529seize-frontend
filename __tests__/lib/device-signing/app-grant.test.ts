/**
 * @jest-environment node
 */
import { keccak256, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { ApiDeviceGrantProof } from "@/generated/models/ApiDeviceGrantProof";
import {
  APP_GRANT_DOMAIN,
  type AppGrantFields,
  appGrantTimes,
  buildAppGrantTypedData,
  computeAppGrantId,
  isAppGrantMessage,
  parseAppGrantMessage,
  recoverAppGrantSigner,
} from "@/lib/device-signing/app-grant";
import { verifyDropSignedEvents } from "@/lib/device-signing/verify-signed-events";
import type { ApiDropSignedEvents } from "@/generated/models/ApiDropSignedEvents";
import { canonicalizeBody } from "@/lib/device-signing/canonical-json";
import { signEventId } from "@/lib/device-signing/ed25519";
import { computeInterimEventId } from "@/lib/device-signing/interim-event";
import type { ApiDeviceSignedEvent } from "@/generated/models/ApiDeviceSignedEvent";
import {
  importVectorPrivateKey,
  installNodeWebCrypto,
  VECTORS,
} from "./device-signing-test-utils";

// Shared app-grant vectors. The backend pins the same values in
// src/api-serverless/src/device-signing/app-device-grant.test.ts; keep them
// identical. Hardhat's first test account, never a real wallet.
const PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const WALLET = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const SIGNING_KEY =
  "0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a";
const MLS_KEY =
  "0x3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c";
const ISSUED_AT = 1792324800;
const EXPIRES_AT = 1807876800;
const SIGNING_STATEMENT =
  "Turn on signed messages on this device until 16 Apr 2027. This device will sign your posts, edits, deletes and reactions so anyone can verify they came from your wallet. It can't move funds, change your handle, add devices or act as an admin. No transaction, no gas, no token approvals. (Device key d75a9801...f707511a)";
const SIGNING_GRANT_ID =
  "0x82c7577579d677929ef813cff39ffae1bacd6f1ec1e858687105cfae289d0b58";
const SIGNING_SIGNATURE =
  "0x69929366712f0057f41a94a75751ff2d5bc8185378c8f9c7dd89b3ea49d96f7553adf2b2a37572f097bc10227832da7ad9ae96d90ad21680167fa5b067bf31141c";
const COMBINED_STATEMENT =
  "Turn on signed messages on this device until 16 Apr 2027. This device will sign your posts, edits, deletes and reactions so anyone can verify they came from your wallet. It will also encrypt (send) and decrypt (read) your end-to-end encrypted messages, which 6529.io cannot read. It can't move funds, change your handle, add devices or act as an admin. No transaction, no gas, no token approvals. (Device key d75a9801...f707511a, encrypted messages key 3d4017c3...2af4660c)";
const COMBINED_GRANT_ID =
  "0xd0bbd126db3e79a4a79f55d3a75463242282268e231d4fc1b221a01ca2296bbd";
const COMBINED_SIGNATURE =
  "0x9b3615eb0e12c83a031239c055da1b29e1786f13c115044d2dae7e9c4f386f504da1b6ad0f8c4fad0aeb878fe290045b7c85cb02adc469404c31713c00b383d61b";
// The backend's stored message for the signing-only vector.
const SIGNING_STORED_MESSAGE = `{"statement":"${SIGNING_STATEMENT}","wallet":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","deviceKey":"${SIGNING_KEY}","scopes":"post,edit,delete,react","mlsDeviceKey":"0x${"0".repeat(64)}","ciphersuite":0,"issuedAt":${ISSUED_AT},"expiresAt":${EXPIRES_AT},"origin":"6529 Desktop"}`;

const account = privateKeyToAccount(PRIVATE_KEY);

const fields = (overrides: Partial<AppGrantFields> = {}): AppGrantFields => ({
  wallet: WALLET,
  deviceKeyHex: SIGNING_KEY,
  scopes: ["post", "edit", "delete", "react"],
  mls: null,
  issuedAtSeconds: ISSUED_AT,
  expiresAtSeconds: EXPIRES_AT,
  origin: "6529 Desktop",
  ...overrides,
});

const combined = (overrides: Partial<AppGrantFields> = {}) =>
  fields({ mls: { deviceKeyHex: MLS_KEY, ciphersuite: 0x004f }, ...overrides });

/** What the backend stores: the signed typed message as JSON. */
const storedMessage = (grant: AppGrantFields): string => {
  const { message } = buildAppGrantTypedData(grant);
  return JSON.stringify({
    ...message,
    issuedAt: Number(message.issuedAt),
    expiresAt: Number(message.expiresAt),
  });
};

describe("app device grant (EIP-712)", () => {
  describe("shared vectors", () => {
    it("matches the backend's signing-only statement, digest and signature", async () => {
      const { message } = buildAppGrantTypedData(fields());
      expect(message.statement).toBe(SIGNING_STATEMENT);
      expect(computeAppGrantId(message)).toBe(SIGNING_GRANT_ID);
      await expect(
        account.signTypedData(buildAppGrantTypedData(fields()))
      ).resolves.toBe(SIGNING_SIGNATURE);
    });

    it("matches the backend's combined statement, digest and signature", async () => {
      const typedData = buildAppGrantTypedData(combined());
      expect(typedData.message.statement).toBe(COMBINED_STATEMENT);
      expect(computeAppGrantId(typedData.message)).toBe(COMBINED_GRANT_ID);
      await expect(account.signTypedData(typedData)).resolves.toBe(
        COMBINED_SIGNATURE
      );
      await expect(
        recoverAppGrantSigner(typedData.message, COMBINED_SIGNATURE)
      ).resolves.toBe(WALLET);
    });

    it("reads the backend's stored message", () => {
      expect(storedMessage(fields())).toBe(SIGNING_STORED_MESSAGE);
      const parsed = parseAppGrantMessage(SIGNING_STORED_MESSAGE);
      expect(parsed?.fields).toEqual(fields());
      expect(computeAppGrantId(parsed!.message)).toBe(SIGNING_GRANT_ID);
    });
  });

  it("uses the pre-genesis salt shared with encrypted-messages grants", () => {
    expect(APP_GRANT_DOMAIN.salt).toBe(
      keccak256(toBytes("6529 Network pre-genesis interim 1"))
    );
    expect(APP_GRANT_DOMAIN.salt).toBe(VECTORS.salt);
  });

  it("issues 180-day, minute-aligned grants", () => {
    expect(appGrantTimes(ISSUED_AT * 1000 + 59_999)).toEqual({
      issuedAtSeconds: ISSUED_AT + 59,
      expiresAtSeconds: ISSUED_AT + 180 * 86_400,
    });
  });

  it("round-trips the combined grant", () => {
    const text = storedMessage(combined());
    expect(isAppGrantMessage(text)).toBe(true);
    expect(parseAppGrantMessage(text)?.fields).toEqual(combined());
  });

  it.each([
    ["a statement for other fields", { statement: SIGNING_STATEMENT }],
    ["non-canonical scopes", { scopes: "react,post" }],
    ["no post scope", { scopes: "edit" }],
    ["an unaligned expiry", { expiresAt: EXPIRES_AT + 1 }],
    ["a lifetime over 181 days", { expiresAt: ISSUED_AT + 182 * 86_400 }],
    ["a reused MLS key", { mlsDeviceKey: SIGNING_KEY }],
    ["a non-ASCII origin", { origin: "6529 Désktop" }],
    ["a malformed wallet", { wallet: "0x1234" }],
  ])("rejects %s", (_name, override) => {
    const message = JSON.parse(storedMessage(combined())) as object;
    expect(
      parseAppGrantMessage(JSON.stringify({ ...message, ...override }))
    ).toBeNull();
  });

  it("never treats SIWE text or broken JSON as an app grant", () => {
    expect(
      isAppGrantMessage(
        "6529.io wants you to sign in with your Ethereum account:"
      )
    ).toBe(false);
    expect(parseAppGrantMessage("{not json")).toBeNull();
    expect(parseAppGrantMessage("[]")).toBeNull();
  });
});

describe("signed drops under an app grant", () => {
  const DROP_ID = "b0c5d6e7-1111-4222-8333-944455556666";
  const WAVE_ID = VECTORS.body.wave_id;

  beforeAll(installNodeWebCrypto);

  const grantProof = async (
    grant: AppGrantFields,
    overrides: Partial<ApiDeviceGrantProof> = {}
  ): Promise<ApiDeviceGrantProof> => {
    const typedData = buildAppGrantTypedData(grant);
    return {
      id: computeAppGrantId(typedData.message),
      wallet: grant.wallet,
      key_type: "ed25519",
      device_key: grant.deviceKeyHex,
      scopes: [...grant.scopes],
      device_label: "6529 app on iPhone",
      domain: grant.origin,
      issued_at: grant.issuedAtSeconds * 1000,
      expires_at: grant.expiresAtSeconds * 1000,
      created_at: grant.issuedAtSeconds * 1000,
      revoked_at: null,
      last_used_at: null,
      message: storedMessage(grant),
      wallet_signature: await account.signTypedData(typedData),
      chain_id: 1,
      ...overrides,
    } as ApiDeviceGrantProof;
  };

  const signedPost = async (
    grant: ApiDeviceGrantProof
  ): Promise<ApiDropSignedEvents> => {
    const seq = 1_793_000_000_000;
    const { canonical, bodyHash, bodySize } = canonicalizeBody({
      wave_id: WAVE_ID,
      parts: [{ content: "gm from the app" }],
    });
    const fieldsForId = {
      kind: 1,
      kindVersion: 1,
      wave: WAVE_ID,
      author: grant.wallet,
      keyType: 2,
      deviceKey: grant.device_key,
      authRef: grant.id,
      seq,
      anchor: 0,
      claimedTime: seq,
      refs: [DROP_ID],
      bodyHash,
      bodySize,
    };
    const id = computeInterimEventId(fieldsForId);
    const event = {
      id,
      kind: 1,
      kind_version: 1,
      wave: WAVE_ID,
      author: grant.wallet,
      key_type: 2,
      device_key: grant.device_key,
      auth_ref: grant.id,
      seq,
      anchor: 0,
      claimed_time: seq,
      refs: [DROP_ID],
      body: canonical,
      body_hash: bodyHash,
      body_size: bodySize,
      signature: await signEventId(await importVectorPrivateKey(), id),
      created_at: seq + 10,
    } as ApiDeviceSignedEvent;
    return {
      drop_id: DROP_ID,
      current_event_id: id,
      events: [event],
      grants: [grant],
    } as ApiDropSignedEvents;
  };

  // The vector device key is RFC 8032 test 1, the key the events are signed with.
  const appGrant = () =>
    combined({
      issuedAtSeconds: 1_792_900_000,
      expiresAtSeconds: 1_792_900_020 + 180 * 86_400,
    });

  it("verifies a post signed by a device an app grant turned on", async () => {
    const grant = await grantProof(appGrant());
    await expect(
      verifyDropSignedEvents(await signedPost(grant))
    ).resolves.toMatchObject({
      status: "signed",
      signature: { wallet: WALLET, walletSignature: "verified" },
    });
  });

  it.each([
    ["another origin", { domain: "6529.io" }],
    ["another chain", { chain_id: 10 }],
    ["other scopes", { scopes: ["post", "edit"] }],
    ["another expiry", { expires_at: 1 }],
  ])("rejects a proof whose stored terms say %s", async (_name, override) => {
    const grant = await grantProof(appGrant(), override);
    await expect(
      verifyDropSignedEvents(await signedPost(grant))
    ).resolves.toEqual({ status: "invalid" });
  });

  it("checks a contract wallet against the grant's EIP-712 digest", async () => {
    const other = privateKeyToAccount(`0x${"43".repeat(32)}`);
    const grant = await grantProof(appGrant());
    const proof = {
      ...grant,
      wallet_signature: await other.signTypedData(
        buildAppGrantTypedData(appGrant())
      ),
    };
    const isValidSignature = jest.fn().mockResolvedValue("0x1626ba7e");
    await expect(
      verifyDropSignedEvents(await signedPost(proof), {
        contractWallets: {
          hasCode: jest.fn().mockResolvedValue(true),
          isValidSignature,
        },
      })
    ).resolves.toMatchObject({
      status: "signed",
      signature: { walletSignature: "contract-verified" },
    });
    expect(isValidSignature).toHaveBeenCalledWith(
      expect.objectContaining({ hash: grant.id })
    );
  });
});
