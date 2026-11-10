import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

import { getValidatorPageServerEnv } from "@/config/serverEnv";
import { VALIDATOR_AUTHORIZE_PATH } from "./authorize/paths";

export const VALIDATOR_ACCESS_COOKIE = "validator_access";
export const VALIDATOR_BASE_PATH = "/validator";
/** Internal page the gate shows in place of anything locked. */
export const VALIDATOR_LOCKED_PATH = "/validator/locked";
/** Where the password form posts. */
export const VALIDATOR_UNLOCK_PATH = "/validator/unlock";
/** Request header that tells the locked page which path was asked for. */
export const VALIDATOR_NEXT_PATH_HEADER = "x-6529-validator-next";
/**
 * The signed release feed. Validators fetch it to find updates and cannot
 * pass the password, so it stays public. It holds versions, hashes and notes.
 * The authorize page is public too: a validator's QR code opens it on a
 * phone that has never seen the password.
 */
export const VALIDATOR_PUBLIC_PATHS: ReadonlySet<string> = new Set([
  "/validator/releases.json",
  "/validator/releases.json.sig",
  VALIDATOR_AUTHORIZE_PATH,
]);

const ACCESS_TTL_SECONDS = 30 * 24 * 60 * 60;
const COOKIE_VERSION = "v1";
const COOKIE_KEY_SALT = "6529.io validator page access cookie v1";

const PERCENT_ESCAPE = /%([0-9A-Fa-f]{2})/g;

/**
 * The path as the server resolves it: percent-decoded once, with repeated
 * slashes as one. A path whose encoding is malformed keeps its other
 * escapes decoded byte by byte, so a bad escape later in the path cannot
 * hide the prefix.
 */
function normalizePathname(pathname: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    decoded = pathname.replaceAll(PERCENT_ESCAPE, (_escape, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    );
  }
  return decoded.replaceAll(/\/{2,}/g, "/");
}

/**
 * True for `/validator` and everything under it, however the path is
 * spelled: Next.js serves `public/validator/` for `/%76alidator/...` too.
 */
export function isValidatorPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return (
    normalized === VALIDATOR_BASE_PATH ||
    normalized.startsWith(`${VALIDATOR_BASE_PATH}/`)
  );
}

type ValidatorGate =
  | { readonly open: true }
  | {
      readonly open: false;
      /** Null when none is configured: then nothing unlocks the pages. */
      readonly password: string | null;
    };

/**
 * Whether the pages are open to everyone. Only `VALIDATOR_PAGE_PUBLIC=true`
 * opens them; without it they stay locked, with no way in when no password
 * is configured, so a missing secret never opens them.
 */
function getValidatorGate(): ValidatorGate {
  const env = getValidatorPageServerEnv();
  if (env.isPublic) {
    return { open: true };
  }
  return { open: false, password: env.password ?? null };
}

/**
 * The password the form accepts, or null when it accepts none: the pages
 * are public (`VALIDATOR_PAGE_PUBLIC=true`) or no password is configured.
 * Null does not mean open; see `hasValidatorAccess`.
 */
export function getValidatorGatePassword(): string | null {
  const gate = getValidatorGate();
  return gate.open ? null : gate.password;
}

// One entry: the key for the password in use.
const cookieKeys = new Map<string, Buffer>();

// The cookie's MAC key comes from the password through scrypt, so a copied
// cookie is slow to turn back into the password. A new password makes every
// earlier cookie invalid.
function getCookieKey(password: string): Buffer {
  const known = cookieKeys.get(password);
  if (known) {
    return known;
  }
  const key = scryptSync(password, COOKIE_KEY_SALT, 32, {
    N: 16_384,
    r: 8,
    p: 1,
  });
  cookieKeys.clear();
  cookieKeys.set(password, key);
  return key;
}

function signExpiry(password: string, expiresAt: number): string {
  return createHmac("sha256", getCookieKey(password))
    .update(`${COOKIE_VERSION}.${expiresAt}`)
    .digest("base64url");
}

function nowSeconds(nowMs: number): number {
  return Math.floor(nowMs / 1000);
}

/** A cookie value good for 30 days from `nowMs`. */
export function createAccessCookieValue(
  password: string,
  nowMs: number = Date.now()
): string {
  const expiresAt = nowSeconds(nowMs) + ACCESS_TTL_SECONDS;
  return `${COOKIE_VERSION}.${expiresAt}.${signExpiry(password, expiresAt)}`;
}

export function isAccessCookieValid(
  value: string | undefined,
  password: string,
  nowMs: number = Date.now()
): boolean {
  if (!value || value.length > 200) {
    return false;
  }
  const [version, expiry, signature, ...rest] = value.split(".");
  if (version !== COOKIE_VERSION || !expiry || !signature || rest.length > 0) {
    return false;
  }
  if (!/^\d{1,12}$/.test(expiry)) {
    return false;
  }
  const expiresAt = Number(expiry);
  const now = nowSeconds(nowMs);
  if (expiresAt <= now || expiresAt > now + ACCESS_TTL_SECONDS + 60) {
    return false;
  }
  const expected = Buffer.from(signExpiry(password, expiresAt));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

const MAX_PASSWORD_BYTES = 256;

function padded(value: string): Buffer | null {
  const bytes = Buffer.from(value, "utf8");
  if (bytes.length > MAX_PASSWORD_BYTES) {
    return null;
  }
  const buffer = Buffer.alloc(MAX_PASSWORD_BYTES + 1);
  bytes.copy(buffer);
  // The last byte holds the length, so "a" and "a\0" differ.
  buffer.writeUInt8(bytes.length % 256, MAX_PASSWORD_BYTES);
  return buffer;
}

/**
 * Compares in constant time over a fixed-size buffer, so the answer's timing
 * gives nothing away about how much of the password matched.
 */
export function isPasswordCorrect(input: string, password: string): boolean {
  const given = padded(input);
  const expected = padded(password);
  return (
    given !== null && expected !== null && timingSafeEqual(given, expected)
  );
}

/**
 * True when the pages are public, or the cookie is valid for the configured
 * password. With neither the public flag nor a password, nothing is.
 */
export function hasValidatorAccess(cookieValue: string | undefined): boolean {
  const gate = getValidatorGate();
  if (gate.open) {
    return true;
  }
  return (
    gate.password !== null && isAccessCookieValid(cookieValue, gate.password)
  );
}

export const VALIDATOR_ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: VALIDATOR_BASE_PATH,
  maxAge: ACCESS_TTL_SECONDS,
} as const;

const NEXT_PATH_CHARACTERS = /^[A-Za-z0-9._~+/-]+$/;

function isSafeNextPath(value: string): boolean {
  if (value === VALIDATOR_BASE_PATH) {
    return true;
  }
  return (
    value.startsWith(`${VALIDATOR_BASE_PATH}/`) &&
    NEXT_PATH_CHARACTERS.test(value) &&
    !value.includes("//") &&
    !value.endsWith("/")
  );
}

/**
 * Where to send the visitor after the password: a path under /validator,
 * never another site or the form itself.
 */
export function sanitizeValidatorNextPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 300 ||
    !isSafeNextPath(value) ||
    value.includes("..") ||
    value === VALIDATOR_LOCKED_PATH ||
    value === VALIDATOR_UNLOCK_PATH ||
    VALIDATOR_PUBLIC_PATHS.has(value)
  ) {
    return VALIDATOR_BASE_PATH;
  }
  return value;
}
