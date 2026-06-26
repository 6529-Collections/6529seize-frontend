#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const DEFAULT_STATE_PATH = path.join(
  os.homedir(),
  ".codex",
  "6529-agent-login",
  "accounts.json"
);
const DEFAULT_TTL_MS = 60 * 60 * 1000;
const STATE_VERSION = 1;

const STORAGE_KEYS = {
  accounts: "6529-wallet-accounts",
  activeAddress: "6529-wallet-active-address",
  legacyAddress: "6529-wallet-address",
  legacyRefreshToken: "6529-wallet-refresh-token",
  legacyRole: "6529-wallet-role",
  authCookie: "wallet-auth",
};

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      args._.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function sleepSync(ms) {
  const buffer = new SharedArrayBuffer(4);
  const view = new Int32Array(buffer);
  Atomics.wait(view, 0, 0, ms);
}

function withStateLock(statePath, fn) {
  const lockPath = `${statePath}.lock`;
  fs.mkdirSync(path.dirname(statePath), { recursive: true, mode: 0o700 });

  let locked = false;
  const deadline = Date.now() + 5000;
  while (!locked) {
    try {
      fs.writeFileSync(lockPath, String(process.pid), {
        flag: "wx",
        mode: 0o600,
      });
      locked = true;
    } catch (error) {
      if (error?.code !== "EEXIST" || Date.now() > deadline) {
        throw error;
      }
      sleepSync(50);
    }
  }

  try {
    const state = loadState(statePath);
    pruneExpiredLeases(state);
    const result = fn(state);
    saveState(statePath, state);
    return result;
  } finally {
    try {
      fs.unlinkSync(lockPath);
    } catch {}
  }
}

function emptyState() {
  return {
    version: STATE_VERSION,
    accounts: [],
    leases: [],
  };
}

function loadState(statePath) {
  if (!fs.existsSync(statePath)) {
    return emptyState();
  }
  const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
  if (parsed.version !== STATE_VERSION) {
    throw new Error(`Unsupported account pool version: ${parsed.version}`);
  }
  if (!Array.isArray(parsed.accounts) || !Array.isArray(parsed.leases)) {
    throw new TypeError("Invalid account pool file");
  }
  return parsed;
}

function saveState(statePath, state) {
  const tempPath = `${statePath}.${process.pid}.${Date.now()}.tmp`;
  fs.mkdirSync(path.dirname(statePath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(tempPath, `${JSON.stringify(state, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  fs.renameSync(tempPath, statePath);
  try {
    fs.chmodSync(statePath, 0o600);
  } catch {}
}

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function randomId(prefix = "agent") {
  return `${prefix}-${crypto.randomBytes(4).toString("hex")}`;
}

function normalizeCapabilities(value) {
  let values = [];
  if (Array.isArray(value)) {
    values = value;
  } else if (value) {
    values = [value];
  }
  return Array.from(
    new Set(
      values
        .map((capability) => String(capability || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

function parseEnvFile(filePath, target) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_]\w*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    if (target[key] !== undefined) continue;
    let value = match[2] ?? "";
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    target[key] = value.replaceAll(String.raw`\n`, "\n");
  }
}

function loadRepoEnv(repoRoot) {
  const env = { ...process.env };
  const nodeEnv = env.NODE_ENV || "development";
  parseEnvFile(path.join(repoRoot, `.env.${nodeEnv}`), env);
  parseEnvFile(path.join(repoRoot, ".env"), env);
  return env;
}

function resolveRepoRoot(args) {
  return path.resolve(String(args.repo || process.cwd()));
}

function loadEthers(repoRoot) {
  const requireFromRepo = createRequire(path.join(repoRoot, "package.json"));
  return requireFromRepo("ethers");
}

function normalizeApiBase(value) {
  if (!value) {
    throw new Error("Missing API endpoint. Pass --api or set API_ENDPOINT.");
  }
  let withoutSlash = String(value);
  while (withoutSlash.endsWith("/")) {
    withoutSlash = withoutSlash.slice(0, -1);
  }
  return withoutSlash.endsWith("/api") ? withoutSlash : `${withoutSlash}/api`;
}

function is6529Host(hostname) {
  return hostname === "6529.io" || hostname.endsWith(".6529.io");
}

function inferFirstPartyOrigin(apiEndpoint) {
  try {
    const hostname = new URL(String(apiEndpoint)).hostname;
    if (!is6529Host(hostname)) {
      return null;
    }
    if (hostname.split(".").includes("staging")) {
      return "https://staging.6529.io";
    }
    return "https://6529.io";
  } catch {}
  return null;
}

function accountForOutput(account, state) {
  const lease = state.leases.find((entry) => entry.accountId === account.id);
  return {
    id: account.id,
    label: account.label,
    address: account.address,
    capabilities: account.capabilities || [],
    profileHandle: account.profileHandle || null,
    createdAt: account.createdAt,
    lease: lease
      ? {
          clientId: lease.clientId,
          claimedAt: lease.claimedAt,
          expiresAt: lease.expiresAt,
        }
      : null,
  };
}

function findAccount(state, { id, address }, ethers) {
  if (id) {
    return state.accounts.find((account) => account.id === id) || null;
  }
  if (address) {
    const checksummed = ethers.getAddress(address);
    return (
      state.accounts.find(
        (account) => ethers.getAddress(account.address) === checksummed
      ) || null
    );
  }
  return null;
}

function addAccount(state, params, ethers) {
  const wallet = params.privateKey
    ? new ethers.Wallet(params.privateKey)
    : ethers.Wallet.createRandom();
  const id =
    normalizeId(params.id) || randomId(params.privateKey ? "seeded" : "agent");
  if (state.accounts.some((account) => account.id === id)) {
    throw new Error(`Account id already exists: ${id}`);
  }
  const address = ethers.getAddress(wallet.address);
  if (
    state.accounts.some(
      (account) => ethers.getAddress(account.address) === address
    )
  ) {
    throw new Error(`Account address already exists: ${address}`);
  }

  const account = {
    id,
    label: String(params.label || id),
    address,
    privateKey: wallet.privateKey,
    capabilities: normalizeCapabilities(params.capabilities),
    profileHandle: params.profileHandle ? String(params.profileHandle) : null,
    createdAt: new Date().toISOString(),
  };
  state.accounts.push(account);
  return account;
}

function accountMatchesCapabilities(account, requestedCapabilities) {
  if (requestedCapabilities.length === 0) return true;
  const accountCapabilities = new Set(account.capabilities || []);
  return requestedCapabilities.every((capability) =>
    accountCapabilities.has(capability)
  );
}

function pruneExpiredLeases(state) {
  const now = Date.now();
  state.leases = state.leases.filter((lease) => lease.expiresAt > now);
}

function claimAccount(state, params, ethers) {
  const clientId = requireString(params.clientId, "client-id");
  const requestedCapabilities = normalizeCapabilities(params.capabilities);
  let account = findAccount(state, params, ethers);

  if (!account) {
    const existingLease = state.leases.find(
      (lease) => lease.clientId === clientId
    );
    account = existingLease
      ? state.accounts.find(
          (candidate) =>
            candidate.id === existingLease.accountId &&
            accountMatchesCapabilities(candidate, requestedCapabilities)
        ) || null
      : null;
  }

  if (!account) {
    account =
      state.accounts.find((candidate) => {
        if (!accountMatchesCapabilities(candidate, requestedCapabilities)) {
          return false;
        }
        const lease = state.leases.find(
          (entry) => entry.accountId === candidate.id
        );
        return !lease || lease.clientId === clientId;
      }) || null;
  }

  if (!account && params.createIfNeeded !== false) {
    account = addAccount(
      state,
      {
        id: params.id,
        label: params.label || `Auto ${clientId}`,
        capabilities: requestedCapabilities,
        profileHandle: params.profileHandle,
      },
      ethers
    );
  }

  if (!account) {
    throw new Error("No available account matches this claim");
  }

  const existingAccountLease = state.leases.find(
    (lease) => lease.accountId === account.id
  );
  if (existingAccountLease && existingAccountLease.clientId !== clientId) {
    throw new Error(
      `Account ${account.id} is leased to ${existingAccountLease.clientId}`
    );
  }

  const ttlMs = Number.isFinite(Number(params.ttlMs))
    ? Math.max(10_000, Math.min(Number(params.ttlMs), 24 * 60 * 60 * 1000))
    : DEFAULT_TTL_MS;
  const now = Date.now();
  state.leases = state.leases.filter((lease) => lease.accountId !== account.id);
  state.leases.push({
    accountId: account.id,
    clientId,
    claimedAt: now,
    expiresAt: now + ttlMs,
  });
  return account;
}

function releaseAccount(state, params, ethers) {
  const clientId = requireString(params.clientId, "client-id");
  const account = findAccount(state, params, ethers);
  const before = state.leases.length;
  state.leases = state.leases.filter((lease) => {
    if (lease.clientId !== clientId) return true;
    if (!account) return false;
    return lease.accountId !== account.id;
  });
  return before - state.leases.length;
}

function requireString(value, name) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required --${name}`);
  }
  return value.trim();
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!response.ok) {
    const message =
      body && typeof body === "object"
        ? body.error || body.message || JSON.stringify(body)
        : body || response.statusText;
    throw new Error(`API request failed (${response.status}): ${message}`);
  }
  return body;
}

function buildApiHeaders(env) {
  return {
    accept: "application/json",
    ...(env.ORIGIN ? { origin: env.ORIGIN } : {}),
    ...(env.STAGING_API_KEY ? { "x-6529-auth": env.STAGING_API_KEY } : {}),
  };
}

async function loginWithAccount({ account, apiBase, env, role, ethers }) {
  const wallet = new ethers.Wallet(account.privateKey);
  const address = ethers.getAddress(wallet.address);
  const nonceUrl = new URL(`${apiBase}/auth/session-nonce`);
  nonceUrl.searchParams.set("signer_address", address);
  nonceUrl.searchParams.set("client_type", "web");
  nonceUrl.searchParams.set("chain_id", "1");

  const nonce = await fetchJson(nonceUrl, {
    method: "GET",
    headers: buildApiHeaders(env),
  });
  if (!nonce?.signable_message || !nonce?.server_signature) {
    throw new Error("Nonce response did not include signable_message");
  }

  const clientSignature = await wallet.signMessage(nonce.signable_message);
  const loginBody = {
    client_type: "web",
    server_signature: nonce.server_signature,
    client_signature: clientSignature,
    client_address: address,
    ...(role ? { role } : {}),
  };
  const session = await fetchJson(`${apiBase}/auth/session-login`, {
    method: "POST",
    headers: {
      ...buildApiHeaders(env),
      "content-type": "application/json",
    },
    body: JSON.stringify(loginBody),
  });
  if (!session?.access_token) {
    throw new Error("Login response did not include access_token");
  }

  return {
    account: {
      id: account.id,
      label: account.label,
      address,
      profileHandle: account.profileHandle || null,
    },
    session: {
      address: session.address || address,
      role: session.role ?? null,
      accessToken: session.access_token,
      accessTokenExpiresAt: session.access_token_expires_at ?? null,
      clientType: session.client_type ?? "web",
    },
  };
}

function buildLoginBrowserScript(payload) {
  return `(() => {
  const payload = ${JSON.stringify(payload)};
  const account = {
    address: payload.session.address,
    refreshToken: null,
    role: payload.session.role,
    jwt: payload.session.accessToken,
    profileId: null,
    profileHandle: payload.account.profileHandle,
    authSessionVersion: "v2",
  };
  localStorage.setItem(${JSON.stringify(STORAGE_KEYS.accounts)}, JSON.stringify([account]));
  localStorage.setItem(${JSON.stringify(STORAGE_KEYS.activeAddress)}, account.address);
  localStorage.setItem(${JSON.stringify(STORAGE_KEYS.legacyAddress)}, account.address);
  localStorage.removeItem(${JSON.stringify(STORAGE_KEYS.legacyRefreshToken)});
  if (account.role) {
    localStorage.setItem(${JSON.stringify(STORAGE_KEYS.legacyRole)}, account.role);
    localStorage.setItem("auth-role-" + account.address.toLowerCase(), account.role);
  } else {
    localStorage.removeItem(${JSON.stringify(STORAGE_KEYS.legacyRole)});
    localStorage.removeItem("auth-role-" + account.address.toLowerCase());
  }
  document.cookie = ${JSON.stringify(STORAGE_KEYS.authCookie)} + "=" + encodeURIComponent(account.jwt) + "; path=/; SameSite=Strict";
  window.dispatchEvent(new CustomEvent("6529-wallet-accounts-updated"));
  window.dispatchEvent(new CustomEvent("6529-auth-token-changed"));
  window.dispatchEvent(new CustomEvent("6529-profile-switched"));
  return {
    ok: true,
    address: account.address,
    accountId: payload.account.id,
  };
})();`;
}

function buildStoredAccount(payload) {
  return {
    address: payload.session.address,
    refreshToken: null,
    role: payload.session.role,
    jwt: payload.session.accessToken,
    profileId: null,
    profileHandle: payload.account.profileHandle,
    authSessionVersion: "v2",
  };
}

function buildLocalStorageEntries(payload) {
  const account = buildStoredAccount(payload);
  const entries = [
    {
      name: STORAGE_KEYS.accounts,
      value: JSON.stringify([account]),
    },
    {
      name: STORAGE_KEYS.activeAddress,
      value: account.address,
    },
    {
      name: STORAGE_KEYS.legacyAddress,
      value: account.address,
    },
  ];

  if (account.role) {
    entries.push(
      {
        name: STORAGE_KEYS.legacyRole,
        value: account.role,
      },
      {
        name: `auth-role-${account.address.toLowerCase()}`,
        value: account.role,
      }
    );
  }

  return entries;
}

function normalizeOrigin(value) {
  const url = new URL(String(value || "http://localhost:3001"));
  return url.origin;
}

function getCookieExpires(payload) {
  const expiresAt = Date.parse(
    String(payload.session.accessTokenExpiresAt || "")
  );
  return Number.isFinite(expiresAt) ? Math.floor(expiresAt / 1000) : -1;
}

function buildPlaywrightStorageState(payload, baseUrl) {
  const origin = normalizeOrigin(baseUrl);
  const url = new URL(origin);
  return {
    cookies: [
      {
        name: STORAGE_KEYS.authCookie,
        value: payload.session.accessToken,
        domain: url.hostname,
        path: "/",
        expires: getCookieExpires(payload),
        httpOnly: false,
        secure: url.protocol === "https:",
        sameSite: "Strict",
      },
    ],
    origins: [
      {
        origin,
        localStorage: buildLocalStorageEntries(payload),
      },
    ],
  };
}

function buildLogoutBrowserScript() {
  return `(() => {
  const keys = ${JSON.stringify(Object.values(STORAGE_KEYS).filter((key) => key !== STORAGE_KEYS.authCookie))};
  for (const key of keys) localStorage.removeItem(key);
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("auth-role-")) localStorage.removeItem(key);
  }
  document.cookie = ${JSON.stringify(STORAGE_KEYS.authCookie)} + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
  window.dispatchEvent(new CustomEvent("6529-wallet-accounts-updated"));
  window.dispatchEvent(new CustomEvent("6529-auth-token-changed"));
  window.dispatchEvent(new CustomEvent("6529-profile-switched"));
  return { ok: true };
})();`;
}

function writeOutput(value, format) {
  if (format === "quiet") return;
  if (format === "browser-script") {
    process.stdout.write(`${value}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "help";
  const format = String(args.format || "json");
  const statePath = path.resolve(String(args.state || DEFAULT_STATE_PATH));
  const repoRoot = resolveRepoRoot(args);
  const env = loadRepoEnv(repoRoot);
  const ethers = loadEthers(repoRoot);

  if (command === "help") {
    writeOutput(
      {
        commands: [
          "list",
          "create",
          "import",
          "claim",
          "release",
          "login",
          "logout",
        ],
        formats: [
          "json",
          "browser-script",
          "storage-state",
          "playwright-storage",
          "quiet",
        ],
        statePath,
      },
      format
    );
    return;
  }

  if (command === "logout") {
    writeOutput(
      format === "browser-script" ? buildLogoutBrowserScript() : { ok: true },
      format
    );
    return;
  }

  if (command === "list") {
    const state = loadState(statePath);
    pruneExpiredLeases(state);
    writeOutput(
      {
        statePath,
        accounts: state.accounts.map((account) =>
          accountForOutput(account, state)
        ),
      },
      format
    );
    return;
  }

  if (command === "create" || command === "import") {
    const account = withStateLock(statePath, (state) =>
      addAccount(
        state,
        {
          id: args.id,
          label: args.label,
          privateKey:
            command === "import"
              ? requireString(args["private-key"], "private-key")
              : undefined,
          capabilities: normalizeCapabilities(args.capability),
          profileHandle: args.handle,
        },
        ethers
      )
    );
    writeOutput(
      {
        account: {
          id: account.id,
          label: account.label,
          address: account.address,
        },
      },
      format
    );
    return;
  }

  if (command === "claim") {
    let redacted;
    withStateLock(statePath, (state) => {
      const account = claimAccount(
        state,
        {
          clientId: args["client-id"] || args.clientId,
          id: args.id,
          address: args.address,
          label: args.label,
          capabilities: normalizeCapabilities(args.capability),
          profileHandle: args.handle,
          createIfNeeded: args.create !== "false",
          ttlMs: args.ttlMs,
        },
        ethers
      );
      redacted = accountForOutput(account, state);
      return account;
    });
    writeOutput({ account: redacted }, format);
    return;
  }

  if (command === "release") {
    const released = withStateLock(statePath, (state) =>
      releaseAccount(
        state,
        {
          clientId: args["client-id"] || args.clientId,
          id: args.id,
          address: args.address,
        },
        ethers
      )
    );
    writeOutput({ released }, format);
    return;
  }

  if (command === "login") {
    let account;
    withStateLock(statePath, (state) => {
      account = claimAccount(
        state,
        {
          clientId: args["client-id"] || args.clientId,
          id: args.id,
          address: args.address,
          label: args.label,
          capabilities: normalizeCapabilities(args.capability),
          profileHandle: args.handle,
          createIfNeeded: args.create !== "false",
          ttlMs: args.ttlMs,
        },
        ethers
      );
      return account;
    });

    const apiEndpoint = args.api || env.API_ENDPOINT;
    const apiBase = normalizeApiBase(apiEndpoint);
    const payload = await loginWithAccount({
      account,
      apiBase,
      env: {
        STAGING_API_KEY: args["staging-auth"] || env.STAGING_API_KEY,
        ORIGIN:
          args.origin ||
          env.AGENT_LOGIN_ORIGIN ||
          inferFirstPartyOrigin(apiEndpoint) ||
          args["base-url"] ||
          env.BASE_ENDPOINT,
      },
      role: args.role,
      ethers,
    });

    let output = payload;
    if (format === "browser-script") {
      output = buildLoginBrowserScript(payload);
    } else if (format === "storage-state" || format === "playwright-storage") {
      output = buildPlaywrightStorageState(
        payload,
        args["base-url"] || env.BASE_ENDPOINT || "http://localhost:3001"
      );
    }
    writeOutput(output, format);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

try {
  await main();
} catch (error) {
  console.error("Agent login command failed.");
  process.exitCode = 1;
}
