import { getNodeEnv, publicEnv } from "@/config/env";
import { isAddress } from "viem";

/**
 * Local multi-user test seam for dev auth (USE_DEV_AUTH). Browser tests that
 * drive several users against one local dev server give each browser context
 * its own dev wallet and synthetic JWT through these localStorage keys.
 *
 * The seam is inert unless every condition holds: USE_DEV_AUTH is "true" (it
 * is never set in production builds), NODE_ENV is development-like, and the
 * page runs on localhost or 127.0.0.1. Anywhere else the keys are ignored.
 */
export const DEV_AUTH_TEST_OVERRIDE_KEYS = {
  wallet: "6529-dev-auth-test-wallet",
  jwt: "6529-dev-auth-test-jwt",
} as const;

const LOCAL_TEST_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);
const DEV_LIKE_NODE_ENVS = new Set(["development", "test", "local"]);

interface DevAuthTestOverride {
  readonly wallet: string;
  readonly jwt: string;
}

const browserWindow = (): Window | null =>
  typeof window === "undefined" ? null : window;

/** True only for dev auth in a development-like build on a local host. */
export function isLocalDevAuthTestSeamEnabled(): boolean {
  if (publicEnv.USE_DEV_AUTH !== "true") {
    return false;
  }
  if (!DEV_LIKE_NODE_ENVS.has(getNodeEnv() ?? "")) {
    return false;
  }
  try {
    const hostname = browserWindow()?.location.hostname;
    return typeof hostname === "string" && LOCAL_TEST_HOSTNAMES.has(hostname);
  } catch {
    return false;
  }
}

const readItem = (key: string): string | null => {
  try {
    const value = browserWindow()?.localStorage.getItem(key);
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : null;
  } catch {
    return null;
  }
};

/** The per-browser dev wallet and JWT, when the seam is enabled and both are set. */
export function getDevAuthTestOverride(): DevAuthTestOverride | null {
  if (!isLocalDevAuthTestSeamEnabled()) {
    return null;
  }
  const wallet = readItem(DEV_AUTH_TEST_OVERRIDE_KEYS.wallet);
  const jwt = readItem(DEV_AUTH_TEST_OVERRIDE_KEYS.jwt);
  if (!wallet || !jwt || !isAddress(wallet, { strict: false })) {
    return null;
  }
  return { wallet, jwt };
}
