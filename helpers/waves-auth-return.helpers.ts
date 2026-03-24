import { safeSessionStorage } from "@/helpers/safeSessionStorage";

const WAVES_AUTH_RETURN_URL_KEY = "6529-waves-auth-return-url";
const URL_PARSE_BASE = "https://6529.io";

function isWavesPathname(pathname: string): boolean {
  return pathname === "/waves" || pathname.startsWith("/waves/");
}

function normalizeWavesAuthReturnUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value, URL_PARSE_BASE);
    if (!isWavesPathname(parsed.pathname)) {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function getCurrentBrowserRelativeUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function getPendingWavesAuthReturnUrl(): string | null {
  return normalizeWavesAuthReturnUrl(
    safeSessionStorage.getItem(WAVES_AUTH_RETURN_URL_KEY)
  );
}

export function clearPendingWavesAuthReturnUrl(): void {
  safeSessionStorage.removeItem(WAVES_AUTH_RETURN_URL_KEY);
}

export function preparePendingWavesAuthReturnUrlForCurrentLocation(): void {
  const currentRelativeUrl = getCurrentBrowserRelativeUrl();
  const normalizedReturnUrl = normalizeWavesAuthReturnUrl(currentRelativeUrl);

  if (!normalizedReturnUrl) {
    clearPendingWavesAuthReturnUrl();
    return;
  }

  safeSessionStorage.setItem(WAVES_AUTH_RETURN_URL_KEY, normalizedReturnUrl);
}
