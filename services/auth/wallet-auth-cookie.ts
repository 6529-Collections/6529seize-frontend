import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

// The `__Host-` prefix makes browsers accept this cookie only when it is
// Secure, scoped to Path=/ and set without a Domain, so only this exact host
// can write it.
export const WALLET_AUTH_COOKIE = "__Host-wallet-auth";
// The cookie name used before the prefix. It is only ever removed, never read.
const LEGACY_WALLET_AUTH_COOKIE = "wallet-auth";

const COOKIE_OPTIONS = {
  secure: true,
  sameSite: "strict" as const,
  path: "/",
};

// `getAuthJwt()` runs often, so remember the last subject check: a token's
// subject never changes, so the answer only depends on the token and address.
let lastSubjectCheck: {
  readonly jwt: string;
  readonly address: string;
  readonly matches: boolean;
} | null = null;

const isJwtForAddress = (jwt: string, address: string): boolean => {
  const normalizedAddress = address.toLowerCase();
  if (
    lastSubjectCheck?.jwt === jwt &&
    lastSubjectCheck.address === normalizedAddress
  ) {
    return lastSubjectCheck.matches;
  }

  let matches = false;
  try {
    const { sub } = jwtDecode<{ sub?: unknown }>(jwt);
    matches =
      typeof sub === "string" && sub.toLowerCase() === normalizedAddress;
  } catch {
    matches = false;
  }
  lastSubjectCheck = { jwt, address: normalizedAddress, matches };
  return matches;
};

const getCookieExpiresInDays = (jwt: string): number | null => {
  try {
    const { exp } = jwtDecode<{ exp: number }>(jwt);
    const expiresInSeconds = exp - Math.floor(Date.now() / 1000);
    return expiresInSeconds > 0 ? expiresInSeconds / 86400 : null;
  } catch {
    return null;
  }
};

/** The value the session cookie holds now, whoever it was issued for. */
export const readWalletAuthCookie = (): string | null =>
  Cookies.get(WALLET_AUTH_COOKIE) ?? null;

/** The session cookie's token, only when it was issued for `address`. */
export const getWalletAuthCookieFor = (address: string): string | null => {
  const jwt = readWalletAuthCookie();
  return jwt && isJwtForAddress(jwt, address) ? jwt : null;
};

/**
 * Writes the session cookie the server reads, or removes it when the token is
 * missing, unreadable or expired, and always removes the cookie name used
 * before the prefix. Returns the value the cookie now holds.
 */
export const writeWalletAuthCookie = (jwt: string | null): string | null => {
  Cookies.remove(LEGACY_WALLET_AUTH_COOKIE, COOKIE_OPTIONS);

  const expiresInDays = jwt ? getCookieExpiresInDays(jwt) : null;
  if (!jwt || expiresInDays === null) {
    Cookies.remove(WALLET_AUTH_COOKIE, COOKIE_OPTIONS);
    return null;
  }

  Cookies.set(WALLET_AUTH_COOKIE, jwt, {
    ...COOKIE_OPTIONS,
    expires: expiresInDays,
  });
  return jwt;
};
