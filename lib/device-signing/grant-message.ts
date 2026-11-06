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
// Same expiry grammar as the backend parser (no leading zeros, at most 16
// digits), so both sides accept exactly the same grant messages.
const URN_PATTERN =
  /^urn:6529:device-grant:v1:ed25519:([0-9a-f]{64}):([a-z.]+):([1-9]\d{0,15})$/;
const MLS_URN_PATTERN =
  /^urn:6529:mls-device-grant:v1:([1-9]\d{0,4}):([0-9a-f]{64}):([1-9]\d{0,15})$/;
const MAX_MLS_CIPHERSUITE = 0xffff;
/** The server grants 180 days; allow a day of clock skew. */
const MAX_GRANT_TTL_MS = 181 * 24 * 60 * 60 * 1000;

interface DeviceGrantTerms {
  /** 0x-prefixed lowercase hex of the raw Ed25519 public key. */
  readonly deviceKeyHex: string;
  readonly scopes: readonly string[];
  readonly expiresAtSeconds: number;
}

/**
 * The second resource of a combined sign-in grant (NC8): this device's MLS
 * signature key for end-to-end encrypted messages, with the same expiry.
 */
interface MlsDeviceGrantTerms {
  /** 0x-prefixed lowercase hex of the raw MLS Ed25519 signature key. */
  readonly deviceKeyHex: string;
  /** The MLS ciphersuite (uint16) the key is granted for. */
  readonly ciphersuite: number;
  readonly expiresAtSeconds: number;
}

interface ParsedDeviceGrantMessage extends DeviceGrantTerms {
  readonly address: string;
  /** The SIWE domain (host) the wallet was shown. */
  readonly domain: string;
  /** The SIWE Chain ID line. */
  readonly chainId: number;
  /** Present only for a combined grant that also grants an MLS device key. */
  readonly mls?: MlsDeviceGrantTerms;
}

const CHAIN_ID_PREFIX = "Chain ID: ";
const ISSUED_AT_PREFIX = "Issued At: ";

/** The SIWE Issued At line in unix seconds, or null when absent or invalid. */
export function parseSiweIssuedAtSeconds(message: string): number | null {
  const line = message
    .split("\n")
    .find((candidate) => candidate.startsWith(ISSUED_AT_PREFIX));
  const ms = line
    ? Date.parse(line.slice(ISSUED_AT_PREFIX.length))
    : Number.NaN;
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
}

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

/** What the device will sign, e.g. "posts, edits, deletes and reactions". */
export const describeDeviceScopes = (scopes: readonly string[]): string =>
  formatEnglishList(scopes.map(toScopeNoun));

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
    `This device will sign your ${describeDeviceScopes(scopes)} ` +
    `so anyone can verify they came from your wallet. ` +
    `It can't move funds, change your handle, add devices or act as an admin. ` +
    `No transaction, no gas, no token approvals. ` +
    `(Device key ${getDeviceKeyFingerprint(deviceKeyHex)})`
  );
}

type CombinedStatementRenderer = (
  signing: DeviceGrantTerms,
  mls: MlsDeviceGrantTerms
) => string;

/**
 * v1 combined wording (owner-approved 2026-10-31): the approved
 * signed-messages statement plus one sentence for encrypted messages and the
 * second key.
 */
const renderCombinedGrantStatementV1: CombinedStatementRenderer = (
  signing,
  mls
) =>
  `Sign in to 6529 and turn on signed messages on this device until ` +
  `${formatGrantExpiryDate(signing.expiresAtSeconds)}. ` +
  `This device will sign your ${describeDeviceScopes(signing.scopes)} ` +
  `so anyone can verify they came from your wallet. ` +
  `It will also encrypt (send) and decrypt (read) your end-to-end encrypted ` +
  `messages, which 6529.io cannot read. ` +
  `It can't move funds, change your handle, add devices or act as an admin. ` +
  `No transaction, no gas, no token approvals. ` +
  `(Device key ${getDeviceKeyFingerprint(signing.deviceKeyHex)}, ` +
  `encrypted messages key ${getDeviceKeyFingerprint(mls.deviceKeyHex)})`;

/**
 * Combined (signing + encrypted messages) statements, newest first. The
 * backend renders the first into new challenges; every entry keeps parsing,
 * so grants signed under an earlier wording stay valid. Not localized, for
 * the same reason as renderDeviceGrantStatement. To change the wording: add
 * a renderer at the front here and in the backend's combined-device-grant.ts
 * (same shared vector), and ship this frontend first.
 */
const COMBINED_GRANT_STATEMENTS: readonly CombinedStatementRenderer[] = [
  renderCombinedGrantStatementV1,
];

/** The combined statement the backend renders into new combined challenges. */
export const renderCombinedGrantStatement = (
  signing: DeviceGrantTerms,
  mls: MlsDeviceGrantTerms
): string => renderCombinedGrantStatementV1(signing, mls);

const isCombinedGrantStatement = (
  statement: string,
  signing: DeviceGrantTerms,
  mls: MlsDeviceGrantTerms
): boolean =>
  COMBINED_GRANT_STATEMENTS.some(
    (render) => render(signing, mls) === statement
  );

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

/** Canonical order, no duplicates, includes "post". */
export const areCanonicalDeviceScopes = (
  scopes: readonly string[]
): boolean => {
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

export function buildMlsDeviceGrantUrn({
  deviceKeyHex,
  ciphersuite,
  expiresAtSeconds,
}: MlsDeviceGrantTerms): string {
  return `urn:6529:mls-device-grant:v1:${ciphersuite}:${stripHexPrefix(
    deviceKeyHex
  )}:${expiresAtSeconds}`;
}

const parseMlsResource = (resource: string): MlsDeviceGrantTerms | null => {
  const match = resource.startsWith("- ")
    ? MLS_URN_PATTERN.exec(resource.slice(2))
    : null;
  if (!match) {
    return null;
  }
  const [, ciphersuiteRaw = "", keyHex = "", expiresAt = ""] = match;
  const ciphersuite = Number(ciphersuiteRaw);
  const expiresAtSeconds = Number(expiresAt);
  if (
    ciphersuite > MAX_MLS_CIPHERSUITE ||
    !Number.isSafeInteger(expiresAtSeconds) ||
    expiresAtSeconds % 60 !== 0
  ) {
    return null;
  }
  return { deviceKeyHex: `0x${keyHex}`, ciphersuite, expiresAtSeconds };
};

/** One expiry and two different keys (revoking one never covers the other). */
const isCombinedPair = (
  signing: DeviceGrantTerms,
  mls: MlsDeviceGrantTerms
): boolean =>
  mls.expiresAtSeconds === signing.expiresAtSeconds &&
  mls.deviceKeyHex !== signing.deviceKeyHex;

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
  resource: string | undefined
): DeviceGrantTerms | null => {
  if (!resource?.startsWith("- ")) {
    return null;
  }
  const match = URN_PATTERN.exec(resource.slice(2));
  if (!match) {
    return null;
  }
  const [, keyHex = "", scopeList = "", expiresAt = ""] = match;
  const scopes = scopeList.split(".");
  if (!areCanonicalDeviceScopes(scopes)) {
    return null;
  }
  return {
    deviceKeyHex: `0x${keyHex}`,
    scopes,
    expiresAtSeconds: Number(expiresAt),
  };
};

type GrantResources =
  | { readonly signing: DeviceGrantTerms; readonly mls: null }
  | { readonly signing: DeviceGrantTerms; readonly mls: MlsDeviceGrantTerms };

/**
 * Exactly one device-grant resource, or that resource followed by exactly one
 * MLS device-grant resource (a combined grant), and a statement rendered from
 * them: the current or legacy signing statement, or a combined statement.
 */
const parseGrantResources = (
  resources: readonly string[],
  statement: string
): GrantResources | null => {
  if (resources.length < 1 || resources.length > 2) {
    return null;
  }
  const signing = parseGrantResource(resources[0]);
  if (!signing) {
    return null;
  }
  if (resources.length === 1) {
    return isDeviceGrantStatement(statement, signing)
      ? { signing, mls: null }
      : null;
  }
  const mls = parseMlsResource(resources[1] ?? "");
  return mls &&
    isCombinedPair(signing, mls) &&
    isCombinedGrantStatement(statement, signing, mls)
    ? { signing, mls }
    : null;
};

/**
 * Parses an ERC-4361 message that carries exactly one device-grant resource
 * whose statement is the current or legacy statement rendered from it, or a
 * combined grant (that resource plus one MLS device-grant resource with the
 * same expiry) whose statement is a combined statement rendered from both.
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
  const grants =
    resources && statement !== undefined
      ? parseGrantResources(resources, statement)
      : null;
  if (!grants || domain === null || chainId === null) {
    return null;
  }
  return {
    ...grants.signing,
    address,
    domain,
    chainId,
    ...(grants.mls ? { mls: grants.mls } : {}),
  };
}

/** The MLS key a combined challenge must grant, and nothing else. */
const isExpectedMls = (
  parsed: MlsDeviceGrantTerms | undefined,
  expected: Omit<MlsDeviceGrantTerms, "expiresAtSeconds"> | null
): boolean =>
  expected === null
    ? parsed === undefined
    : parsed?.deviceKeyHex === expected.deviceKeyHex.toLowerCase() &&
      parsed.ciphersuite === expected.ciphersuite;

/**
 * Checks the server's sign-in challenge before the wallet is asked to sign
 * it: a 6529 app domain, the right wallet, this device's key, the requested
 * scopes and a sane expiry. With `mls`, the challenge must be a combined grant
 * of exactly that MLS key; without it, it must grant no MLS key at all, so the
 * wallet never grants a key this device does not hold.
 */
export function isExpectedDeviceGrantMessage({
  message,
  signerAddress,
  deviceKeyHex,
  scopes,
  nowMs,
  mls = null,
}: {
  readonly message: string;
  readonly signerAddress: string;
  readonly deviceKeyHex: string;
  readonly scopes: readonly string[];
  readonly nowMs: number;
  readonly mls?: Omit<MlsDeviceGrantTerms, "expiresAtSeconds"> | null;
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
    isExpectedMls(parsed.mls, mls) &&
    expiresAtMs > nowMs &&
    expiresAtMs <= nowMs + MAX_GRANT_TTL_MS
  );
}
