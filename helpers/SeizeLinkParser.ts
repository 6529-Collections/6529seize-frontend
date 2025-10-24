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
  serialNo?: string;
  dropId?: string;
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const DIGITS_REGEX = /^\d+$/;

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

  if (url.pathname !== "/waves") {
    return null;
  }

  const waveId = sanitizeQueryValue(url.searchParams.get("wave"));

  if (
    !waveId ||
    !UUID_REGEX.test(waveId)
  ) {
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
    return null
  }

  return result;
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
  } catch (err) {
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
      globalWindow = (globalThis as typeof globalThis & { window?: Window }).window;
    }

    const resolvedCurrentHref = currentHref ?? globalWindow?.location?.href;
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
    const hash = currentUrl.hash ?? "";

    const path = currentUrl.pathname || "/";

    const querySuffix = query ? `?${query}` : "";

    return `${baseUrl.origin}${path}${querySuffix}${hash}`;
  } catch {
    return href;
  }
};
