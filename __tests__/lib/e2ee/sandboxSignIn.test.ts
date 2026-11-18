/**
 * @jest-environment node
 *
 * The local E2EE sandbox's web sign-in (tests/support/e2ee/sandboxSignIn.cjs)
 * renders challenges in CommonJS. The app signs only a challenge its own
 * parser accepts, so every rendered challenge must pass that check exactly:
 * the combined grant (signing + MLS key) and the signing-only grant.
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { hashMessage } from "viem";
import {
  DEFAULT_DEVICE_SCOPES,
  isExpectedDeviceGrantMessage,
  parseDeviceGrantMessage,
} from "@/lib/device-signing/grant-message";
import { E2EE_GRANT_SUITES } from "@/lib/e2ee/grant";

jest.mock("@/config/devAuth", () => ({ isDevLikeEnv: () => true }));

const {
  createSandboxSignIn,
  renderChallenge,
} = require("../../../tests/support/e2ee/sandboxSignIn.cjs");

const ORIGIN = "http://localhost:3299";
const SIGNING_KEY = `0x${"ab".repeat(32)}`;
const MLS_KEY = `0x${"cd".repeat(32)}`;
// Not on a minute boundary: grants still expire on a whole minute.
const NOW = Date.UTC(2026, 10, 8, 12, 0, 7, 500);

const nonceQuery = (address: string, mls = true) => ({
  signer_address: address,
  client_type: "web",
  chain_id: "1",
  device_key: SIGNING_KEY,
  device_key_type: "ed25519",
  device_scopes: DEFAULT_DEVICE_SCOPES.join(","),
  // What the app asks for since D172: a v2 suite set.
  ...(mls
    ? { mls_device_key: MLS_KEY, mls_ciphersuites: E2EE_GRANT_SUITES.join(".") }
    : {}),
});

describe("E2EE sandbox sign-in challenges", () => {
  const account = privateKeyToAccount(generatePrivateKey());
  const profileId = "00000000-0000-4000-8000-00000000e2e1";
  const storeLoginGrant = jest.fn();
  const loginGrantRevokedAt = jest.fn((): number | null => null);
  const revokeLoginGrant = jest.fn();
  const signIn = createSandboxSignIn({
    walletUser: (wallet: string) =>
      wallet === account.address.toLowerCase() ? { profileId } : null,
    getDeliveryService: () => ({
      storeLoginGrant,
      loginGrantRevokedAt,
      revokeLoginGrant,
    }),
    now: () => NOW,
  });

  beforeEach(() => {
    storeLoginGrant.mockClear();
    revokeLoginGrant.mockClear();
    signIn.reset();
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders a combined challenge the app accepts for exactly these keys", () => {
    const { status, body } = signIn.issueNonce(
      nonceQuery(account.address),
      ORIGIN
    );
    expect(status).toBe(200);
    const expected = {
      message: body.signable_message,
      signerAddress: account.address,
      deviceKeyHex: SIGNING_KEY,
      scopes: DEFAULT_DEVICE_SCOPES,
      nowMs: NOW,
    };
    expect(
      isExpectedDeviceGrantMessage({
        ...expected,
        mls: { deviceKeyHex: MLS_KEY, ciphersuites: E2EE_GRANT_SUITES },
      })
    ).toBe(true);
    // Never a signing-only grant in disguise, nor another MLS key.
    expect(isExpectedDeviceGrantMessage(expected)).toBe(false);
    expect(
      isExpectedDeviceGrantMessage({
        ...expected,
        mls: { deviceKeyHex: SIGNING_KEY, ciphersuites: E2EE_GRANT_SUITES },
      })
    ).toBe(false);
    expect(parseDeviceGrantMessage(body.signable_message)).toMatchObject({
      domain: "localhost:3299",
      chainId: 1,
      mls: {
        version: 2,
        deviceKeyHex: MLS_KEY,
        ciphersuites: [...E2EE_GRANT_SUITES],
      },
    });
  });

  it("answers a grant v2 request (a suite set) with a v2 resource", () => {
    const { status, body } = signIn.issueNonce(
      { ...nonceQuery(account.address), mls_ciphersuites: "78.79" },
      ORIGIN
    );
    expect(status).toBe(200);
    const lastLine = body.signable_message.split("\n").at(-1);
    expect(lastLine).toMatch(
      new RegExp(
        String.raw`^- urn:6529:mls-device-grant:v2:78\.79:` +
          `${MLS_KEY.slice(2)}` +
          String.raw`:\d+$`
      )
    );
  });

  it("renders a signing-only challenge without an MLS key", () => {
    const message = renderChallenge({
      origin: ORIGIN,
      address: account.address,
      signing: {
        deviceKeyHex: SIGNING_KEY,
        scopes: DEFAULT_DEVICE_SCOPES,
        expiresAtSeconds: Math.floor(NOW / 60_000) * 60 + 86_400,
      },
      mls: null,
      issuedAtMs: NOW,
      nonce: "0123456789abcdef",
    });
    expect(
      isExpectedDeviceGrantMessage({
        message,
        signerAddress: account.address,
        deviceKeyHex: SIGNING_KEY,
        scopes: DEFAULT_DEVICE_SCOPES,
        nowMs: NOW,
      })
    ).toBe(true);
  });

  it("logs in with the wallet's signature, stores the grant and lists it", async () => {
    const { body: nonce } = signIn.issueNonce(
      nonceQuery(account.address),
      ORIGIN
    );
    const signature = await account.signMessage({
      message: nonce.signable_message,
    });
    const { status, body } = await signIn.login({
      client_type: "web",
      server_signature: nonce.server_signature,
      client_signature: signature,
      client_address: account.address,
      device_label: "Chrome on Windows",
    });

    expect(status).toBe(201);
    const grantId = hashMessage(nonce.signable_message).toLowerCase();
    expect(body).toMatchObject({
      role: profileId,
      client_type: "web",
      device_grant: {
        id: grantId,
        wallet: account.address.toLowerCase(),
        device_key: SIGNING_KEY,
        device_label: "Chrome on Windows",
        revoked_at: null,
      },
    });
    expect(storeLoginGrant).toHaveBeenCalledWith({
      message: nonce.signable_message,
      signature,
      wallet: account.address.toLowerCase(),
    });
    expect(signIn.listGrants(account.address.toLowerCase()).body).toEqual([
      body.device_grant,
    ]);
    // Like the backend, revoking the device it enrolled ends the grant.
    loginGrantRevokedAt.mockReturnValueOnce(NOW + 1);
    expect(signIn.listGrants(account.address.toLowerCase()).body).toEqual([
      { ...body.device_grant, revoked_at: NOW + 1 },
    ]);
    // A challenge is used once.
    await expect(
      signIn.login({
        server_signature: nonce.server_signature,
        client_signature: signature,
        client_address: account.address,
      })
    ).resolves.toMatchObject({ status: 401 });
  });

  it("revokes and acknowledges the caller's own grant, ending its device too", async () => {
    const { body: nonce } = signIn.issueNonce(
      nonceQuery(account.address),
      ORIGIN
    );
    await signIn.login({
      client_type: "web",
      server_signature: nonce.server_signature,
      client_signature: await account.signMessage({
        message: nonce.signable_message,
      }),
      client_address: account.address,
      device_label: "Chrome on Windows",
    });
    const wallet = account.address.toLowerCase();
    const grantId = hashMessage(nonce.signable_message).toLowerCase();
    const stranger = privateKeyToAccount(generatePrivateKey()).address;

    expect(signIn.acknowledgeGrant(stranger, grantId).status).toBe(404);
    expect(signIn.acknowledgeGrant(wallet, grantId)).toMatchObject({
      status: 200,
      body: { id: grantId, notice_acknowledged: true },
    });

    expect(signIn.revokeGrant(stranger, grantId).status).toBe(404);
    expect(revokeLoginGrant).not.toHaveBeenCalled();
    expect(signIn.revokeGrant(wallet, grantId)).toMatchObject({
      status: 200,
      body: { id: grantId, revoked_at: NOW },
    });
    // Like the backend, the encrypted-DMs device it enrolled ends with it.
    expect(revokeLoginGrant).toHaveBeenCalledWith(grantId);
    expect(signIn.listGrants(wallet).body).toEqual([
      expect.objectContaining({ id: grantId, revoked_at: NOW }),
    ]);
    // Idempotent: a second revoke keeps the first time and ends nothing new.
    expect(signIn.revokeGrant(wallet, grantId).body).toMatchObject({
      revoked_at: NOW,
    });
    expect(revokeLoginGrant).toHaveBeenCalledTimes(1);
    // An inactive grant can't be acknowledged (404, as on the backend).
    expect(signIn.acknowledgeGrant(wallet, grantId).status).toBe(404);
  });

  it("refuses to acknowledge a grant whose device was revoked", async () => {
    const { body: nonce } = signIn.issueNonce(
      nonceQuery(account.address),
      ORIGIN
    );
    await signIn.login({
      client_type: "web",
      server_signature: nonce.server_signature,
      client_signature: await account.signMessage({
        message: nonce.signable_message,
      }),
      client_address: account.address,
    });
    const grantId = hashMessage(nonce.signable_message).toLowerCase();
    loginGrantRevokedAt.mockReturnValue(NOW - 1);
    try {
      expect(
        signIn.acknowledgeGrant(account.address.toLowerCase(), grantId).status
      ).toBe(404);
      // Revoking it again reports the device's revocation time.
      expect(
        signIn.revokeGrant(account.address.toLowerCase(), grantId).body
      ).toMatchObject({ revoked_at: NOW - 1 });
      expect(revokeLoginGrant).not.toHaveBeenCalled();
    } finally {
      loginGrantRevokedAt.mockReturnValue(null);
    }
  });

  it("refuses a signature from another wallet", async () => {
    const { body: nonce } = signIn.issueNonce(
      nonceQuery(account.address),
      ORIGIN
    );
    const other = privateKeyToAccount(generatePrivateKey());
    await expect(
      signIn.login({
        server_signature: nonce.server_signature,
        client_signature: await other.signMessage({
          message: nonce.signable_message,
        }),
        client_address: account.address,
      })
    ).resolves.toMatchObject({ status: 401 });
    expect(storeLoginGrant).not.toHaveBeenCalled();
  });
});
