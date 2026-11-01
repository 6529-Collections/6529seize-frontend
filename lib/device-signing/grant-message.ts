import { isDevLikeEnv } from "@/config/devAuth";
import type { DeviceScope } from "./interim-event";

export const DEFAULT_DEVICE_SCOPES: readonly DeviceScope[] = [
  "post",
  "edit",
  "delete",
  "react",
];

const CANONICAL_SCOPE_ORDER: readonly DeviceScope[] = [
  ...DEFAULT_DEVICE_SCOPES,
  "vote",
];
const SIWE_HEADER_SUFFIX = " wants you to sign in with your Ethereum account:";
const RESOURCES_LINE = "Resources:";
const URN_PATTERN =
  /^urn:6529:device-grant:v1:ed25519:([0-9a-f]{64}):([a-z.]+):(\d+)$/;
/** The server grants 180 days; allow a day of clock skew. */
const MAX_GRANT_TTL_MS = 181 * 24 * 60 * 60 * 1000;

interface DeviceGrantTerms {
  /** 0x-prefixed lowercase hex of the raw Ed25519 public key. */
  readonly deviceKeyHex: string;
  readonly scopes: readonly string[];
  readonly expiresAtSeconds: number;
}

interface ParsedDeviceGrantMessage extends DeviceGrantTerms {
  readonly address: string;
  /** The SIWE domain (host) the wallet was shown. */
  readonly domain: string;
  /** The SIWE Chain ID line. */
  readonly chainId: number;
}

const CHAIN_ID_PREFIX = "Chain ID: ";

/**
 * The only hosts that serve the 6529 app. Other 6529.io subdomains, such as
 * the IPFS and media gateways, serve user-published pages, so a grant signed
 * there could have been phished and never counts.
 */
const APP_GRANT_DOMAINS: ReadonlySet<string> = new Set([
  "6529.io",
  "staging.6529.io",
]);
const LOCAL_GRANT_HOSTNAMES: ReadonlySet<string> = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
]);

/**
 * The host a SIWE domain names, or null unless it is exactly one bare host
 * (no scheme, path, query, fragment, user info, whitespace or empty label),
 * so a value such as "evil.example/x.6529.io" can never pass for a 6529 host.
 */
function toExactHost(domain: string): URL | null {
  const value = domain.toLowerCase();
  if (value.split(".").includes("")) {
    return null;
  }
  try {
    const url = new URL(`https://${value}`);
    return url.host === value ? url : null;
  } catch {
    return null;
  }
}

/**
 * Whether a wallet signing a grant for this SIWE domain was on the 6529 app:
 * exactly 6529.io or staging.6529.io, without a port. Development and test
 * runtimes also accept local hosts (any port); a production build never does.
 */
export function isAllowedGrantDomain(domain: string): boolean {
  const url = toExactHost(domain);
  if (url === null) {
    return false;
  }
  if (APP_GRANT_DOMAINS.has(url.host)) {
    return true;
  }
  return (
    isDevLikeEnv() &&
    (LOCAL_GRANT_HOSTNAMES.has(url.hostname) ||
      url.hostname.endsWith(".localhost"))
  );
}

/** The host of a SIWE header origin such as "https://6529.io". */
function parseHeaderDomain(origin: string): string | null {
  if (!origin.includes("://")) {
    return origin.length > 0 ? origin.toLowerCase() : null;
  }
  try {
    return new URL(origin).host.toLowerCase() || null;
  } catch {
    return null;
  }
}

function parseChainId(lines: readonly string[]): number | null {
  const line = lines.find((candidate) => candidate.startsWith(CHAIN_ID_PREFIX));
  const value = line ? Number(line.slice(CHAIN_ID_PREFIX.length)) : Number.NaN;
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

const formatEnglishList = (items: readonly string[]): string => {
  if (items.length <= 1) {
    return items.join("");
  }
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1) ?? ""}`;
};

const stripHexPrefix = (hex: string): string =>
  hex.toLowerCase().replace(/^0x/, "");

/** First and last eight hex characters of a device key, e.g. "d75a9801...f707511a". */
export const getDeviceKeyFingerprint = (deviceKeyHex: string): string => {
  const key = stripHexPrefix(deviceKeyHex);
  return `${key.slice(0, 8)}...${key.slice(-8)}`;
};

const formatUtcMinute = (expiresAtSeconds: number): string =>
  new Date(expiresAtSeconds * 1000)
    .toISOString()
    .slice(0, 16)
    .replace("T", " ");

// Fixed English abbreviations, never Intl: the date is part of signed bytes.
const UTC_MONTH_ABBREVIATIONS = [
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
] as const;

/** The grant expiry as a UTC calendar date, e.g. "29 Apr 2027" or "5 Nov 2026". */
export const formatGrantExpiryDate = (expiresAtSeconds: number): string => {
  const date = new Date(expiresAtSeconds * 1000);
  const month = UTC_MONTH_ABBREVIATIONS[date.getUTCMonth()] ?? "";
  return `${date.getUTCDate()} ${month} ${date.getUTCFullYear()}`;
};

/** What the statement says the device will sign for each scope. */
const SCOPE_NOUNS: Readonly<Record<DeviceScope, string>> = {
  post: "posts",
  edit: "edits",
  delete: "deletes",
  react: "reactions",
  vote: "votes",
};

const toScopeNoun = (scope: string): string =>
  Object.hasOwn(SCOPE_NOUNS, scope) ? SCOPE_NOUNS[scope as DeviceScope] : scope;

/**
 * The wallet-signed grant statement the server renders into new challenges.
 * Intentionally not localized: the server renders the same bytes into the
 * Sign-In with Ethereum challenge, the wallet signs them, and both sides
 * compare them byte for byte, so this text is a signed commitment, not UI
 * copy. Changing it needs a coordinated backend and frontend rule change (see
 * the i18n exception in ops/docs/waves/drop-actions/feature-signed-messages.md).
 * The URN alone carries the exact expiry time; the statement names its UTC date.
 */
export function renderDeviceGrantStatement({
  deviceKeyHex,
  scopes,
  expiresAtSeconds,
}: DeviceGrantTerms): string {
  return (
    `Sign in to 6529 and turn on signed messages on this device until ` +
    `${formatGrantExpiryDate(expiresAtSeconds)}. ` +
    `This device will sign your ${formatEnglishList(scopes.map(toScopeNoun))} ` +
    `so anyone can verify they came from your wallet. ` +
    `It can't move funds, change your handle, add devices or act as an admin. ` +
    `No transaction, no gas, no token approvals. ` +
    `(Device key ${getDeviceKeyFingerprint(deviceKeyHex)})`
  );
}

/**
 * The statement of grants issued before the current wording. Wallets signed
 * those grants over these exact bytes, so they must keep parsing for as long
 * as their signatures are shown, and a challenge from a server still on this
 * wording must stay signable. Never render it for anything new.
 */
export function renderLegacyDeviceGrantStatement({
  deviceKeyHex,
  scopes,
  expiresAtSeconds,
}: DeviceGrantTerms): string {
  return (
    `Sign in to 6529 and let this device post as you until ` +
    `${formatUtcMinute(expiresAtSeconds)} UTC ` +
    `(device key ${getDeviceKeyFingerprint(deviceKeyHex)}). ` +
    `It may ${formatEnglishList(scopes)}. ` +
    `It cannot move funds, change your handle, add devices or act as an admin. ` +
    `This request does not create a blockchain transaction, cost gas, or approve tokens.`
  );
}

/** Exactly the current or the legacy statement rendered from these terms. */
const isDeviceGrantStatement = (
  statement: string,
  terms: DeviceGrantTerms
): boolean =>
  statement === renderDeviceGrantStatement(terms) ||
  statement === renderLegacyDeviceGrantStatement(terms);

export function buildDeviceGrantUrn({
  deviceKeyHex,
  scopes,
  expiresAtSeconds,
}: DeviceGrantTerms): string {
  return `urn:6529:device-grant:v1:ed25519:${stripHexPrefix(
    deviceKeyHex
  )}:${scopes.join(".")}:${expiresAtSeconds}`;
}

const areCanonicalScopes = (scopes: readonly string[]): boolean => {
  let previousIndex = -1;
  for (const scope of scopes) {
    const index = CANONICAL_SCOPE_ORDER.indexOf(scope as DeviceScope);
    if (index <= previousIndex) {
      return false;
    }
    previousIndex = index;
  }
  return scopes.includes("post");
};

const getResourceLines = (lines: readonly string[]): string[] | null => {
  const resourcesIndex = lines.indexOf(RESOURCES_LINE);
  if (
    resourcesIndex < 0 ||
    lines.lastIndexOf(RESOURCES_LINE) !== resourcesIndex
  ) {
    return null;
  }
  const resources = lines.slice(resourcesIndex + 1);
  while (resources.at(-1) === "") {
    resources.pop();
  }
  return resources;
};

const parseGrantResource = (
  resources: readonly string[]
): DeviceGrantTerms | null => {
  const [resource] = resources;
  if (resources.length !== 1 || !resource?.startsWith("- ")) {
    return null;
  }
  const match = URN_PATTERN.exec(resource.slice(2));
  if (!match) {
    return null;
  }
  const [, keyHex = "", scopeList = "", expiresAt = ""] = match;
  const scopes = scopeList.split(".");
  if (!areCanonicalScopes(scopes)) {
    return null;
  }
  return {
    deviceKeyHex: `0x${keyHex}`,
    scopes,
    expiresAtSeconds: Number(expiresAt),
  };
};

/**
 * Parses an ERC-4361 message that carries exactly one device-grant resource
 * and whose statement is exactly the current or the legacy statement rendered
 * from that resource.
 */
export function parseDeviceGrantMessage(
  message: string
): ParsedDeviceGrantMessage | null {
  const lines = message.split("\n");
  const [header, address, beforeStatement, statement, afterStatement] = lines;
  if (
    !header?.endsWith(SIWE_HEADER_SUFFIX) ||
    !address ||
    beforeStatement !== "" ||
    afterStatement !== ""
  ) {
    return null;
  }
  const domain = parseHeaderDomain(header.slice(0, -SIWE_HEADER_SUFFIX.length));
  const chainId = parseChainId(lines);
  const resources = getResourceLines(lines);
  const terms = resources ? parseGrantResource(resources) : null;
  if (
    !terms ||
    domain === null ||
    chainId === null ||
    statement === undefined ||
    !isDeviceGrantStatement(statement, terms)
  ) {
    return null;
  }
  return { ...terms, address, domain, chainId };
}

/**
 * Checks the server's sign-in challenge before the wallet is asked to sign
 * it: a 6529 app domain, the right wallet, this device's key, the requested
 * scopes and a sane expiry.
 */
export function isExpectedDeviceGrantMessage({
  message,
  signerAddress,
  deviceKeyHex,
  scopes,
  nowMs,
}: {
  readonly message: string;
  readonly signerAddress: string;
  readonly deviceKeyHex: string;
  readonly scopes: readonly string[];
  readonly nowMs: number;
}): boolean {
  const parsed = parseDeviceGrantMessage(message);
  if (!parsed) {
    return false;
  }
  const expiresAtMs = parsed.expiresAtSeconds * 1000;
  return (
    // Never sign a grant that readers' browsers would reject.
    isAllowedGrantDomain(parsed.domain) &&
    parsed.address.toLowerCase() === signerAddress.toLowerCase() &&
    parsed.deviceKeyHex === deviceKeyHex.toLowerCase() &&
    parsed.scopes.join(",") === scopes.join(",") &&
    expiresAtMs > nowMs &&
    expiresAtMs <= nowMs + MAX_GRANT_TTL_MS
  );
}
