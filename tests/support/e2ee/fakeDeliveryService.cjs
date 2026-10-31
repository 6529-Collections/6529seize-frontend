"use strict";

/**
 * In-memory E2EE delivery service implementing every contract 4.2 endpoint
 * with the server-side checks of sections 2.2, 2.4, 3.2, 4.2 and 7.1.
 *
 * Dependency-light (node built-ins + viem) so Jest tests and the Playwright
 * sandbox server can both mount it.
 *
 *   const ds = createFakeDeliveryService({ now });
 *   await ds.handle("GET", "e2ee/me", { profileId: "p1" });
 *   const api = createFakeApiClient(ds, "p1"); // E2eeApiClient for Jest
 */

const crypto = require("node:crypto");
const {
  encodeAbiParameters,
  getAddress,
  hashMessage,
  hashTypedData,
  keccak256,
  recoverMessageAddress,
  recoverTypedDataAddress,
  toBytes,
} = require("viem");

const ENTRY_BUCKETS = [
  2048, 8192, 32768, 131072, 262144, 524288, 1048576, 2097152,
];
const MESSAGE_BUCKETS = [512, 1024, 4096, 16384, 65536];
const MAX_DEVICES = 10;
const MAX_ONE_TIME = 100;
const MAX_KEY_PACKAGE_BYTES = 4096;
const MAX_WELCOME_BYTES = 3.5 * 1024 * 1024;
/** 0x004F, X-Wing (contract 3.6); the backend accepts no other suite. */
const E2EE_CIPHERSUITE = 0x004f;
const MAX_CHUNK_BYTES = 1024 * 1024;
const MAX_BLOB_BYTES = 25 * 1024 * 1024;
const MAX_PROPOSALS_PER_EPOCH = 64;
const REVOKED_VISIBLE_MS = 90 * 86_400_000;
const GRANT_MAX_LIFETIME_S = 181 * 86_400;
const ZERO32 = `0x${"0".repeat(64)}`;

const E2EE_SALT = keccak256(toBytes("6529 Network pre-genesis interim 1"));
const GRANT_DOMAIN = {
  name: "6529 Encrypted Messages",
  version: "1",
  salt: E2EE_SALT,
};
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
};

// ---------------------------------------------------------------------------
// Encodings (independent of lib/e2ee so the two implementations cross-check)
// ---------------------------------------------------------------------------

const isHex = (value, bytes) =>
  typeof value === "string" &&
  /^0x[0-9a-f]*$/.test(value) &&
  (bytes === undefined
    ? value.length % 2 === 0
    : value.length === 2 + bytes * 2);

const lower = (value) =>
  typeof value === "string" ? value.toLowerCase() : value;
const b64 = (bytes) => Buffer.from(bytes).toString("base64");
const unb64 = (value) => new Uint8Array(Buffer.from(value, "base64"));
const hexBytes = (hex) => Buffer.from(hex.slice(2), "hex");
const tag = (name) => keccak256(toBytes(name));

function H(name, fields) {
  return keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, ...fields.map(([type]) => ({ type }))],
      [tag(name), ...fields.map(([, value]) => value)]
    )
  );
}

const entryDigest = (
  g,
  epoch,
  kind,
  entryHash,
  commitment,
  nextKey,
  paddedLen
) =>
  H("6529.MlsEntry.v1", [
    ["bytes32", g],
    ["uint32", epoch],
    ["uint8", kind === "commit" ? 1 : 2],
    ["bytes32", entryHash],
    ["bytes32", commitment],
    ["bytes32", nextKey],
    ["uint32", paddedLen],
  ]);

const revokeDigest = (target, revoker, revokedAt) =>
  H("6529.MlsDeviceRevoke.v1", [
    ["bytes32", target],
    ["bytes32", revoker],
    ["uint64", BigInt(revokedAt)],
  ]);

const messageDigest = (g, epoch, body) =>
  H("6529.MlsMessageSig.v1", [
    ["bytes32", g],
    ["uint32", epoch],
    ["bytes32", keccak256(body)],
  ]);

function rosterDigest(g, epoch, deviceKeys) {
  // Byte order of the 32-byte keys equals code-unit order of lowercase hex.
  const sorted = [...deviceKeys]
    .map(lower)
    .sort((a, b) => (a < b ? -1 : Number(a > b)));
  const concat = Buffer.concat(sorted.map((key) => hexBytes(key)));
  return H("6529.MlsRoster.v1", [
    ["bytes32", g],
    ["uint32", epoch],
    ["bytes32", keccak256(new Uint8Array(concat))],
  ]);
}

/** Ed25519 over 32 raw digest bytes, with a JWK OKP public key. */
function verifyEd25519(publicKeyHex, digestHex, signatureHex) {
  if (!isHex(lower(publicKeyHex), 32) || !isHex(lower(signatureHex), 64)) {
    return false;
  }
  try {
    const key = crypto.createPublicKey({
      key: {
        kty: "OKP",
        crv: "Ed25519",
        x: hexBytes(lower(publicKeyHex)).toString("base64url"),
      },
      format: "jwk",
    });
    return crypto.verify(
      null,
      hexBytes(digestHex),
      key,
      hexBytes(lower(signatureHex))
    );
  } catch {
    return false;
  }
}

const pad2 = (value) => String(value).padStart(2, "0");

function grantStatement(deviceKey, expiresAt) {
  const date = new Date(expiresAt * 1000);
  const stamp =
    `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())} ` +
    `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
  const body = deviceKey.slice(2);
  return (
    `Let this device send and read end-to-end encrypted messages as you until ${stamp} UTC ` +
    `(device key ${body.slice(0, 8)}...${body.slice(-8)}). 6529 cannot read these messages. ` +
    "This signature cannot move funds, change your handle or act as an admin, and it does not " +
    "create a blockchain transaction or cost gas."
  );
}

function grantTypedData(grant) {
  return {
    domain: GRANT_DOMAIN,
    types: GRANT_TYPES,
    primaryType: "MlsDeviceGrant",
    message: {
      statement: grantStatement(lower(grant.device_key), grant.expires_at),
      wallet: getAddress(grant.wallet),
      deviceKey: lower(grant.device_key),
      ciphersuite: grant.ciphersuite,
      issuedAt: BigInt(grant.issued_at),
      expiresAt: BigInt(grant.expires_at),
      origin: grant.origin,
    },
  };
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

class HttpError extends Error {
  constructor(status, code, extra) {
    super(code);
    this.status = status;
    this.code = code;
    this.extra = extra || {};
  }
}

const fail = (status, code, extra) => {
  throw new HttpError(status, code, extra);
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

function createFakeDeliveryService(options = {}) {
  const now = options.now || (() => Date.now());
  const s = {
    devices: new Map(),
    keyPackages: new Map(),
    groups: new Map(),
    welcomes: new Map(),
    deliveries: new Map(),
    blobs: new Map(),
    reports: [],
    notifyLog: [],
    wakes: [],
    dmPolicy: new Map(),
    /** GROUP_MEMBERS policy: profileId -> { members: Set, allowFollowed }. */
    dmGroups: new Map(),
    follows: new Set(),
    blocks: new Set(),
    wallets: new Map(),
    // NC8: combined sign-in grants the login stored, by grant id.
    loginGrants: new Map(),
    subscribers: new Map(),
    faults: [],
    tamper: null,
    requests: [],
    nextId: 1,
    attachmentsEnabled: options.attachmentsEnabled !== false,
  };

  const id = (prefix) => `${prefix}${s.nextId++}`;

  // -- events ---------------------------------------------------------------

  function emit(profileIds, type, data) {
    for (const profileId of new Set(profileIds)) {
      for (const listener of s.subscribers.get(profileId) || []) {
        const event = { type, data: structuredClone(data) };
        queueMicrotask(() => listener(event));
      }
    }
  }

  // -- devices ----------------------------------------------------------------

  const isActive = (device) =>
    device !== undefined &&
    device.revoked_at === null &&
    device.grant.expires_at * 1000 > now();

  const activeDevicesOf = (profileId) =>
    [...s.devices.values()].filter(
      (d) => d.profile_id === profileId && isActive(d)
    );

  function requireOwnDevice(profileId, deviceKey) {
    const device = s.devices.get(lower(deviceKey));
    if (!device || device.profile_id !== profileId || !isActive(device)) {
      fail(403, "E2EE_NOT_YOUR_DEVICE");
    }
    return device;
  }

  async function verifyGrant(profileId, grant, signature) {
    if (
      !grant ||
      !isHex(lower(grant.device_key), 32) ||
      !isHex(lower(grant.wallet), 20)
    ) {
      fail(400, "E2EE_BAD_GRANT");
    }
    const lifetime = grant.expires_at - grant.issued_at;
    const aligned = grant.expires_at % 60 === 0;
    if (
      grant.ciphersuite !== E2EE_CIPHERSUITE ||
      lifetime <= 0 ||
      lifetime > GRANT_MAX_LIFETIME_S ||
      !aligned
    ) {
      fail(400, "E2EE_BAD_GRANT");
    }
    if (
      grant.expires_at * 1000 <= now() ||
      typeof grant.origin !== "string" ||
      grant.origin.length > 64
    ) {
      fail(400, "E2EE_BAD_GRANT");
    }
    const allowed = s.wallets.get(profileId);
    if (allowed && !allowed.has(lower(grant.wallet))) {
      fail(400, "E2EE_BAD_GRANT");
    }
    const typed = grantTypedData(grant);
    let signer = null;
    try {
      signer = await recoverTypedDataAddress({ ...typed, signature });
    } catch {
      signer = null;
    }
    if (!signer || lower(signer) !== lower(grant.wallet)) {
      fail(400, "E2EE_BAD_SIGNATURE");
    }
    return hashTypedData(typed);
  }

  function rosterProfilesSharing(deviceKeys) {
    const keys = new Set(deviceKeys.map(lower));
    const profiles = new Set();
    for (const group of s.groups.values()) {
      const inGroup = [...group.roster.keys()].some((key) => keys.has(key));
      if (inGroup) {
        for (const entry of group.roster.values()) {
          profiles.add(entry.profile_id);
        }
      }
    }
    return [...profiles];
  }

  const MLS_RESOURCE =
    /^- urn:6529:mls-device-grant:v1:(\d+):([0-9a-f]{64}):(\d+)$/m;

  /** NC8: the MLS terms of a stored combined sign-in grant. */
  async function verifyLoginGrant(profileId, grantId) {
    const stored = s.loginGrants.get(lower(grantId || ""));
    if (!stored || stored.revoked) {
      fail(400, "E2EE_BAD_GRANT");
    }
    const match = MLS_RESOURCE.exec(stored.message);
    const issuedAt = /^Issued At: (.+)$/m.exec(stored.message);
    const domain = /^(?:https?:\/\/)?([^ ]+) wants you to sign in/.exec(
      stored.message
    );
    if (!match || !issuedAt || !domain) {
      fail(400, "E2EE_BAD_GRANT");
    }
    const grant = {
      wallet: lower(stored.wallet),
      device_key: `0x${match[2]}`,
      ciphersuite: Number(match[1]),
      issued_at: Math.floor(Date.parse(issuedAt[1]) / 1000),
      expires_at: Number(match[3]),
      origin: domain[1],
    };
    if (
      grant.ciphersuite !== E2EE_CIPHERSUITE ||
      grant.expires_at * 1000 <= now() ||
      hashMessage(stored.message) !== lower(grantId)
    ) {
      fail(400, "E2EE_BAD_GRANT");
    }
    const allowed = s.wallets.get(profileId);
    if (allowed && !allowed.has(grant.wallet)) {
      fail(400, "E2EE_BAD_GRANT");
    }
    const signer = await recoverMessageAddress({
      message: stored.message,
      signature: stored.signature,
    }).catch(() => null);
    if (!signer || lower(signer) !== grant.wallet) {
      fail(400, "E2EE_BAD_SIGNATURE");
    }
    return { grant, message: stored.message, signature: stored.signature };
  }

  async function registerLoginGrantDevice(profileId, body) {
    const verified = await verifyLoginGrant(profileId, body.grant_id);
    return storeDevice(profileId, {
      grant: verified.grant,
      grantId: lower(body.grant_id),
      signature: verified.signature,
      grantMessage: verified.message,
      label: body.label,
      platform: body.platform,
    });
  }

  async function registerDevice(profileId, body) {
    const grantId = await verifyGrant(
      profileId,
      body.grant,
      body.wallet_signature
    );
    return storeDevice(profileId, {
      grant: body.grant,
      grantId,
      signature: body.wallet_signature,
      grantMessage: null,
      label: body.label,
      platform: body.platform,
    });
  }

  function storeDevice(profileId, input) {
    const body = {
      grant: input.grant,
      label: input.label,
      platform: input.platform,
    };
    const key = lower(body.grant.device_key);
    const existing = s.devices.get(key);
    if (
      existing &&
      (existing.profile_id !== profileId || existing.revoked_at !== null)
    ) {
      fail(409, "E2EE_DEVICE_EXISTS");
    }
    if (!existing && activeDevicesOf(profileId).length >= MAX_DEVICES) {
      fail(409, "E2EE_DEVICE_LIMIT");
    }
    const label =
      String(body.label || "Device")
        .replace(/[^A-Za-z0-9 ._()-]/g, "")
        .slice(0, 48) || "Device";
    const device = {
      device_key: key,
      profile_id: profileId,
      grant: {
        ...body.grant,
        wallet: lower(body.grant.wallet),
        device_key: key,
      },
      grant_id: lower(input.grantId),
      wallet_signature: lower(input.signature),
      grant_message: input.grantMessage,
      verified_via: "eoa",
      label,
      platform: ["web", "desktop", "phone"].includes(body.platform)
        ? body.platform
        : "web",
      created_at: existing ? existing.created_at : now(),
      last_seen_at: now(),
      revoked_at: null,
      revocation: null,
    };
    s.devices.set(key, device);
    if (!s.keyPackages.has(key)) {
      s.keyPackages.set(key, { oneTime: [], lastResort: null });
    }
    emit(
      [
        profileId,
        ...rosterProfilesSharing(
          activeDevicesOf(profileId).map((d) => d.device_key)
        ),
      ],
      "E2EE_DEVICE_ADDED",
      {
        profile_id: profileId,
        device_key: key,
      }
    );
    return device;
  }

  function revokeDevice(profileId, target, body) {
    const device = s.devices.get(target);
    if (!device) {
      fail(404, "E2EE_NOT_FOUND");
    }
    if (device.profile_id !== profileId) {
      fail(403, "E2EE_NOT_YOUR_DEVICE");
    }
    if (device.revoked_at !== null) {
      return device;
    }
    const revoker = lower(body.revoker_device_key);
    const revokerDevice = s.devices.get(revoker);
    if (
      revoker !== target &&
      (!isActive(revokerDevice) || revokerDevice.profile_id !== profileId)
    ) {
      fail(403, "E2EE_NOT_YOUR_DEVICE");
    }
    if (Math.abs(body.revoked_at * 1000 - now()) > 10 * 60_000) {
      fail(400, "E2EE_BAD_SIGNATURE");
    }
    if (
      !verifyEd25519(
        revoker,
        revokeDigest(target, revoker, body.revoked_at),
        body.signature
      )
    ) {
      fail(400, "E2EE_BAD_SIGNATURE");
    }
    const sharing = rosterProfilesSharing([target]);
    device.revoked_at = now();
    device.revocation = {
      revoker_device_key: revoker,
      revoked_at: body.revoked_at,
      signature: lower(body.signature),
    };
    for (const group of s.groups.values()) {
      if (group.roster.has(target)) {
        removeFromRoster(group, target, group.epoch);
      }
    }
    s.keyPackages.set(target, { oneTime: [], lastResort: null });
    s.deliveries.delete(target);
    emit([profileId, ...sharing], "E2EE_DEVICE_REVOKED", {
      profile_id: profileId,
      device_key: target,
    });
    return device;
  }

  function keyPackageStatus(deviceKey) {
    const pool = s.keyPackages.get(deviceKey) || {
      oneTime: [],
      lastResort: null,
    };
    const t = now() / 1000;
    return {
      device_key: deviceKey,
      one_time_available: pool.oneTime.filter((kp) => kp.expires_at > t).length,
      last_resort_expires_at: pool.lastResort
        ? pool.lastResort.expires_at
        : null,
    };
  }

  function uploadKeyPackages(profileId, deviceKey, body) {
    requireOwnDevice(profileId, deviceKey);
    const items = body.key_packages || [];
    if (items.length < 1 || items.length > 100) {
      fail(400, "E2EE_TOO_LARGE");
    }
    const pool = s.keyPackages.get(deviceKey);
    // Retention (7.2): KeyPackages are pruned at expiry.
    pool.oneTime = pool.oneTime.filter((kp) => kp.expires_at > now() / 1000);
    for (const item of items) {
      if (unb64(item.data).length > MAX_KEY_PACKAGE_BYTES) {
        fail(413, "E2EE_TOO_LARGE");
      }
      if (item.last_resort) {
        pool.lastResort = { data: item.data, expires_at: item.expires_at };
      } else {
        if (pool.oneTime.length >= MAX_ONE_TIME) {
          fail(409, "E2EE_TOO_LARGE");
        }
        pool.oneTime.push({ data: item.data, expires_at: item.expires_at });
      }
    }
    return keyPackageStatus(deviceKey);
  }

  function getMe(profileId) {
    const devices = [...s.devices.values()].filter(
      (d) =>
        d.profile_id === profileId &&
        (d.revoked_at === null || now() - d.revoked_at <= REVOKED_VISIBLE_MS)
    );
    return {
      profile_id: profileId,
      devices,
      key_packages: devices
        .filter(isActive)
        .map((d) => keyPackageStatus(d.device_key)),
      max_devices: MAX_DEVICES,
      attachments_enabled: s.attachmentsEnabled,
    };
  }

  /** Mirrors E2EE_ATTACHMENTS_ENABLED: blob routes refuse before any state. */
  function requireAttachments() {
    if (!s.attachmentsEnabled) fail(404, "E2EE_ATTACHMENTS_DISABLED");
  }

  // -- policy (7.1) -------------------------------------------------------------

  /**
   * Mirrors the backend's shared DM admission (DirectMessageAdmissionService):
   * the caller's own block is BLOCKED; the target's block of the caller is
   * POLICY with the same reason as NOBODY, so it is never disclosed.
   */
  function admissionReason(callerProfileId, targetProfileId) {
    if (s.blocks.has(`${callerProfileId}>${targetProfileId}`)) {
      return "DM_SENDER_BLOCKED_RECIPIENT";
    }
    if (s.blocks.has(`${targetProfileId}>${callerProfileId}`)) {
      return "DM_RECIPIENT_NOT_ACCEPTING";
    }
    const follows = s.follows.has(`${targetProfileId}>${callerProfileId}`);
    const dm = s.dmPolicy.get(targetProfileId) || "EVERYONE";
    if (dm === "NOBODY") {
      return "DM_RECIPIENT_NOT_ACCEPTING";
    }
    if (dm === "PEOPLE_I_FOLLOW" && !follows) {
      return "DM_RECIPIENT_PEOPLE_I_FOLLOW_ONLY";
    }
    if (dm === "GROUP_MEMBERS") {
      const group = s.dmGroups.get(targetProfileId);
      if (!group) {
        // A missing group fails closed to people the target follows.
        return follows ? null : "DM_RECIPIENT_PEOPLE_I_FOLLOW_ONLY";
      }
      if (group.members.has(callerProfileId)) return null;
      if (group.allowFollowed && follows) return null;
      return "DM_RECIPIENT_GROUP_MEMBERS_ONLY";
    }
    return null;
  }

  function decide(callerProfileId, targetProfileId) {
    const reason =
      callerProfileId === targetProfileId
        ? null
        : admissionReason(callerProfileId, targetProfileId);
    if (reason) {
      return {
        status:
          reason === "DM_SENDER_BLOCKED_RECIPIENT" ? "BLOCKED" : "POLICY",
        reason,
      };
    }
    return {
      status: activeDevicesOf(targetProfileId).length > 0 ? "OK" : "NO_DEVICES",
      reason: null,
    };
  }

  function policy(callerProfileId, targetProfileId) {
    return decide(callerProfileId, targetProfileId).status;
  }

  function popKeyPackage(deviceKey) {
    const pool = s.keyPackages.get(deviceKey);
    if (!pool) {
      return null;
    }
    const t = now() / 1000;
    pool.oneTime = pool.oneTime.filter((kp) => kp.expires_at > t);
    const oneTime = pool.oneTime.shift();
    if (oneTime) {
      return { data: oneTime.data, last_resort: false };
    }
    if (pool.lastResort && pool.lastResort.expires_at > t) {
      return { data: pool.lastResort.data, last_resort: true };
    }
    return null;
  }

  function claim(profileId, body) {
    const claimer = requireOwnDevice(
      profileId,
      body.claimer_device_key
    ).device_key;
    const group = body.group ? s.groups.get(lower(body.group)) : null;
    const claimerInGroup = group ? group.roster.has(claimer) : false;
    const results = (body.targets || []).map((target) => {
      const inRoster =
        claimerInGroup &&
        [...group.roster.values()].some(
          (entry) => entry.profile_id === target.profile_id
        );
      const status = inRoster
        ? activeDevicesOf(target.profile_id).length > 0
          ? "OK"
          : "NO_DEVICES"
        : policy(profileId, target.profile_id);
      if (status !== "OK") {
        return { profile_id: target.profile_id, status, key_packages: [] };
      }
      const wanted = target.device_keys
        ? new Set(target.device_keys.map(lower))
        : null;
      const keyPackages = [];
      for (const device of activeDevicesOf(target.profile_id)) {
        if (wanted && !wanted.has(device.device_key)) {
          continue;
        }
        const kp = popKeyPackage(device.device_key);
        if (kp) {
          keyPackages.push({
            device,
            key_package: kp.data,
            last_resort: kp.last_resort,
          });
        }
      }
      return {
        profile_id: target.profile_id,
        status,
        key_packages: keyPackages,
      };
    });
    return { results };
  }

  function eligibility(profileId, body) {
    return {
      results: (body.profile_ids || []).map((target) => {
        const { status, reason } = decide(profileId, target);
        return {
          profile_id: target,
          status,
          active_devices: activeDevicesOf(target).length,
          ...(reason ? { reason } : {}),
        };
      }),
    };
  }

  // -- groups -------------------------------------------------------------------

  function addToRoster(group, deviceKey, profileId, joinedEpoch) {
    group.roster.set(deviceKey, {
      device_key: deviceKey,
      profile_id: profileId,
      joined_epoch: joinedEpoch,
    });
    const periods = group.history.get(deviceKey) || [];
    periods.push({ joined_epoch: joinedEpoch, removed_epoch: null });
    group.history.set(deviceKey, periods);
  }

  function removeFromRoster(group, deviceKey, removedEpoch) {
    group.roster.delete(deviceKey);
    const periods = group.history.get(deviceKey) || [];
    const open = periods.find((p) => p.removed_epoch === null);
    if (open) {
      open.removed_epoch = Math.max(open.joined_epoch, removedEpoch);
    }
  }

  const groupView = (group, includeRoster) => ({
    group: group.g,
    epoch: group.epoch,
    commit_key: group.commitKeys.get(group.epoch),
    last_seq: group.items.length,
    created_at: group.createdAt,
    updated_at: group.updatedAt,
    roster: includeRoster
      ? [...group.roster.values()].map((entry) => ({ ...entry }))
      : [],
  });

  function requireGroup(g) {
    const group = s.groups.get(lower(g));
    if (!group) {
      fail(404, "E2EE_NOT_FOUND");
    }
    return group;
  }

  const rosterProfiles = (group) => [
    ...new Set([...group.roster.values()].map((e) => e.profile_id)),
  ];

  function createGroup(profileId, body) {
    const creator = requireOwnDevice(profileId, body.creator_device_key);
    const g = lower(body.group);
    if (!isHex(g, 32) || !isHex(lower(body.commit_key), 32)) {
      fail(400, "E2EE_BAD_SIGNATURE");
    }
    if (s.groups.has(g)) {
      fail(409, "E2EE_EPOCH_CONFLICT", {
        current_epoch: s.groups.get(g).epoch,
      });
    }
    const group = {
      g,
      epoch: 0,
      commitKeys: new Map([[0, lower(body.commit_key)]]),
      createdAt: now(),
      updatedAt: now(),
      items: [],
      roster: new Map(),
      history: new Map(),
      commits: new Set(),
      proposals: new Map(),
    };
    addToRoster(group, creator.device_key, profileId, 0);
    s.groups.set(g, group);
    return groupView(group, true);
  }

  function getGroup(profileId, g, deviceKey) {
    const device = requireOwnDevice(profileId, deviceKey);
    const group = requireGroup(g);
    if (group.roster.has(device.device_key)) {
      return groupView(group, true);
    }
    if (group.history.has(device.device_key)) {
      return groupView(group, false);
    }
    fail(404, "E2EE_NOT_MEMBER");
  }

  function checkEntryShape(group, body) {
    if (body.epoch !== group.epoch) {
      fail(
        409,
        body.kind === "commit" ? "E2EE_EPOCH_CONFLICT" : "E2EE_EPOCH_STALE",
        { current_epoch: group.epoch }
      );
    }
    const data = unb64(body.data || "");
    if (!ENTRY_BUCKETS.includes(data.length)) {
      fail(413, "E2EE_TOO_LARGE");
    }
    if (lower(body.entry_hash) !== keccak256(data)) {
      fail(400, "E2EE_BAD_SIGNATURE");
    }
    const digest = entryDigest(
      group.g,
      body.epoch,
      body.kind,
      lower(body.entry_hash),
      lower(body.epoch_commitment),
      lower(body.next_commit_key),
      data.length
    );
    if (
      !verifyEd25519(group.commitKeys.get(group.epoch), digest, body.signature)
    ) {
      fail(400, "E2EE_BAD_SIGNATURE");
    }
    if (
      body.kind === "proposal" &&
      (lower(body.epoch_commitment) !== ZERO32 ||
        lower(body.next_commit_key) !== ZERO32)
    ) {
      fail(400, "E2EE_BAD_SIGNATURE");
    }
    return data;
  }

  function checkRosterAdds(profileId, group, adds) {
    const inRoster = new Set(rosterProfiles(group));
    for (const key of adds) {
      const device = s.devices.get(key);
      if (!isActive(device)) {
        fail(403, "E2EE_POLICY");
      }
      if (!inRoster.has(device.profile_id) && device.profile_id !== profileId) {
        const status = policy(profileId, device.profile_id);
        if (status === "BLOCKED") {
          fail(403, "E2EE_BLOCKED");
        }
        if (status !== "OK") {
          fail(403, "E2EE_POLICY");
        }
      }
    }
  }

  function storeWelcome(profileId, sender, group, welcome, adds) {
    if (!welcome) {
      return { targets: [], welcomeId: null };
    }
    const targets = (welcome.targets || []).map(lower);
    if (!targets.every((key) => adds.includes(key))) {
      fail(400, "E2EE_BAD_SIGNATURE");
    }
    if (unb64(welcome.data).length > MAX_WELCOME_BYTES) {
      fail(413, "E2EE_TOO_LARGE");
    }
    const record = {
      id: id("w"),
      group: group.g,
      epoch: group.epoch + 1,
      data: welcome.data,
      ratchet_tree: welcome.ratchet_tree || null,
      added_by_profile_id: profileId,
      added_by_device_key: sender,
      created_at: now(),
    };
    s.welcomes.set(record.id, record);
    for (const key of targets) {
      const list = s.deliveries.get(key) || [];
      list.push(record.id);
      s.deliveries.set(key, list);
    }
    return { targets, welcomeId: record.id };
  }

  function submitEntry(profileId, g, body) {
    const group = requireGroup(g);
    const sender = requireOwnDevice(
      profileId,
      body.sender_device_key
    ).device_key;
    if (!group.roster.has(sender)) {
      fail(404, "E2EE_NOT_MEMBER");
    }
    if (body.kind !== "commit" && body.kind !== "proposal") {
      fail(400, "E2EE_BAD_SIGNATURE");
    }
    checkEntryShape(group, body);
    if (body.kind === "commit" && group.commits.has(group.epoch)) {
      fail(409, "E2EE_EPOCH_CONFLICT", { current_epoch: group.epoch });
    }
    if (
      body.kind === "proposal" &&
      (group.proposals.get(group.epoch) || 0) >= MAX_PROPOSALS_PER_EPOCH
    ) {
      fail(429, "E2EE_RATE_LIMITED");
    }
    const adds =
      body.kind === "commit" ? (body.roster_add || []).map(lower) : [];
    const removes = (body.roster_remove || []).map(lower);
    checkRosterAdds(profileId, group, adds);
    const before = rosterProfiles(group);
    const welcome =
      body.kind === "commit"
        ? storeWelcome(profileId, sender, group, body.welcome, adds)
        : { targets: [], welcomeId: null };
    const n = group.epoch;
    const item = {
      seq: group.items.length + 1,
      type: "entry",
      epoch: n,
      kind: body.kind,
      data: body.data,
      entry_hash: lower(body.entry_hash),
      epoch_commitment: lower(body.epoch_commitment),
      next_commit_key: lower(body.next_commit_key),
      signature: lower(body.signature),
      roster_add: adds,
      roster_remove: removes,
      epoch_fp: null,
      created_at: now(),
    };
    group.items.push(item);
    group.updatedAt = now();
    if (body.kind === "commit") {
      group.commits.add(n);
      group.epoch = n + 1;
      group.commitKeys.set(n + 1, lower(body.next_commit_key));
      for (const key of removes) {
        if (group.roster.has(key)) {
          removeFromRoster(group, key, n + 1);
        }
      }
      for (const key of adds) {
        addToRoster(group, key, s.devices.get(key).profile_id, n + 1);
      }
    } else {
      group.proposals.set(n, (group.proposals.get(n) || 0) + 1);
      for (const key of removes) {
        const device = s.devices.get(key);
        if (
          group.roster.has(key) &&
          device &&
          device.profile_id === profileId
        ) {
          removeFromRoster(group, key, n);
        }
      }
    }
    const after = rosterProfiles(group);
    emit([...before, ...after], "E2EE_GROUP_EVENT", {
      group: group.g,
      seq: item.seq,
      epoch: n,
      type: "entry",
    });
    for (const key of welcome.targets) {
      const device = s.devices.get(key);
      emit([device.profile_id], "E2EE_WELCOME", {
        device_key: key,
        welcome_id: welcome.welcomeId,
        group: group.g,
      });
    }
    const added = new Set(
      adds
        .map((key) => s.devices.get(key).profile_id)
        .filter((p) => !before.includes(p))
    );
    for (const target of added) {
      s.wakes.push({ profile_id: target, reason: "added", group: group.g });
    }
    return item;
  }

  function visibleTo(group, deviceKey, item) {
    const periods = group.history.get(deviceKey) || [];
    return periods.some(
      (p) =>
        item.epoch >= p.joined_epoch &&
        (p.removed_epoch === null || item.epoch < p.removed_epoch)
    );
  }

  function getLog(profileId, g, query) {
    const device = requireOwnDevice(profileId, query.device_key);
    const group = requireGroup(g);
    if (!group.history.has(device.device_key)) {
      fail(404, "E2EE_NOT_MEMBER");
    }
    const after = Number(query.after_seq || 0);
    const limit = Math.min(200, Math.max(1, Number(query.limit || 100)));
    const visible = group.items.filter(
      (item) => item.seq > after && visibleTo(group, device.device_key, item)
    );
    const page = visible.slice(0, limit).map((item) => {
      const copy = structuredClone(item);
      return s.tamper
        ? s.tamper(copy, { profileId, deviceKey: device.device_key })
        : copy;
    });
    const more = visible.length > limit;
    return {
      items: page,
      next_after_seq: more ? page[page.length - 1].seq : null,
      group: groupView(group, group.roster.has(device.device_key)),
    };
  }

  function sendMessage(profileId, g, body) {
    const group = requireGroup(g);
    const sender = requireOwnDevice(
      profileId,
      body.sender_device_key
    ).device_key;
    if (!group.roster.has(sender)) {
      fail(404, "E2EE_NOT_MEMBER");
    }
    if (body.epoch !== group.epoch) {
      fail(409, "E2EE_EPOCH_STALE", { current_epoch: group.epoch });
    }
    const data = unb64(body.data || "");
    if (!MESSAGE_BUCKETS.includes(data.length)) {
      fail(413, "E2EE_TOO_LARGE");
    }
    if (
      typeof body.epoch_fp !== "string" ||
      !/^[0-9a-f]{16}$/.test(body.epoch_fp)
    ) {
      fail(400, "E2EE_BAD_SIGNATURE");
    }
    const notify = (body.notify || []).slice(0, 200);
    const item = {
      seq: group.items.length + 1,
      type: "message",
      epoch: group.epoch,
      kind: null,
      data: body.data,
      entry_hash: null,
      epoch_commitment: null,
      next_commit_key: null,
      signature: null,
      roster_add: [],
      roster_remove: [],
      epoch_fp: body.epoch_fp,
      created_at: now(),
    };
    group.items.push(item);
    group.updatedAt = now();
    s.notifyLog.push({
      group: group.g,
      sender_profile_id: profileId,
      hints: structuredClone(notify),
    });
    const roster = new Set(rosterProfiles(group));
    for (const hint of notify) {
      if (roster.has(hint.profile_id) && hint.profile_id !== profileId) {
        s.wakes.push({
          profile_id: hint.profile_id,
          reason: "message",
          group: group.g,
        });
      }
    }
    emit(rosterProfiles(group), "E2EE_GROUP_EVENT", {
      group: group.g,
      seq: item.seq,
      epoch: item.epoch,
      type: "message",
    });
    return { seq: item.seq, created_at: item.created_at };
  }

  function repairRoster(profileId, g, body) {
    const group = requireGroup(g);
    const requester = requireOwnDevice(
      profileId,
      body.requester_device_key
    ).device_key;
    if (!group.roster.has(requester)) {
      fail(404, "E2EE_NOT_MEMBER");
    }
    if (body.epoch !== group.epoch) {
      fail(409, "E2EE_EPOCH_STALE", { current_epoch: group.epoch });
    }
    const keys = (body.device_keys || []).map(lower);
    if (
      !verifyEd25519(
        group.commitKeys.get(group.epoch),
        rosterDigest(group.g, group.epoch, keys),
        body.signature
      )
    ) {
      fail(400, "E2EE_BAD_SIGNATURE");
    }
    const wanted = new Set(keys);
    const adds = keys.filter((key) => !group.roster.has(key));
    checkRosterAdds(profileId, group, adds);
    for (const key of [...group.roster.keys()]) {
      if (!wanted.has(key)) {
        removeFromRoster(group, key, group.epoch);
      }
    }
    for (const key of adds) {
      addToRoster(group, key, s.devices.get(key).profile_id, group.epoch);
    }
    s.rosterRepairs = (s.rosterRepairs || 0) + 1;
    emit(rosterProfiles(group), "E2EE_ROSTER_CHANGED", {
      group: group.g,
      epoch: group.epoch,
    });
    return groupView(group, true);
  }

  function getWelcomes(profileId, deviceKey) {
    requireOwnDevice(profileId, deviceKey);
    return (s.deliveries.get(deviceKey) || [])
      .map((wid) => s.welcomes.get(wid))
      .filter(Boolean)
      .slice(0, 50);
  }

  function ackWelcome(profileId, deviceKey, welcomeId) {
    requireOwnDevice(profileId, deviceKey);
    s.deliveries.set(
      deviceKey,
      (s.deliveries.get(deviceKey) || []).filter((wid) => wid !== welcomeId)
    );
    return {};
  }

  function deviceGroups(profileId, deviceKey) {
    requireOwnDevice(profileId, deviceKey);
    return [...s.groups.values()]
      .filter((group) => group.roster.has(deviceKey))
      .map((group) => ({
        group: group.g,
        epoch: group.epoch,
        last_seq: group.items.length,
        joined_epoch: group.roster.get(deviceKey).joined_epoch,
        updated_at: group.updatedAt,
      }));
  }

  // -- blobs --------------------------------------------------------------------

  function createBlob(profileId, body) {
    requireAttachments();
    const uploader = requireOwnDevice(
      profileId,
      body.uploader_device_key
    ).device_key;
    const group = requireGroup(body.group);
    if (!group.roster.has(uploader)) {
      fail(404, "E2EE_NOT_MEMBER");
    }
    if (body.size > MAX_BLOB_BYTES || body.chunk_count < 1) {
      fail(413, "E2EE_TOO_LARGE");
    }
    const blob = {
      blob_id: `0x${crypto.randomBytes(16).toString("hex")}`,
      group: group.g,
      size: body.size,
      chunk_count: body.chunk_count,
      complete: false,
      created_at: now(),
      uploader,
      chunks: new Map(),
    };
    s.blobs.set(blob.blob_id, blob);
    return blobView(blob);
  }

  const blobView = (blob) => ({
    blob_id: blob.blob_id,
    group: blob.group,
    size: blob.size,
    chunk_count: blob.chunk_count,
    complete: blob.complete,
    created_at: blob.created_at,
  });

  function requireBlob(blobId) {
    const blob = s.blobs.get(lower(blobId));
    if (!blob) {
      fail(404, "E2EE_NOT_FOUND");
    }
    return blob;
  }

  function putChunk(profileId, blobId, index, body) {
    requireAttachments();
    const blob = requireBlob(blobId);
    requireOwnDevice(profileId, blob.uploader);
    if (blob.complete || index < 0 || index >= blob.chunk_count) {
      fail(400, "E2EE_TOO_LARGE");
    }
    const data = unb64(body.data);
    if (data.length > MAX_CHUNK_BYTES) {
      fail(413, "E2EE_TOO_LARGE");
    }
    blob.chunks.set(index, body.data);
    return blobView(blob);
  }

  function completeBlob(profileId, blobId) {
    requireAttachments();
    const blob = requireBlob(blobId);
    requireOwnDevice(profileId, blob.uploader);
    const total = [...blob.chunks.values()].reduce(
      (sum, data) => sum + unb64(data).length,
      0
    );
    if (blob.chunks.size !== blob.chunk_count || total !== blob.size) {
      fail(400, "E2EE_TOO_LARGE");
    }
    blob.complete = true;
    return blobView(blob);
  }

  function getChunk(profileId, blobId, index, deviceKey) {
    requireAttachments();
    const device = requireOwnDevice(profileId, deviceKey);
    const blob = requireBlob(blobId);
    const group = requireGroup(blob.group);
    if (!group.history.has(device.device_key)) {
      fail(404, "E2EE_NOT_MEMBER");
    }
    const data = blob.chunks.get(index);
    if (!blob.complete || data === undefined) {
      fail(404, "E2EE_NOT_FOUND");
    }
    return { data };
  }

  // -- reports ------------------------------------------------------------------

  function report(profileId, body) {
    const reporter = requireOwnDevice(
      profileId,
      body.reporter_device_key
    ).device_key;
    const group = requireGroup(body.group);
    if (!group.history.has(reporter)) {
      fail(404, "E2EE_NOT_MEMBER");
    }
    const bodyBytes = unb64(body.body);
    const verified = verifyEd25519(
      lower(body.sender_device_key),
      messageDigest(group.g, body.epoch, bodyBytes),
      body.signature
    );
    const sender = s.devices.get(lower(body.sender_device_key));
    const record = {
      id: id("r"),
      verified,
      sender_profile_id: verified && sender ? sender.profile_id : null,
      created_at: now(),
    };
    s.reports.push({
      ...record,
      reporter_profile_id: profileId,
      reason: body.reason,
      notes: body.notes || null,
      body: body.body,
    });
    return record;
  }

  // -- routing ------------------------------------------------------------------

  const routes = [
    ["GET", /^e2ee\/me$/, (c) => getMe(c.profileId)],
    ["POST", /^e2ee\/devices$/, (c) => registerDevice(c.profileId, c.body)],
    [
      "POST",
      /^e2ee\/devices\/login-grant$/,
      (c) => registerLoginGrantDevice(c.profileId, c.body),
    ],
    [
      "GET",
      /^e2ee\/devices\/(0x[0-9a-f]+)$/,
      (c, [key]) => s.devices.get(key) || fail(404, "E2EE_NOT_FOUND"),
    ],
    [
      "GET",
      /^e2ee\/profiles\/([^/]+)\/devices$/,
      (c, [pid]) =>
        [...s.devices.values()].filter(
          (d) =>
            d.profile_id === decodeURIComponent(pid) &&
            (d.revoked_at === null ||
              now() - d.revoked_at <= REVOKED_VISIBLE_MS)
        ),
    ],
    [
      "POST",
      /^e2ee\/devices\/(0x[0-9a-f]+)\/revoke$/,
      (c, [key]) => revokeDevice(c.profileId, key, c.body),
    ],
    [
      "POST",
      /^e2ee\/devices\/(0x[0-9a-f]+)\/key-packages$/,
      (c, [key]) => uploadKeyPackages(c.profileId, key, c.body),
    ],
    ["POST", /^e2ee\/key-packages\/claim$/, (c) => claim(c.profileId, c.body)],
    ["POST", /^e2ee\/eligibility$/, (c) => eligibility(c.profileId, c.body)],
    ["POST", /^e2ee\/groups$/, (c) => createGroup(c.profileId, c.body)],
    [
      "GET",
      /^e2ee\/groups\/(0x[0-9a-f]+)$/,
      (c, [g]) => getGroup(c.profileId, g, lower(c.query.device_key)),
    ],
    [
      "POST",
      /^e2ee\/groups\/(0x[0-9a-f]+)\/entries$/,
      (c, [g]) => submitEntry(c.profileId, g, c.body),
    ],
    [
      "GET",
      /^e2ee\/groups\/(0x[0-9a-f]+)\/log$/,
      (c, [g]) => getLog(c.profileId, g, c.query),
    ],
    [
      "POST",
      /^e2ee\/groups\/(0x[0-9a-f]+)\/messages$/,
      (c, [g]) => sendMessage(c.profileId, g, c.body),
    ],
    [
      "POST",
      /^e2ee\/groups\/(0x[0-9a-f]+)\/roster$/,
      (c, [g]) => repairRoster(c.profileId, g, c.body),
    ],
    [
      "GET",
      /^e2ee\/devices\/(0x[0-9a-f]+)\/welcomes$/,
      (c, [key]) => getWelcomes(c.profileId, key),
    ],
    [
      "POST",
      /^e2ee\/devices\/(0x[0-9a-f]+)\/welcomes\/([^/]+)\/ack$/,
      (c, [key, wid]) => ackWelcome(c.profileId, key, decodeURIComponent(wid)),
    ],
    [
      "GET",
      /^e2ee\/devices\/(0x[0-9a-f]+)\/groups$/,
      (c, [key]) => deviceGroups(c.profileId, key),
    ],
    ["POST", /^e2ee\/blobs$/, (c) => createBlob(c.profileId, c.body)],
    [
      "PUT",
      /^e2ee\/blobs\/(0x[0-9a-f]+)\/chunks\/(\d+)$/,
      (c, [blob, index]) => putChunk(c.profileId, blob, Number(index), c.body),
    ],
    [
      "POST",
      /^e2ee\/blobs\/(0x[0-9a-f]+)\/complete$/,
      (c, [blob]) => completeBlob(c.profileId, blob),
    ],
    [
      "GET",
      /^e2ee\/blobs\/(0x[0-9a-f]+)\/chunks\/(\d+)$/,
      (c, [blob, index]) =>
        getChunk(c.profileId, blob, Number(index), lower(c.query.device_key)),
    ],
    ["POST", /^e2ee\/reports$/, (c) => report(c.profileId, c.body)],
    // History backup: the sandbox reports "no backup", so the devices page
    // shows backup as off. Backup writes and restores are covered by the
    // real-WASM Jest integration test and are not simulated here.
    [
      "GET",
      /^e2ee\/backup$/,
      () => ({
        backup: null,
        used_bytes: 0,
        quota_bytes: 256 * 1024 * 1024,
        max_chunk_bytes: 1048576,
        chunk_buckets: [4096, 16384, 65536, 262144, 1048576],
      }),
    ],
  ];

  function takeFault(method, path) {
    const index = s.faults.findIndex(
      (f) => f.method === method && f.path.test(path) && f.times !== 0
    );
    if (index < 0) {
      return null;
    }
    const fault = s.faults[index];
    if (fault.times > 0) {
      fault.times -= 1;
    }
    return fault;
  }

  /** Never throws: returns { status, body } like an HTTP response. */
  async function handle(method, rawPath, input = {}) {
    const path = rawPath.replace(/^\/?(api\/)?/, "").split("?")[0];
    const profileId = input.profileId;
    const record = { method, path, profileId, status: 0, code: null };
    s.requests.push(record);
    if (!profileId) {
      return {
        status: 401,
        body: { error: "unauthorized", code: "UNAUTHORIZED" },
      };
    }
    if (s.gate && method === "POST" && s.gate.path.test(path)) {
      await new Promise((resolve) => s.gate.waiters.push(resolve));
    }
    const fault = takeFault(method, path);
    if (fault) {
      record.status = fault.status;
      record.code = fault.code || null;
      return {
        status: fault.status,
        body: { error: fault.code || "fault", code: fault.code || null },
      };
    }
    for (const [routeMethod, pattern, run] of routes) {
      const match = routeMethod === method ? pattern.exec(path) : null;
      if (!match) {
        continue;
      }
      try {
        const body = await run(
          {
            profileId,
            body: structuredClone(input.body || {}),
            query: input.query || {},
          },
          match.slice(1).map(lower)
        );
        record.status = 200;
        return { status: 200, body: structuredClone(body) };
      } catch (error) {
        if (error instanceof HttpError) {
          record.status = error.status;
          record.code = error.code;
          return {
            status: error.status,
            body: { error: error.code, code: error.code, ...error.extra },
          };
        }
        throw error;
      }
    }
    return {
      status: 404,
      body: { error: "not found", code: "E2EE_NOT_FOUND" },
    };
  }

  return {
    handle,
    state: s,
    /** dmPolicy: "EVERYONE" | "PEOPLE_I_FOLLOW" | "NOBODY" | "GROUP_MEMBERS". */
    setDmPolicy(profileId, value) {
      s.dmPolicy.set(profileId, value);
    },
    /** GROUP_MEMBERS with the given members; followed profiles bypass by default. */
    setDmGroup(profileId, memberProfileIds, allowFollowed = true) {
      s.dmPolicy.set(profileId, "GROUP_MEMBERS");
      s.dmGroups.set(profileId, {
        members: new Set(memberProfileIds),
        allowFollowed,
      });
    },
    /** The server attachment switch (E2EE_ATTACHMENTS_ENABLED). */
    setAttachmentsEnabled(enabled) {
      s.attachmentsEnabled = enabled;
    },
    /** `subscriber` follows `target`. */
    follow(subscriber, target) {
      s.follows.add(`${subscriber}>${target}`);
    },
    block(blocker, blocked) {
      s.blocks.add(`${blocker}>${blocked}`);
    },
    unblock(blocker, blocked) {
      s.blocks.delete(`${blocker}>${blocked}`);
    },
    /** Restricts which wallets may sign grants for a profile (2.2 step 4). */
    setWallets(profileId, wallets) {
      s.wallets.set(profileId, new Set(wallets.map(lower)));
    },
    /** NC8: what session-login stores for a combined sign-in grant. */
    storeLoginGrant({ message, signature, wallet }) {
      const id = lower(hashMessage(message));
      s.loginGrants.set(id, { message, signature, wallet, revoked: false });
      return id;
    },
    /** NC8: the wallet's session revoked the grant (DN1 device list). */
    revokeLoginGrant(grantId) {
      const stored = s.loginGrants.get(lower(grantId));
      if (stored) {
        stored.revoked = true;
      }
    },
    subscribe(profileId, listener) {
      const set = s.subscribers.get(profileId) || new Set();
      set.add(listener);
      s.subscribers.set(profileId, set);
      return () => set.delete(listener);
    },
    /** Fails matching requests: times -1 = until cleared. */
    addFault(fault) {
      const entry = { times: 1, ...fault };
      s.faults.push(entry);
      return () => {
        s.faults = s.faults.filter((f) => f !== entry);
      };
    },
    clearFaults() {
      s.faults = [];
    },
    /**
     * Holds matching POSTs until released (FIFO), to force races such as two
     * commits for the same epoch.
     */
    hold(path) {
      const gate = { path, waiters: [] };
      s.gate = gate;
      return {
        waiting: () => gate.waiters.length,
        release() {
          if (s.gate === gate) {
            s.gate = null;
          }
          for (const resolve of gate.waiters.splice(0)) {
            resolve();
          }
        },
      };
    },
    /** Rewrites log items before they are served (split-view tests). */
    setTamper(fn) {
      s.tamper = fn;
    },
    group(g) {
      return s.groups.get(lower(g)) || null;
    },
    devicesOf(profileId) {
      return [...s.devices.values()].filter((d) => d.profile_id === profileId);
    },
  };
}

// ---------------------------------------------------------------------------
// E2eeApiClient adapter for Jest
// ---------------------------------------------------------------------------

function apiError(status, body) {
  const error = new Error(
    body && body.error ? String(body.error) : `HTTP ${status}`
  );
  error.name = "E2eeApiError";
  error.status = status;
  error.code = body && typeof body.code === "string" ? body.code : null;
  error.currentEpoch =
    body && typeof body.current_epoch === "number" ? body.current_epoch : null;
  return error;
}

function createFakeApiClient(ds, profileId) {
  const call = async (method, path, body, query) => {
    const response = await ds.handle(method, path, { profileId, body, query });
    if (response.status >= 400) {
      throw apiError(response.status, response.body);
    }
    return response.body;
  };
  const enc = encodeURIComponent;
  return {
    getMe: () => call("GET", "e2ee/me"),
    registerDevice: (body) => call("POST", "e2ee/devices", body),
    registerLoginGrantDevice: (body) =>
      call("POST", "e2ee/devices/login-grant", body),
    getDevice: (key) => call("GET", `e2ee/devices/${enc(key)}`),
    getProfileDevices: (pid) =>
      call("GET", `e2ee/profiles/${enc(pid)}/devices`),
    revokeDevice: (key, body) =>
      call("POST", `e2ee/devices/${enc(key)}/revoke`, body),
    uploadKeyPackages: (key, body) =>
      call("POST", `e2ee/devices/${enc(key)}/key-packages`, body),
    claimKeyPackages: (body) => call("POST", "e2ee/key-packages/claim", body),
    checkEligibility: (body) => call("POST", "e2ee/eligibility", body),
    createGroup: (body) => call("POST", "e2ee/groups", body),
    getGroup: (g, deviceKey) =>
      call("GET", `e2ee/groups/${enc(g)}`, undefined, {
        device_key: deviceKey,
      }),
    submitEntry: (g, body) =>
      call("POST", `e2ee/groups/${enc(g)}/entries`, body),
    getLog: (g, query) =>
      call("GET", `e2ee/groups/${enc(g)}/log`, undefined, {
        device_key: query.deviceKey,
        after_seq: String(query.afterSeq),
        limit: String(query.limit || 100),
      }),
    sendMessage: (g, body) =>
      call("POST", `e2ee/groups/${enc(g)}/messages`, body),
    repairRoster: (g, body) =>
      call("POST", `e2ee/groups/${enc(g)}/roster`, body),
    getWelcomes: (key) => call("GET", `e2ee/devices/${enc(key)}/welcomes`),
    ackWelcome: async (key, wid) => {
      await call(
        "POST",
        `e2ee/devices/${enc(key)}/welcomes/${enc(wid)}/ack`,
        {}
      );
    },
    getDeviceGroups: (key) => call("GET", `e2ee/devices/${enc(key)}/groups`),
    createBlob: (body) => call("POST", "e2ee/blobs", body),
    putBlobChunk: (blob, index, body) =>
      call("PUT", `e2ee/blobs/${enc(blob)}/chunks/${index}`, body),
    completeBlob: (blob) =>
      call("POST", `e2ee/blobs/${enc(blob)}/complete`, {}),
    getBlobChunk: (blob, index, deviceKey) =>
      call("GET", `e2ee/blobs/${enc(blob)}/chunks/${index}`, undefined, {
        device_key: deviceKey,
      }),
    report: (body) => call("POST", "e2ee/reports", body),
  };
}

module.exports = {
  createFakeDeliveryService,
  createFakeApiClient,
  verifyEd25519,
  entryDigest,
  rosterDigest,
  revokeDigest,
  messageDigest,
  grantTypedData,
  grantStatement,
};
