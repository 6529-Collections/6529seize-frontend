"use strict";

/**
 * Web sign-in with device grants for the local E2EE sandbox (NC8).
 *
 * - `GET /api/auth/session-nonce` issues the Sign-In with Ethereum challenge
 *   the backend renders for a device grant, combined with the MLS device
 *   grant when the request names an MLS key.
 * - `POST /api/auth/session-login` checks the wallet signature against that
 *   challenge, stores a combined grant for `/e2ee/devices/login-grant` and
 *   answers with the web session and the stored device grant.
 * - `GET /api/device-grants` lists the caller's grants.
 *
 * The statement mirrors lib/device-signing/grant-message.ts byte for byte;
 * __tests__/tests/sandboxSignIn.test.ts checks every challenge it renders
 * with the app's own parser. Test-only: loopback sandbox, throwaway keys.
 */

const crypto = require("node:crypto");
const { getAddress, hashMessage, recoverMessageAddress } = require("viem");

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const GRANT_TTL_SECONDS = 180 * 24 * 60 * 60;
const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/u;
const HEX_KEY = /^0x[0-9a-f]{64}$/u;
const SCOPE_NOUNS = Object.freeze({
  post: "posts",
  edit: "edits",
  delete: "deletes",
  react: "reactions",
  vote: "votes",
});
const UTC_MONTHS = Object.freeze([
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]);

const stripHex = (hex) => String(hex).toLowerCase().replace(/^0x/u, "");

const fingerprint = (hex) => {
  const key = stripHex(hex);
  return `${key.slice(0, 8)}...${key.slice(-8)}`;
};

const formatExpiryDate = (expiresAtSeconds) => {
  const date = new Date(expiresAtSeconds * 1000);
  return `${date.getUTCDate()} ${UTC_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

const englishList = (items) =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

const describeScopes = (scopes) =>
  englishList(scopes.map((scope) => SCOPE_NOUNS[scope] ?? scope));

/** renderDeviceGrantStatement in grant-message.ts. */
function renderSigningStatement(signing) {
  return (
    `Sign in to 6529 and turn on signed messages on this device until ` +
    `${formatExpiryDate(signing.expiresAtSeconds)}. ` +
    `This device will sign your ${describeScopes(signing.scopes)} ` +
    `so anyone can verify they came from your wallet. ` +
    `It can't move funds, change your handle, add devices or act as an admin. ` +
    `No transaction, no gas, no token approvals. ` +
    `(Device key ${fingerprint(signing.deviceKeyHex)})`
  );
}

/** renderCombinedGrantStatement (v1) in grant-message.ts. */
function renderCombinedStatement(signing, mls) {
  return (
    `Sign in to 6529 and turn on signed messages on this device until ` +
    `${formatExpiryDate(signing.expiresAtSeconds)}. ` +
    `This device will sign your ${describeScopes(signing.scopes)} ` +
    `so anyone can verify they came from your wallet. ` +
    `It will also encrypt (send) and decrypt (read) your end-to-end encrypted ` +
    `messages, which 6529.io cannot read. ` +
    `It can't move funds, change your handle, add devices or act as an admin. ` +
    `No transaction, no gas, no token approvals. ` +
    `(Device key ${fingerprint(signing.deviceKeyHex)}, ` +
    `encrypted messages key ${fingerprint(mls.deviceKeyHex)})`
  );
}

/** The challenge for `address` on `origin`, granting `signing` (and `mls`). */
function renderChallenge({ origin, address, signing, mls, issuedAtMs, nonce }) {
  const statement = mls
    ? renderCombinedStatement(signing, mls)
    : renderSigningStatement(signing);
  return [
    `${origin} wants you to sign in with your Ethereum account:`,
    getAddress(address),
    "",
    statement,
    "",
    `URI: ${origin}`,
    "Version: 1",
    "Chain ID: 1",
    `Nonce: ${nonce}`,
    `Issued At: ${new Date(issuedAtMs).toISOString()}`,
    `Expiration Time: ${new Date(issuedAtMs + CHALLENGE_TTL_MS).toISOString()}`,
    "Resources:",
    `- urn:6529:device-grant:v1:ed25519:${stripHex(signing.deviceKeyHex)}:${signing.scopes.join(".")}:${signing.expiresAtSeconds}`,
    ...(mls
      ? [
          `- urn:6529:mls-device-grant:v${mls.version}:${mls.ciphersuites.join(".")}:${stripHex(mls.deviceKeyHex)}:${mls.expiresAtSeconds}`,
        ]
      : []),
  ].join("\n");
}

/** The grant terms a nonce request asks for, or an error message. */
function parseGrantRequest(query, nowMs) {
  const address = query.signer_address;
  if (!HEX_ADDRESS.test(address || "")) {
    return { error: "signer_address" };
  }
  if (!query.device_key) {
    return { error: "device_key" };
  }
  const deviceKeyHex = String(query.device_key).toLowerCase();
  const scopes = String(query.device_scopes || "").split(",");
  if (
    !HEX_KEY.test(deviceKeyHex) ||
    query.device_key_type !== "ed25519" ||
    !scopes.includes("post")
  ) {
    return { error: "device grant" };
  }
  // Whole minutes, as the backend issues them (the app refuses others).
  const expiresAtSeconds = Math.floor(nowMs / 60_000) * 60 + GRANT_TTL_SECONDS;
  const signing = { deviceKeyHex, scopes, expiresAtSeconds };
  if (!query.mls_device_key) {
    return { address, signing, mls: null };
  }
  const mlsKey = String(query.mls_device_key).toLowerCase();
  // Grant v2 (D172) asks for a suite set ("78.79"); v1 for one suite.
  const v2 = query.mls_ciphersuites !== undefined;
  const ciphersuites = String(
    v2 ? query.mls_ciphersuites : query.mls_ciphersuite
  )
    .split(".")
    .map(Number);
  if (
    !HEX_KEY.test(mlsKey) ||
    !ciphersuites.every((suite) => Number.isInteger(suite) && suite > 0) ||
    (!v2 && ciphersuites.length !== 1)
  ) {
    return { error: "mls device grant" };
  }
  return {
    address,
    signing,
    mls: {
      version: v2 ? 2 : 1,
      deviceKeyHex: mlsKey,
      ciphersuites,
      expiresAtSeconds,
    },
  };
}

/**
 * Sign-in routes for the sandbox API. `walletUser(wallet)` names the sandbox
 * user (profile) that owns a lowercase wallet; `ds` is the fake delivery
 * service that registers sign-in granted MLS keys.
 */
function createSandboxSignIn({ walletUser, getDeliveryService, now = Date.now }) {
  /** server_signature -> issued challenge. */
  let challenges = new Map();
  /** Stored device grants, newest last. */
  let grants = [];

  function reset() {
    challenges = new Map();
    grants = [];
  }

  function issueNonce(query, origin) {
    const request = parseGrantRequest(query, now());
    if (request.error) {
      return { status: 400, body: { error: `Invalid ${request.error}.` } };
    }
    const issuedAtMs = now();
    const message = renderChallenge({
      origin,
      address: request.address,
      signing: request.signing,
      mls: request.mls,
      issuedAtMs,
      nonce: crypto.randomBytes(16).toString("hex"),
    });
    const serverSignature = `0x${crypto.randomBytes(65).toString("hex")}`;
    challenges.set(serverSignature, {
      ...request,
      message,
      origin,
      issuedAtMs,
      expiresAtMs: issuedAtMs + CHALLENGE_TTL_MS,
    });
    return {
      status: 200,
      body: { signable_message: message, server_signature: serverSignature },
    };
  }

  async function login(body) {
    const challenge = challenges.get(body?.server_signature);
    if (!challenge || challenge.expiresAtMs <= now()) {
      return { status: 401, body: { error: "Unknown or expired challenge." } };
    }
    challenges.delete(body.server_signature);
    const wallet = challenge.address.toLowerCase();
    const signer = await recoverMessageAddress({
      message: challenge.message,
      signature: body.client_signature,
    }).catch(() => null);
    const user = walletUser(wallet);
    if (
      signer?.toLowerCase() !== wallet ||
      String(body.client_address || "").toLowerCase() !== wallet ||
      !user
    ) {
      return { status: 401, body: { error: "Invalid client signature." } };
    }
    const grantId = hashMessage(challenge.message).toLowerCase();
    if (challenge.mls) {
      getDeliveryService().storeLoginGrant({
        message: challenge.message,
        signature: body.client_signature,
        wallet,
      });
    }
    const deviceGrant = {
      id: grantId,
      wallet,
      key_type: "ed25519",
      device_key: challenge.signing.deviceKeyHex,
      scopes: challenge.signing.scopes,
      device_label: String(body.device_label || "Browser").slice(0, 64),
      domain: new URL(challenge.origin).host,
      issued_at: challenge.issuedAtMs,
      expires_at: challenge.signing.expiresAtSeconds * 1000,
      created_at: now(),
      revoked_at: null,
      last_used_at: null,
    };
    grants.push(deviceGrant);
    return {
      status: 201,
      body: {
        address: challenge.address,
        role: user.profileId,
        access_token: "local-e2ee-sandbox-session",
        access_token_expires_at: new Date(now() + 60 * 60 * 1000).toISOString(),
        client_type: "web",
        device_grant: deviceGrant,
      },
    };
  }

  /** Newest first: the grants of the profile that owns `wallet`. */
  function listGrants(wallet) {
    const owner = walletUser(wallet)?.profileId ?? null;
    const own = (grant) =>
      owner === null
        ? grant.wallet === String(wallet || "").toLowerCase()
        : walletUser(grant.wallet)?.profileId === owner;
    return { status: 200, body: grants.filter(own).reverse() };
  }

  return { issueNonce, login, listGrants, reset };
}

module.exports = {
  createSandboxSignIn,
  renderChallenge,
  parseGrantRequest,
};
