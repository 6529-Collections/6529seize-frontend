import { jwtDecode } from "jwt-decode";
import { getBrowserLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { AUTH_STORAGE_KEYS, getAuthJwt } from "./auth.utils";

/**
 * All tabs share one stored session. When another tab switches profile or
 * signs one out, this tab keeps showing the previous profile until it
 * follows the change, while the shared session already belongs to another
 * wallet. Writes sent with that session are refused instead of being made
 * as a profile this tab does not show.
 *
 * The auth provider reports the wallet whose signed-in profile this tab
 * shows. Without a report (server rendering, tests without the provider, a
 * tab showing no signed-in profile) nothing is checked.
 */
let displayedWallet: string | null = null;

/** Records the wallet this tab shows as signed in; returns the reset. */
export function showSignedInWallet(
  address: string | null | undefined
): () => void {
  const shown = address ? address.toLowerCase() : null;
  displayedWallet = shown;
  return () => {
    if (displayedWallet === shown) {
      displayedWallet = null;
    }
  };
}

export class DisplayedProfileChangedError extends Error {
  constructor() {
    super(t(getBrowserLocale(), "auth.displayedProfileChanged"));
    this.name = "DisplayedProfileChangedError";
  }
}

const READ_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"]);
const AUTH_ENDPOINT_PATTERN = /\/api\/auth\//;

const getTokenWallet = (token: string): string | null => {
  try {
    const { sub } = jwtDecode<{ sub?: unknown }>(token);
    return typeof sub === "string" ? sub.toLowerCase() : null;
  } catch {
    return null;
  }
};

/** Lets this tab adopt the stored selection through its storage listeners. */
const followStoredProfile = (): void => {
  if (
    typeof StorageEvent !== "function" ||
    typeof globalThis.dispatchEvent !== "function"
  ) {
    return;
  }
  setTimeout(() => {
    globalThis.dispatchEvent(
      new StorageEvent("storage", { key: AUTH_STORAGE_KEYS.activeAddress })
    );
  }, 0);
};

/**
 * Throws `DisplayedProfileChangedError`, without sending anything, when a
 * write would carry the stored session of a wallet other than the one this
 * tab shows. Only the session the API helpers attach is checked: reads,
 * sign-in endpoints and requests that bring their own credential are sent
 * as before.
 */
export function assertWriteMatchesDisplayedWallet(request: {
  readonly url: string;
  readonly method: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly usesStoredSession: boolean;
}): void {
  const shown = displayedWallet;
  if (
    shown === null ||
    !request.usesStoredSession ||
    READ_METHODS.has(request.method.toUpperCase()) ||
    AUTH_ENDPOINT_PATTERN.test(request.url)
  ) {
    return;
  }
  const token = getAuthJwt();
  if (!token || request.headers["Authorization"] !== `Bearer ${token}`) {
    return;
  }
  const tokenWallet = getTokenWallet(token);
  if (tokenWallet === null || tokenWallet === shown) {
    return;
  }
  followStoredProfile();
  throw new DisplayedProfileChangedError();
}
