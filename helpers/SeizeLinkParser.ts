import { publicEnv } from "@/config/env";

let cachedBaseEndpoint: string | undefined;
let cachedBaseUrl: URL | null | undefined;

const getBaseUrl = (): URL | null => {
  const current = publicEnv.BASE_ENDPOINT;

  if (!current) {
    cachedBaseEndpoint = undefined;
    cachedBaseUrl = null;
    return null;
  }

  if (cachedBaseEndpoint === current && cachedBaseUrl !== undefined) {
    return cachedBaseUrl;
  }

  cachedBaseEndpoint = current;
  try {
    cachedBaseUrl = new URL(current);
  } catch {
    cachedBaseUrl = null;
  }

  return cachedBaseUrl;
};

export const getSeizeBaseOrigin = (): string | null => {
  const baseUrl = getBaseUrl();
  return baseUrl ? baseUrl.origin : null;
};

export interface SeizeQuoteLinkInfo {
  waveId: string;
  serialNo?: string | undefined;
  dropId?: string | undefined;
}

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const DIGITS_REGEX = /^\d+$/;
const WAVE_CREATE_SEGMENT = "create";

const sanitizeQueryValue = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  let end = trimmed.length;
  while (end > 0 && trimmed[end - 1] === "/") {
    end -= 1;
  }
  const sanitized = end === trimmed.length ? trimmed : trimmed.slice(0, end);
  return sanitized.length > 0 ? sanitized : null;
};

const sanitizePathSegmentValue = (value: string): string | null => {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }

  const trimmed = decoded.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const trimTrailingSlashes = (value: string): string => {
  if (value === "/") {
    return value;
  }

  let end = value.length;
  while (end > 1 && value[end - 1] === "/") {
    end -= 1;
  }

  return end === value.length ? value : value.slice(0, end);
};

const getWaveIdFromWavesUrl = (
  url: URL
): { waveId: string | null; isLegacyPath: boolean } => {
  const normalizedPathname = trimTrailingSlashes(url.pathname);

  if (normalizedPathname === "/waves") {
    return {
      waveId: sanitizeQueryValue(url.searchParams.get("wave")),
      isLegacyPath: true,
    };
  }

  if (!normalizedPathname.startsWith("/waves/")) {
    return { waveId: null, isLegacyPath: false };
  }

  const segments = normalizedPathname.split("/").filter(Boolean);
  if (segments.length !== 2) {
    return { waveId: null, isLegacyPath: false };
  }

  const [, rawWaveId] = segments;
  if (!rawWaveId || rawWaveId === WAVE_CREATE_SEGMENT) {
    return { waveId: null, isLegacyPath: false };
  }

  return {
    waveId: sanitizePathSegmentValue(rawWaveId),
    isLegacyPath: false,
  };
};

const hasExactQueryKeys = (url: URL, expectedKeys: string[]): boolean => {
  const actualKeys = Array.from(url.searchParams.keys());
  if (actualKeys.length !== expectedKeys.length) {
    return false;
  }

  const expectedSet = new Set(expectedKeys);
  return actualKeys.every((key) => expectedSet.has(key));
};

export function parseSeizeQuoteLink(href: string): SeizeQuoteLinkInfo | null {
  const configuredBaseOrigin = getSeizeBaseOrigin();
  if (!configuredBaseOrigin) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(href, configuredBaseOrigin);
  } catch {
    return null;
  }

  if (url.origin !== configuredBaseOrigin) {
    return null;
  }

  // If the URL has a drop parameter, it should be handled by the drop handler
  // instead of the quote handler to prevent recursion when ensureStableSeizeLink
  // combines the current page's serialNo with a drop preview link
  if (url.searchParams.has("drop")) {
    return null;
  }

  const { waveId } = getWaveIdFromWavesUrl(url);

  if (!waveId || !UUID_REGEX.test(waveId)) {
    return null;
  }

  const serialNo = sanitizeQueryValue(url.searchParams.get("serialNo"));

  const result: SeizeQuoteLinkInfo = { waveId };

  if (serialNo) {
    if (!DIGITS_REGEX.test(serialNo)) {
      return null;
    }

    result.serialNo = serialNo;
  } else {
    return null;
  }

  return result;
}

export function parseSeizeWaveLink(href: string): string | null {
  const configuredBaseOrigin = getSeizeBaseOrigin();
  if (!configuredBaseOrigin) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(href, configuredBaseOrigin);
  } catch {
    return null;
  }

  if (url.origin !== configuredBaseOrigin) {
    return null;
  }

  const { waveId, isLegacyPath } = getWaveIdFromWavesUrl(url);
  if (!waveId) {
    return null;
  }

  if (isLegacyPath) {
    if (!hasExactQueryKeys(url, ["wave"])) {
      return null;
    }
    return waveId;
  }

  if (Array.from(url.searchParams.keys()).length > 0) {
    return null;
  }

  return waveId;
}

export function parseSeizeQueryLink(
  href: string,
  path: string,
  query: string[],
  exact: boolean = false
): Record<string, string> | null {
  try {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      return null;
    }

    let url: URL;
    try {
      url = new URL(href);
    } catch {
      url = new URL(href, baseUrl.origin);
    }

    if (url.origin !== baseUrl.origin) return null;
    if (url.pathname !== path) return null;

    if (exact) {
      const actualKeys = Array.from(url.searchParams.keys());
      const actualSet = new Set(actualKeys);
      const expectedSet = new Set(query);

      if (
        actualSet.size !== expectedSet.size ||
        actualKeys.some((key) => !expectedSet.has(key))
      ) {
        return null;
      }
    }

    const result: Record<string, string> = {};

    for (const key of query) {
      const value = url.searchParams.get(key);
      if (!value) return null;
      result[key] = value;
    }

    return result;
  } catch {
    return null;
  }
}

export const ensureStableSeizeLink = (
  href: string,
  currentHref?: string
): string => {
  try {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      return href;
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(href);
    } catch {
      targetUrl = new URL(href, baseUrl.origin);
    }

    if (targetUrl.origin !== baseUrl.origin) {
      return href;
    }

    const dropId = targetUrl.searchParams.get("drop");
    if (!dropId) {
      return href;
    }

    let globalWindow: Window | undefined;
    if (typeof globalThis === "object" && "window" in globalThis) {
      globalWindow = (
        globalThis as typeof globalThis & { window?: Window | undefined }
      ).window;
    }

    const resolvedCurrentHref = currentHref ?? globalWindow?.location.href;
    if (resolvedCurrentHref === undefined || resolvedCurrentHref === "") {
      return href;
    }

    let currentUrl: URL;
    try {
      currentUrl = new URL(resolvedCurrentHref);
    } catch {
      return href;
    }

    if (currentUrl.origin !== baseUrl.origin) {
      return href;
    }

    const params = new URLSearchParams(currentUrl.search);
    params.set("drop", dropId);
    const query = params.toString();
    const hash = currentUrl.hash;

    const path = currentUrl.pathname || "/";

    const querySuffix = query ? `?${query}` : "";

    return `${baseUrl.origin}${path}${querySuffix}${hash}`;
  } catch {
    return href;
  }
};
