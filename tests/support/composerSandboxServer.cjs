const http = require("http");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

require("dotenv").config();
require("dotenv").config({ path: ".env.test" });

const repoRoot = path.resolve(__dirname, "..", "..");
const frontendPort = Number(process.env.PORT || "3001");
const frontendHostname = "localhost";
const mockApiPort =
  Number(process.env.PLAYWRIGHT_COMPOSER_SANDBOX_API_PORT) ||
  frontendPort + 1000;
const frontendBaseUrl = `http://localhost:${frontendPort}`;
const mockApiOrigin = `http://127.0.0.1:${mockApiPort}`;
const mockWsOrigin = `ws://127.0.0.1:${mockApiPort}`;
const nextBin = require.resolve("next/dist/bin/next", { paths: [repoRoot] });

const SANDBOX_WAVE_ID = "00000000-0000-4000-8000-000000000529";
const SANDBOX_DROP_ID = "00000000-0000-4000-8000-000000000530";
const SANDBOX_WALLET =
  process.env.DEV_MODE_WALLET_ADDRESS ||
  "0x0000000000000000000000000000000000000529";
const SANDBOX_HANDLE =
  process.env.PLAYWRIGHT_DEV_AUTH_PROFILE_HANDLE || "playwright";
const SANDBOX_PROFILE_ID = "00000000-0000-4000-8000-000000000531";
const SANDBOX_DM_WAVE_ID = "00000000-0000-4000-8000-000000000532";
const SANDBOX_DM_RECIPIENT_WALLET =
  "0x0000000000000000000000000000000000000532";
const SANDBOX_DM_RECIPIENT_HANDLE = "sandbox-recipient";
const SANDBOX_NOTIFICATION_WAVE_ID = "00000000-0000-4000-8000-000000000533";
const SANDBOX_NOTIFICATION_DROP_ID = "00000000-0000-4000-8000-000000000534";
const SANDBOX_NOTIFICATION_REACTION_DROP_ID =
  "00000000-0000-4000-8000-000000000535";
const CREATED_AT = 1713744000000;
const PREVIEW_URL = "https://example.com/6529-composer-preview";
const publicScope = { group: null };
const requests = [];
const MAX_REQUEST_BODY_BYTES = 16 * 1024;

function encodeJwtPart(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function buildSyntheticJwt() {
  return [
    encodeJwtPart({ alg: "none", typ: "JWT" }),
    encodeJwtPart({
      id: "local-composer-sandbox",
      sub: SANDBOX_WALLET.toLowerCase(),
      iat: 1760000000,
      exp: 2000000000,
      role: "",
    }),
    "",
  ].join(".");
}

const localIdentityOverview = {
  id: SANDBOX_PROFILE_ID,
  handle: SANDBOX_HANDLE,
  pfp: null,
  level: 0,
  classification: "BOT",
  primary_address: SANDBOX_WALLET,
  badges: { profile_wave_id: null },
  context_profile_context: { subscribed: false },
};

const localProfile = {
  id: SANDBOX_PROFILE_ID,
  query: SANDBOX_HANDLE,
  handle: SANDBOX_HANDLE,
  normalised_handle: SANDBOX_HANDLE,
  pfp: null,
  banner1_color: null,
  banner2_color: null,
  cic: 0,
  rep: 0,
  tdh: 0,
  tdh_rate: 0,
  xtdh: 0,
  xtdh_rate: 0,
  level: 0,
  classification: "BOT",
  sub_classification: null,
  primary_address: SANDBOX_WALLET,
  wallets: [
    {
      wallet: SANDBOX_WALLET,
      display: SANDBOX_WALLET,
      tdh: 0,
      rep: 0,
      cic: 0,
    },
  ],
  subscribed_actions: [],
  archived: false,
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  profile_wave_id: null,
  is_wave_creator: false,
};

function identityOverview({
  id,
  handle,
  wallet,
  classification = "PSEUDONYM",
}) {
  return {
    id,
    handle,
    pfp: null,
    level: 0,
    classification,
    primary_address: wallet,
    badges: { profile_wave_id: null },
    context_profile_context: { subscribed: false },
  };
}

const dmRecipientCommunityMember = {
  wallet: SANDBOX_DM_RECIPIENT_WALLET,
  primary_wallet: SANDBOX_DM_RECIPIENT_WALLET,
  display: "sandbox-recipient.eth",
  handle: SANDBOX_DM_RECIPIENT_HANDLE,
  pfp: null,
  cic: 0,
  rep: 0,
  tdh: 1,
  level: 1,
  classification: "PSEUDONYM",
};

const localWaveMin = {
  id: SANDBOX_WAVE_ID,
  name: "Local Composer Sandbox Wave",
  picture: null,
  description_drop_id: "local-composer-sandbox-description-drop",
  last_drop_time: CREATED_AT,
  authenticated_user_eligible_to_vote: true,
  authenticated_user_eligible_to_participate: true,
  authenticated_user_eligible_to_chat: true,
  authenticated_user_admin: false,
  visibility_group_id: null,
  participation_group_id: null,
  chat_group_id: null,
  voting_group_id: null,
  admin_group_id: null,
  voting_period_start: null,
  voting_period_end: null,
  voting_credit_type: "REP",
  voting_credit_nfts: null,
  admin_drop_deletion_enabled: false,
  forbid_negative_votes: false,
  pinned: false,
  identity_wave: false,
  submission_type: null,
  links_disabled: false,
  wave_author_handle: SANDBOX_HANDLE,
  voting_credit_scope: "WAVE",
};

const localWaveOverview = {
  id: SANDBOX_WAVE_ID,
  name: localWaveMin.name,
  pfp: null,
  description_drop: {
    id: localWaveMin.description_drop_id,
    content: "Local-only composer sandbox wave for Playwright.",
  },
  author: localIdentityOverview,
  created_at: CREATED_AT,
  last_drop_time: CREATED_AT,
  total_drops_count: 1,
  is_private: false,
  is_dm_wave: false,
  has_competition: false,
  has_subwaves: false,
  parent_wave: null,
  links_disabled: false,
  forbid_negative_votes: false,
  context_profile_context: {
    can_chat: true,
    pinned: false,
    muted: false,
    subscribed: false,
    first_unread_drop_serial_no: null,
    unread_drops: 0,
  },
};

const localWave = {
  id: SANDBOX_WAVE_ID,
  serial_no: 6529,
  author: localProfile,
  name: localWaveMin.name,
  picture: null,
  created_at: CREATED_AT,
  last_drop_time: CREATED_AT,
  description_drop: {
    id: localWaveMin.description_drop_id,
    serial_no: 1,
    drop_type: "CHAT",
    rank: null,
    wave: localWaveMin,
    author: localProfile,
    created_at: CREATED_AT,
    updated_at: null,
    title: null,
    parts: [],
    parts_count: 1,
    referenced_nfts: [],
    mentioned_users: [],
    mentioned_groups: [],
    mentioned_waves: [],
    metadata: [],
    rating: 0,
    realtime_rating: 0,
    rating_prediction: 0,
    top_raters: [],
    raters_count: 0,
    context_profile_context: null,
    subscribed_actions: [],
    is_signed: false,
    reactions: [],
    boosts: 0,
    is_additional_action_promised: false,
    hide_link_preview: false,
    nft_links: [],
  },
  voting: {
    scope: publicScope,
    credit_type: "REP",
    credit_scope: "WAVE",
    credit_category: null,
    credit_nfts: null,
    creditor: null,
    period: { min: null, max: null },
    signature_required: false,
    authenticated_user_eligible: true,
    forbid_negative_votes: false,
  },
  visibility: { scope: publicScope },
  participation: {
    scope: publicScope,
    no_of_applications_allowed_per_participant: null,
    required_metadata: [],
    required_media: [],
    period: { min: null, max: null },
    signature_required: false,
    authenticated_user_eligible: true,
    terms: null,
    submission_strategy: null,
  },
  chat: {
    scope: publicScope,
    enabled: true,
    links_disabled: false,
    authenticated_user_eligible: true,
    slow_mode_cooldown_ms: null,
    next_drop_allowed: null,
  },
  wave: {
    type: "CHAT",
    winning_threshold: null,
    winning_threshold_min_duration_ms: null,
    max_winners: null,
    max_votes_per_identity_to_drop: null,
    time_lock_ms: null,
    admin_group: publicScope,
    authenticated_user_eligible_for_admin: false,
    decisions_strategy: null,
    next_decision_time: null,
    admin_drop_deletion_enabled: false,
    total_no_of_decisions: null,
    no_of_decisions_done: null,
    no_of_decisions_left: null,
  },
  contributors_overview: [],
  subscribed_actions: [],
  metrics: {
    drops_count: 1,
    latest_drop_timestamp: CREATED_AT,
    first_unread_drop_serial_no: null,
    your_unread_drops_count: 0,
    your_latest_read_timestamp: CREATED_AT,
    muted: false,
    your_participation_drops_count: 0,
  },
  pauses: [],
  pinned: false,
  identity_wave: false,
};

const localDrop = {
  id: SANDBOX_DROP_ID,
  serial_no: 1,
  drop_type: "CHAT",
  author: localIdentityOverview,
  created_at: CREATED_AT,
  updated_at: null,
  title: null,
  content: PREVIEW_URL,
  media: [],
  attachments: [],
  parts_count: 1,
  referenced_nfts: [],
  mentioned_users: [],
  mentioned_groups: [],
  mentioned_waves: [],
  priority_metadata: [],
  metadata: [],
  reactions: [],
  boosts: 0,
  is_signed: false,
  hide_link_preview: false,
  context_profile_context: {
    reaction: null,
    boosted: false,
    bookmarked: false,
  },
  submission_context: null,
  reply_to_drop: null,
  nft_links: [],
};

const dmWaveOverview = {
  ...localWaveOverview,
  id: SANDBOX_DM_WAVE_ID,
  name: "Sandbox Direct Message",
  description_drop: {
    id: "local-dm-description-drop",
    content: "Synthetic local-only direct message for Playwright.",
  },
  total_drops_count: 0,
  is_private: true,
  is_dm_wave: true,
};

const notificationWaveOverview = {
  ...localWaveOverview,
  id: SANDBOX_NOTIFICATION_WAVE_ID,
  name: "Sandbox Notifications Wave",
  description_drop: {
    id: "local-notification-description-drop",
    content: "Synthetic local-only notification wave for Playwright.",
  },
  total_drops_count: 2,
};

const dmWave = {
  ...localWave,
  id: SANDBOX_DM_WAVE_ID,
  name: dmWaveOverview.name,
  description_drop: {
    ...localWave.description_drop,
    id: dmWaveOverview.description_drop.id,
    content: dmWaveOverview.description_drop.content,
  },
  chat: {
    ...localWave.chat,
    scope: { group: { is_direct_message: true } },
  },
};

function notificationDrop({
  id,
  serialNo,
  content,
  author = localIdentityOverview,
}) {
  return {
    ...localDrop,
    id,
    serial_no: serialNo,
    author,
    content,
    created_at: CREATED_AT + serialNo,
  };
}

const mentionDrop = notificationDrop({
  id: SANDBOX_NOTIFICATION_DROP_ID,
  serialNo: 2,
  content: "Mentioned @playwright inside the sandbox notification flow.",
});

const reactionDrop = notificationDrop({
  id: SANDBOX_NOTIFICATION_REACTION_DROP_ID,
  serialNo: 3,
  content: "A sandbox drop with grouped reactions.",
});

function notificationIdentity(handle, idSuffix) {
  return identityOverview({
    id: `00000000-0000-4000-8000-000000000${idSuffix}`,
    handle,
    wallet: `0x0000000000000000000000000000000000000${idSuffix}`,
  });
}

const notificationActor = notificationIdentity("sandbox-alice", "541");
const notificationReactorOne = notificationIdentity("sandbox-bob", "542");
const notificationReactorTwo = notificationIdentity("sandbox-carol", "543");

const sandboxNotifications = [
  {
    id: 1001,
    cause: "IDENTITY_MENTIONED",
    created_at: CREATED_AT + 1001,
    read_at: null,
    related_identity: notificationActor,
    related_drops: [mentionDrop],
    related_wave: notificationWaveOverview,
    additional_context: {},
  },
  {
    id: 1002,
    cause: "DROP_REACTED",
    created_at: CREATED_AT + 1002,
    read_at: null,
    related_identity: notificationReactorOne,
    related_drops: [reactionDrop],
    related_wave: notificationWaveOverview,
    additional_context: { reaction: ":+1:" },
  },
  {
    id: 1003,
    cause: "DROP_REACTED",
    created_at: CREATED_AT + 1003,
    read_at: null,
    related_identity: notificationReactorTwo,
    related_drops: [reactionDrop],
    related_wave: notificationWaveOverview,
    additional_context: { reaction: ":+1:" },
  },
  {
    id: 1004,
    cause: "WAVE_CREATED",
    created_at: CREATED_AT + 1004,
    read_at: null,
    related_identity: notificationActor,
    related_drops: [],
    related_wave: notificationWaveOverview,
    additional_context: { wave_id: SANDBOX_NOTIFICATION_WAVE_ID },
  },
];
const sandboxNotificationIds = new Set(
  sandboxNotifications.map((notification) => String(notification.id))
);
const sandboxNotificationWaveIds = new Set([
  SANDBOX_WAVE_ID,
  SANDBOX_DM_WAVE_ID,
  SANDBOX_NOTIFICATION_WAVE_ID,
]);

function notificationResponse(searchParams) {
  const causeCsv = searchParams.get("cause");
  const causes = causeCsv
    ? new Set(
        causeCsv
          .split(",")
          .map((cause) => cause.trim())
          .filter(Boolean)
      )
    : null;
  const idLessThan = Number(searchParams.get("id_less_than") ?? NaN);
  const limit = Number(searchParams.get("limit") ?? "30");
  const notifications = (
    causes
      ? sandboxNotifications.filter((notification) =>
          causes.has(notification.cause)
        )
      : sandboxNotifications
  )
    .filter(
      (notification) => Number.isNaN(idLessThan) || notification.id < idLessThan
    )
    .sort((a, b) => b.id - a.id)
    .slice(0, Number.isFinite(limit) && limit > 0 ? limit : 30);

  return {
    unread_count: notifications.filter((notification) => !notification.read_at)
      .length,
    notifications,
  };
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": frontendBaseUrl,
    "Access-Control-Allow-Headers":
      "authorization, content-type, x-6529-auth, x-api-key",
    "Access-Control-Allow-Methods":
      "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

function writeJson(res, status, json) {
  const body = JSON.stringify(json);
  res.writeHead(status, {
    ...corsHeaders(),
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function writeEmpty(res, status) {
  res.writeHead(status, corsHeaders());
  res.end();
}

function emptyPage() {
  return { data: [], count: 0, page: 1, next: false };
}

function normalizedPath(url) {
  let pathname = url.pathname;
  while (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }
  return pathname || "/";
}

function isSafeReadMethod(method) {
  return method === "GET" || method === "HEAD";
}

function isDangerousComposerMutation(method, pathname) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return false;
  }

  return (
    pathname === "/api/drops" ||
    pathname.startsWith("/api/drops/") ||
    pathname.startsWith("/api/drop-media") ||
    pathname.startsWith("/api/attachments")
  );
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmptyRequestBody(body) {
  return (
    body === null ||
    body === undefined ||
    (isPlainObject(body) && Object.keys(body).length === 0)
  );
}

function isSameAddress(actual, expected) {
  return (
    typeof actual === "string" &&
    actual.toLowerCase() === expected.toLowerCase()
  );
}

function isExpectedDirectMessageBody(body) {
  if (!isPlainObject(body)) {
    return false;
  }

  const keys = Object.keys(body);
  return (
    keys.length === 1 &&
    keys[0] === "identity_addresses" &&
    Array.isArray(body.identity_addresses) &&
    body.identity_addresses.length === 1 &&
    isSameAddress(body.identity_addresses[0], SANDBOX_DM_RECIPIENT_WALLET)
  );
}

function notificationIdFromPath(pathname) {
  return pathname.match(/^\/api\/notifications\/(\d+)\/read$/)?.[1] ?? null;
}

function notificationWaveIdFromPath(pathname) {
  return (
    pathname.match(/^\/api\/notifications\/wave\/([^/]+)\/read$/)?.[1] ?? null
  );
}

function hasEmptySearchParams(searchParams) {
  return searchParams.toString() === "";
}

function isKnownSandboxMutation(method, pathname, searchParams, body) {
  if (method !== "POST") {
    return false;
  }

  if (!hasEmptySearchParams(searchParams)) {
    return false;
  }

  if (pathname === "/api/notifications/read") {
    return isEmptyRequestBody(body);
  }

  const notificationId = notificationIdFromPath(pathname);
  if (notificationId) {
    return (
      sandboxNotificationIds.has(notificationId) && isEmptyRequestBody(body)
    );
  }

  if (pathname === "/api/waves/direct-message/new") {
    return isExpectedDirectMessageBody(body);
  }

  const notificationWaveId = notificationWaveIdFromPath(pathname);
  if (notificationWaveId) {
    return (
      sandboxNotificationWaveIds.has(notificationWaveId) &&
      isEmptyRequestBody(body)
    );
  }

  return false;
}

function classifyRequest(method, pathname, searchParams, body) {
  if (isDangerousComposerMutation(method, pathname)) {
    return "dangerous-composer-mutation";
  }
  if (isKnownSandboxMutation(method, pathname, searchParams, body)) {
    return "allowed-sandbox-mutation";
  }
  if (!isSafeReadMethod(method)) {
    return "unhandled-mutation";
  }
  if (pathname.startsWith("/api/")) {
    return "api-read";
  }
  return "diagnostic";
}

function loggedRequestBody(pathname, body) {
  if (pathname !== "/api/waves/direct-message/new" || !isPlainObject(body)) {
    return undefined;
  }

  return {
    identity_addresses: Array.isArray(body.identity_addresses)
      ? body.identity_addresses
      : [],
  };
}

function recordRequest(method, url, body) {
  const pathname = normalizedPath(url);
  if (pathname.startsWith("/__composer-sandbox")) {
    return;
  }
  if (method === "OPTIONS") {
    return;
  }
  const loggedBody = loggedRequestBody(pathname, body);
  requests.push({
    method,
    path: pathname,
    kind: classifyRequest(method, pathname, url.searchParams, body),
    ...(loggedBody === undefined ? {} : { body: loggedBody }),
  });
}

function requestLog() {
  return requests.map((request) => ({ ...request }));
}

function handleDiagnostics(method, pathname, res) {
  if (pathname === "/__composer-sandbox/requests" && isSafeReadMethod(method)) {
    writeJson(res, 200, { requests: requestLog() });
    return true;
  }
  if (pathname === "/__composer-sandbox/reset" && method === "POST") {
    requests.length = 0;
    writeJson(res, 200, { ok: true });
    return true;
  }
  return false;
}

function handleMockApi(method, pathname, url, body, res) {
  if (pathname === "/api/community-members" && isSafeReadMethod(method)) {
    const query = url.searchParams.get("param") ?? "";
    const members =
      query.trim().length >= 3 ? [dmRecipientCommunityMember] : [];
    writeJson(res, 200, members);
    return true;
  }

  if (pathname === "/api/v2/waves" && isSafeReadMethod(method)) {
    writeJson(res, 200, { data: [localWaveOverview], page: 1, next: false });
    return true;
  }

  if (pathname === "/api/v2/official-waves" && isSafeReadMethod(method)) {
    writeJson(res, 200, [localWaveOverview]);
    return true;
  }

  if (
    pathname === `/api/waves/${SANDBOX_DM_WAVE_ID}` &&
    isSafeReadMethod(method)
  ) {
    writeJson(res, 200, dmWave);
    return true;
  }

  if (
    pathname === `/api/v2/waves/${SANDBOX_DM_WAVE_ID}/drops` &&
    isSafeReadMethod(method)
  ) {
    writeJson(res, 200, { wave: dmWaveOverview, drops: [] });
    return true;
  }

  if (/^\/api\/waves\/[^/]+$/.test(pathname) && isSafeReadMethod(method)) {
    writeJson(res, 200, localWave);
    return true;
  }

  if (
    /^\/api\/v2\/waves\/[^/]+\/drops$/.test(pathname) &&
    isSafeReadMethod(method)
  ) {
    writeJson(res, 200, { wave: localWaveOverview, drops: [localDrop] });
    return true;
  }

  if (
    /^\/api\/v2\/waves\/[^/]+\/search$/.test(pathname) &&
    isSafeReadMethod(method)
  ) {
    writeJson(res, 200, { data: [], page: 1, next: false });
    return true;
  }

  if (
    /^\/api\/v2\/waves\/[^/]+\/leaderboard$/.test(pathname) &&
    isSafeReadMethod(method)
  ) {
    writeJson(res, 200, {
      wave: localWaveMin,
      drops: [],
      count: 0,
      page: 1,
      next: false,
    });
    return true;
  }

  if (
    /^\/api\/v2\/waves\/[^/]+\/polls$/.test(pathname) &&
    isSafeReadMethod(method)
  ) {
    writeJson(res, 200, emptyPage());
    return true;
  }

  if (
    /^\/api\/waves\/[^/]+\/subwaves$/.test(pathname) &&
    isSafeReadMethod(method)
  ) {
    writeJson(res, 200, emptyPage());
    return true;
  }

  if (
    /^\/api\/v2\/waves\/[^/]+\/metadata$/.test(pathname) &&
    isSafeReadMethod(method)
  ) {
    writeJson(res, 200, []);
    return true;
  }

  if (pathname === "/api/v2/boosted-drops" && isSafeReadMethod(method)) {
    writeJson(res, 200, emptyPage());
    return true;
  }

  if (pathname === "/api/v2/drops" && isSafeReadMethod(method)) {
    writeJson(res, 200, emptyPage());
    return true;
  }

  if (
    /^\/api\/v2\/drops\/[^/]+\/metadata$/.test(pathname) &&
    isSafeReadMethod(method)
  ) {
    writeJson(res, 200, []);
    return true;
  }

  if (
    /^\/api\/v2\/drops\/[^/]+\/reactions$/.test(pathname) &&
    isSafeReadMethod(method)
  ) {
    writeJson(res, 200, []);
    return true;
  }

  if (/^\/api\/identities\/[^/]+$/.test(pathname) && isSafeReadMethod(method)) {
    writeJson(res, 200, localProfile);
    return true;
  }

  if (
    /^\/api\/profiles\/[^/]+\/proxies$/.test(pathname) &&
    isSafeReadMethod(method)
  ) {
    writeJson(res, 200, []);
    return true;
  }

  if (pathname === "/api/v2/notifications" && isSafeReadMethod(method)) {
    writeJson(res, 200, notificationResponse(url.searchParams));
    return true;
  }

  if (pathname === "/api/feed" && isSafeReadMethod(method)) {
    writeJson(res, 200, []);
    return true;
  }

  if (
    method === "POST" &&
    notificationWaveIdFromPath(pathname) &&
    isKnownSandboxMutation(method, pathname, url.searchParams, body)
  ) {
    writeEmpty(res, 204);
    return true;
  }

  if (
    method === "POST" &&
    (pathname === "/api/notifications/read" ||
      notificationIdFromPath(pathname)) &&
    isKnownSandboxMutation(method, pathname, url.searchParams, body)
  ) {
    writeEmpty(res, 204);
    return true;
  }

  if (
    method === "POST" &&
    pathname === "/api/waves/direct-message/new" &&
    isKnownSandboxMutation(method, pathname, url.searchParams, body)
  ) {
    writeJson(res, 200, dmWave);
    return true;
  }

  return false;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    req.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_REQUEST_BODY_BYTES) {
        reject(
          new Error("Sandbox request body exceeded the local size limit.")
        );
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

async function parseRequestBody(method, req) {
  if (isSafeReadMethod(method)) {
    return undefined;
  }

  const rawBody = await readRequestBody(req);
  if (rawBody.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return { __unparsed_json: true };
  }
}

async function handleRequest(req, res) {
  const method = (req.method || "GET").toUpperCase();
  const url = new URL(req.url || "/", mockApiOrigin);
  const pathname = normalizedPath(url);

  if (method === "OPTIONS") {
    writeEmpty(res, 204);
    return;
  }

  if (handleDiagnostics(method, pathname, res)) {
    return;
  }

  let requestBody;
  try {
    requestBody = await parseRequestBody(method, req);
  } catch {
    recordRequest(method, url, { __body_read_error: true });
    writeJson(res, 413, {
      error: "Sandbox request body exceeded the local size limit.",
    });
    return;
  }
  recordRequest(method, url, requestBody);

  if (handleMockApi(method, pathname, url, requestBody, res)) {
    return;
  }

  if (isDangerousComposerMutation(method, pathname)) {
    writeJson(res, 409, {
      error: "Composer sandbox blocked an unsafe write path.",
    });
    return;
  }

  if (!isSafeReadMethod(method)) {
    writeJson(res, 405, {
      error: "Unhandled mutation in composer sandbox.",
    });
    return;
  }

  writeJson(res, 200, emptyPage());
}

function buildPublicRuntime() {
  return {
    ALLOWLIST_API_ENDPOINT: mockApiOrigin,
    API_ENDPOINT: mockApiOrigin,
    BASE_ENDPOINT: frontendBaseUrl,
    IPFS_API_ENDPOINT:
      process.env.IPFS_API_ENDPOINT || "https://ipfs.6529.io/api/v0",
    IPFS_GATEWAY_ENDPOINT:
      process.env.IPFS_GATEWAY_ENDPOINT || "https://ipfs.6529.io/ipfs/",
    MEDIA_RESOLVER_ENDPOINT:
      process.env.MEDIA_RESOLVER_ENDPOINT || "https://media.6529.io",
    NODE_ENV: "development",
    PORT: String(frontendPort),
    WS_ENDPOINT: mockWsOrigin,
    USE_DEV_AUTH: "true",
    DEV_MODE_WALLET_ADDRESS: SANDBOX_WALLET,
    DEV_MODE_AUTH_JWT: buildSyntheticJwt(),
  };
}

function startNextDev() {
  const envSchemaBuild = spawnSync(
    process.execPath,
    ["scripts/build-env-schema.cjs"],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        SEIZE_6529_COMMAND: "1",
      },
      stdio: "inherit",
    }
  );

  if (envSchemaBuild.status !== 0) {
    throw new Error("Failed to build runtime environment schema.");
  }

  const useTurbo = process.env.USE_TURBO !== "false";
  const args = useTurbo
    ? [nextBin, "dev", "-p", String(frontendPort), "-H", frontendHostname]
    : [
        nextBin,
        "dev",
        "--webpack",
        "-p",
        String(frontendPort),
        "-H",
        frontendHostname,
      ];
  const publicRuntime = buildPublicRuntime();
  const env = {
    ...process.env,
    ...publicRuntime,
    __NEXT_EXPERIMENTAL_MCP_SERVER: "true",
    PUBLIC_RUNTIME: JSON.stringify(publicRuntime),
    SEIZE_6529_COMMAND: "1",
    PORT: String(frontendPort),
  };

  return spawn(process.execPath, args, {
    cwd: repoRoot,
    env,
    stdio: "inherit",
  });
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error(`Composer sandbox request failed: ${error.message}`);
    if (res.headersSent) {
      res.destroy();
      return;
    }
    writeJson(res, 500, { error: "Composer sandbox request failed." });
  });
});
let nextChild = null;

server.on("error", (error) => {
  console.error(`Composer sandbox mock API failed: ${error.message}`);
  process.exit(1);
});

server.listen(mockApiPort, "127.0.0.1", () => {
  console.log(`Composer sandbox mock API listening on ${mockApiOrigin}`);
  nextChild = startNextDev();
  nextChild.on("exit", (code) => {
    server.close(() => process.exit(code || 0));
  });
  nextChild.on("error", (error) => {
    console.error(`Failed to start Next.js dev server: ${error.message}`);
    server.close(() => process.exit(1));
  });
});

function shutdown() {
  if (nextChild && !nextChild.killed) {
    nextChild.kill();
  }
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
