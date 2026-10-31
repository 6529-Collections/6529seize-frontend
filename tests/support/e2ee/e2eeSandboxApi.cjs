"use strict";

/**
 * Multi-user E2EE layer for the local composer sandbox mock API (D109).
 *
 * Mounted only when PLAYWRIGHT_E2EE_SANDBOX=1. It serves:
 * - `/api/e2ee/*` from the in-memory fake delivery service, acting as the
 *   profile whose wallet is the `sub` of the request's synthetic dev JWT;
 * - identity and people-search reads for four synthetic users (alice, bob,
 *   carol, dave) whose wallets each test registers at reset (test keys are
 *   generated per run, never committed);
 * - the plaintext DM fixture's access group, so "Start encrypted chat" can
 *   resolve the same people;
 * - `/__e2ee-sandbox/*` test controls (reset, DM policy, blocks, follows,
 *   faults, tampering) and state reads for ciphertext-only assertions.
 *
 * Loopback only: the composer sandbox binds this API to 127.0.0.1.
 */

const { createFakeDeliveryService } = require("./fakeDeliveryService.cjs");

const MAX_E2EE_BODY_BYTES = 8 * 1024 * 1024;
const CONTROL_PREFIX = "/__e2ee-sandbox/";
const CREATED_AT = 1713744000000;

const E2EE_SANDBOX_USERS = Object.freeze([
  { key: "alice", profileId: "00000000-0000-4000-8000-00000000e2e1" },
  { key: "bob", profileId: "00000000-0000-4000-8000-00000000e2e2" },
  { key: "carol", profileId: "00000000-0000-4000-8000-00000000e2e3" },
  { key: "dave", profileId: "00000000-0000-4000-8000-00000000e2e4" },
]);

const PLAINTEXT_DM_GROUP_ID = "00000000-0000-4000-8000-00000000e2d1";
const PLAINTEXT_DM_IDENTITY_GROUP_ID = "00000000-0000-4000-8000-00000000e2d2";
/** The plaintext DM fixture is between these two users. */
const PLAINTEXT_DM_MEMBERS = ["alice", "bob"];

const DM_POLICIES = new Set(["EVERYONE", "PEOPLE_I_FOLLOW", "NOBODY"]);
const HEX_ADDRESS = /^0x[0-9a-f]{40}$/u;
const BASE64_FIELD = /^[A-Za-z0-9+/]{16,}={0,2}$/u;

function writeJson(res, status, body, corsHeaders) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    ...corsHeaders(),
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    "Cache-Control": "no-store",
  });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > MAX_E2EE_BODY_BYTES) {
        reject(new Error("E2EE sandbox request body too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function parseJson(raw) {
  if (raw.trim().length === 0) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function decodeJwtSubject(authorization) {
  const match = /^Bearer\s+(.+)$/iu.exec(authorization || "");
  if (!match) {
    return null;
  }
  const payload = match[1].split(".")[1];
  if (!payload) {
    return null;
  }
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof claims.sub === "string" ? claims.sub.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Every string in a JSON value, recursively. */
function collectStrings(value, out = []) {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, out);
    }
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectStrings(item, out);
    }
  }
  return out;
}

/** Raw JSON text plus every base64-looking field decoded to bytes. */
function searchableViews(rawText) {
  const views = [Buffer.from(rawText, "utf8")];
  const parsed = parseJson(rawText);
  for (const text of collectStrings(parsed)) {
    if (BASE64_FIELD.test(text) && text.length % 4 === 0) {
      views.push(Buffer.from(text, "base64"));
    }
  }
  return views;
}

/**
 * @param {{ corsHeaders: () => Record<string, string> }} options the host
 *   sandbox's CORS headers (credentialed, exact frontend origin).
 */
function createE2eeSandboxApi({ corsHeaders }) {
  const reply = (res, status, body) =>
    writeJson(res, status, body, corsHeaders);
  let ds = createFakeDeliveryService();
  let wallets = new Map(); // key -> lowercase wallet
  let faults = [];
  let tamper = null;
  /** Raw e2ee request and response bodies, as the server saw them. */
  let traffic = [];

  const userByKey = (key) =>
    E2EE_SANDBOX_USERS.find((user) => user.key === key) ?? null;

  const registeredUsers = () =>
    E2EE_SANDBOX_USERS.filter((user) => wallets.has(user.key));

  const userByWallet = (wallet) =>
    registeredUsers().find((user) => wallets.get(user.key) === wallet) ?? null;

  const userByIdentityKey = (rawKey) => {
    const key = decodeURIComponent(rawKey).toLowerCase();
    return (
      registeredUsers().find(
        (user) =>
          user.key === key ||
          user.profileId === key ||
          wallets.get(user.key) === key
      ) ?? null
    );
  };

  function identity(user) {
    const wallet = wallets.get(user.key);
    return {
      id: user.profileId,
      query: user.key,
      handle: user.key,
      normalised_handle: user.key,
      pfp: null,
      banner1_color: null,
      banner2_color: null,
      cic: 0,
      rep: 0,
      tdh: 0,
      tdh_rate: 0,
      xtdh: 0,
      xtdh_rate: 0,
      level: 1,
      classification: "PSEUDONYM",
      sub_classification: null,
      primary_address: wallet,
      primary_wallet: wallet,
      wallets: [{ wallet, display: wallet, tdh: 0, rep: 0, cic: 0 }],
      subscribed_actions: [],
      archived: false,
      active_main_stage_submission_ids: [],
      winner_main_stage_drop_ids: [],
      artist_of_prevote_cards: [],
      profile_wave_id: null,
      is_wave_creator: false,
    };
  }

  function communityMember(user) {
    const wallet = wallets.get(user.key);
    return {
      profile_id: user.profileId,
      handle: user.key,
      normalised_handle: user.key,
      primary_wallet: wallet,
      display: user.key,
      tdh: 1,
      level: 1,
      cic_rating: 0,
      wallet,
      pfp: null,
    };
  }

  function reset(body) {
    ds = createFakeDeliveryService();
    wallets = new Map();
    faults = [];
    tamper = null;
    traffic = [];
    for (const [key, wallet] of Object.entries(body.wallets || {})) {
      const user = userByKey(key);
      const normalized = String(wallet).toLowerCase();
      if (!user || !HEX_ADDRESS.test(normalized)) {
        throw new Error(`Unknown sandbox user or wallet: ${key}`);
      }
      wallets.set(key, normalized);
      // Contract 2.2 step 4: grants must be signed by the profile's wallet.
      ds.setWallets(user.profileId, [normalized]);
    }
    ds.setTamper((item, context) => applyTamper(item, context));
    return {
      users: registeredUsers().map((user) => ({
        key: user.key,
        profileId: user.profileId,
        wallet: wallets.get(user.key),
      })),
    };
  }

  function applyTamper(item, context) {
    if (
      tamper?.mode === "epoch_fp" &&
      item.type === "message" &&
      context.profileId === userByKey(tamper.viewer)?.profileId
    ) {
      return { ...item, epoch_fp: "0123456789abcdef" };
    }
    return item;
  }

  function requireUser(key) {
    const user = userByKey(key);
    if (!user) {
      throw new Error(`Unknown sandbox user: ${key}`);
    }
    return user;
  }

  function stateSummary() {
    const groups = [...ds.state.groups.values()].map((group) => ({
      group: group.g,
      epoch: group.epoch,
      roster: [...group.roster.values()].map((entry) => ({ ...entry })),
      items: group.items.map((item) => ({
        seq: item.seq,
        type: item.type,
        epoch: item.epoch,
        kind: item.kind,
        bytes: Buffer.from(item.data, "base64").length,
        roster_add: item.roster_add,
        roster_remove: item.roster_remove,
      })),
    }));
    return {
      groups,
      devices: [...ds.state.devices.values()].map((device) => ({
        device_key: device.device_key,
        profile_id: device.profile_id,
        revoked_at: device.revoked_at,
      })),
      reports: ds.state.reports.map((report) => ({
        id: report.id,
        verified: report.verified,
        sender_profile_id: report.sender_profile_id,
        reporter_profile_id: report.reporter_profile_id,
        reason: report.reason,
        body: report.body,
      })),
      notify: ds.state.notifyLog.map((entry) => ({ ...entry })),
      requests: ds.state.requests.map((request) => ({ ...request })),
    };
  }

  /**
   * Searches everything the delivery service received or served (raw JSON
   * plus every decoded base64 field) for each needle. Reports carry the
   * reported message body by design (contract 7.9), so they are listed
   * separately.
   */
  function plaintextScan(body) {
    const needles = (body.needles || []).map(String).filter(Boolean);
    const stored = JSON.stringify(
      [...ds.state.groups.values()].map((group) => ({
        items: group.items,
        commitKeys: [...group.commitKeys.entries()],
      }))
    );
    const sources = [
      ...traffic
        .filter((entry) => !entry.path.startsWith("e2ee/reports"))
        .flatMap((entry) => [entry.request, entry.response]),
      stored,
      JSON.stringify([...ds.state.welcomes.values()]),
      JSON.stringify([...ds.state.keyPackages.entries()]),
      JSON.stringify(
        [...ds.state.blobs.values()].map((blob) => [...blob.chunks.values()])
      ),
      JSON.stringify(ds.state.notifyLog),
    ];
    const views = sources.flatMap((text) => searchableViews(text || ""));
    const reportViews = traffic
      .filter((entry) => entry.path.startsWith("e2ee/reports"))
      .flatMap((entry) => searchableViews(entry.request || ""));
    return {
      scannedSources: sources.length,
      scannedBytes: views.reduce((sum, view) => sum + view.length, 0),
      found: needles.filter((needle) =>
        views.some((view) => view.includes(Buffer.from(needle, "utf8")))
      ),
      foundInReports: needles.filter((needle) =>
        reportViews.some((view) => view.includes(Buffer.from(needle, "utf8")))
      ),
    };
  }

  const controls = {
    reset: (body) => reset(body),
    policy: (body) => {
      if (!DM_POLICIES.has(body.dm_policy)) {
        throw new Error("Unknown DM policy.");
      }
      ds.setDmPolicy(requireUser(body.user).profileId, body.dm_policy);
      return { ok: true };
    },
    block: (body) => {
      const blocker = requireUser(body.blocker).profileId;
      const blocked = requireUser(body.blocked).profileId;
      if (body.on === false) {
        ds.unblock(blocker, blocked);
      } else {
        ds.block(blocker, blocked);
      }
      return { ok: true };
    },
    follow: (body) => {
      ds.follow(
        requireUser(body.subscriber).profileId,
        requireUser(body.target).profileId
      );
      return { ok: true };
    },
    fault: (body) => {
      const fault = {
        method: String(body.method || "POST").toUpperCase(),
        path: new RegExp(String(body.path)),
        kind: body.kind ?? null,
        status: Number(body.status || 500),
        hits: 0,
      };
      faults.push(fault);
      return { ok: true, faults: faults.length };
    },
    "clear-faults": () => {
      const hits = faults.reduce((sum, fault) => sum + fault.hits, 0);
      faults = [];
      return { ok: true, hits };
    },
    tamper: (body) => {
      tamper =
        body.mode === "epoch_fp"
          ? { mode: "epoch_fp", viewer: requireUser(body.viewer).key }
          : null;
      return { ok: true };
    },
    "plaintext-scan": (body) => plaintextScan(body),
  };

  function handleControl(method, pathname, body, res) {
    const name = pathname.slice(CONTROL_PREFIX.length);
    if (method === "GET" && name === "state") {
      reply(res, 200, stateSummary());
      return;
    }
    const control = method === "POST" ? controls[name] : undefined;
    if (!control) {
      reply(res, 404, { error: "Unknown E2EE sandbox control." });
      return;
    }
    try {
      reply(res, 200, control(body || {}));
    } catch (error) {
      reply(res, 400, { error: error.message });
    }
  }

  function takeFault(method, path, body) {
    const fault = faults.find(
      (candidate) =>
        candidate.method === method &&
        candidate.path.test(path) &&
        (candidate.kind === null || body?.kind === candidate.kind)
    );
    if (fault) {
      fault.hits += 1;
    }
    return fault ?? null;
  }

  async function handleE2ee(req, res, method, url, pathname, rawBody) {
    const path = pathname.replace(/^\/api\//u, "");
    const body = parseJson(rawBody);
    if (body === null) {
      reply(res, 400, { error: "Invalid JSON.", code: null });
      return;
    }
    const user = userByWallet(decodeJwtSubject(req.headers.authorization));
    const fault = takeFault(method, path, body);
    let response;
    if (fault) {
      response = {
        status: fault.status,
        body: { error: "sandbox fault", code: null },
      };
    } else {
      response = await ds.handle(method, path, {
        profileId: user?.profileId,
        body,
        query: Object.fromEntries(url.searchParams.entries()),
      });
    }
    const responseText = JSON.stringify(response.body);
    traffic.push({ path, request: rawBody, response: responseText });
    res.writeHead(response.status, {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(responseText),
      "Cache-Control": "no-store",
    });
    res.end(responseText);
  }

  function handleIdentityRead(pathname, url, res) {
    const identityMatch = /^\/api\/identities\/([^/]+)$/u.exec(pathname);
    if (identityMatch) {
      const user = userByIdentityKey(identityMatch[1]);
      if (!user) {
        return false;
      }
      reply(res, 200, identity(user));
      return true;
    }
    if (pathname === "/api/community-members") {
      const query = (url.searchParams.get("param") || "").trim().toLowerCase();
      const members =
        query.length >= 3
          ? registeredUsers()
              .filter((user) => user.key.includes(query))
              .map(communityMember)
          : [];
      reply(res, 200, members);
      return true;
    }
    return false;
  }

  function handlePlaintextDmGroupRead(pathname, res) {
    if (pathname === `/api/groups/${PLAINTEXT_DM_GROUP_ID}`) {
      reply(res, 200, {
        id: PLAINTEXT_DM_GROUP_ID,
        name: "Sandbox direct message",
        created_at: CREATED_AT,
        created_by: null,
        visible: false,
        is_private: true,
        is_direct_message: true,
        group: {
          tdh: { min: null, max: null, inclusion_strategy: "TDH" },
          rep: {
            min: null,
            max: null,
            direction: "RECEIVED",
            user_identity: null,
            category: null,
          },
          cic: {
            min: null,
            max: null,
            direction: "RECEIVED",
            user_identity: null,
          },
          level: { min: null, max: null },
          owns_nfts: [],
          identity_group_id: PLAINTEXT_DM_IDENTITY_GROUP_ID,
          identity_group_identities_count: PLAINTEXT_DM_MEMBERS.length,
          excluded_identity_group_id: null,
          excluded_identity_group_identities_count: 0,
        },
      });
      return true;
    }
    if (
      pathname ===
      `/api/groups/${PLAINTEXT_DM_GROUP_ID}/identity_groups/${PLAINTEXT_DM_IDENTITY_GROUP_ID}`
    ) {
      reply(
        res,
        200,
        PLAINTEXT_DM_MEMBERS.map((key) => wallets.get(key)).filter(Boolean)
      );
      return true;
    }
    return false;
  }

  /**
   * Handles the request when it belongs to the E2EE layer. Must run before
   * the composer sandbox reads the body (E2EE bodies exceed its 16 KiB cap).
   */
  async function handle(req, res, { method, url, pathname }) {
    if (pathname.startsWith(CONTROL_PREFIX)) {
      const raw = method === "GET" ? "" : await readBody(req);
      handleControl(method, pathname, parseJson(raw), res);
      return true;
    }
    if (pathname === "/api/e2ee" || pathname.startsWith("/api/e2ee/")) {
      const raw =
        method === "GET" || method === "HEAD" ? "" : await readBody(req);
      await handleE2ee(req, res, method, url, pathname, raw);
      return true;
    }
    if (method !== "GET") {
      return false;
    }
    return (
      handleIdentityRead(pathname, url, res) ||
      handlePlaintextDmGroupRead(pathname, res)
    );
  }

  /** Points the plaintext DM fixture at its access group (alice and bob). */
  function decorateDirectMessageWave(wave) {
    return {
      ...wave,
      chat: {
        ...wave.chat,
        scope: {
          ...wave.chat?.scope,
          group: {
            ...wave.chat?.scope?.group,
            id: PLAINTEXT_DM_GROUP_ID,
            is_direct_message: true,
          },
        },
      },
    };
  }

  return { handle, decorateDirectMessageWave };
}

module.exports = {
  createE2eeSandboxApi,
  E2EE_SANDBOX_USERS,
  PLAINTEXT_DM_GROUP_ID,
};
