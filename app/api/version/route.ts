import { publicEnv } from "@/config/env";
import { NextResponse } from "next/server";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };
const ANNOUNCED_VERSION_TIMEOUT_MS = 5_000;
const ANNOUNCED_VERSION_CACHE_TTL_MS = 5_000;
const CLIENT_VERSION_HEADER = "x-6529-client-version";
const ANNOUNCED_VERSION_ALLOWED_HOSTS = new Set([
  "dnclu2fna0b2b.cloudfront.net",
]);

export const dynamic = "force-dynamic";

type AnnouncedVersion = {
  readonly publishedAt: string | null;
  readonly version: string;
};

type AnnouncedVersionCacheEntry = {
  readonly endpoint: string;
  readonly expiresAt: number;
  readonly version: AnnouncedVersion;
};

type AnnouncedVersionInFlightRequest = {
  endpoint: string;
  promise: Promise<AnnouncedVersion | null>;
};

let announcedVersionCache: AnnouncedVersionCacheEntry | null = null;
let announcedVersionInFlight: AnnouncedVersionInFlightRequest | null = null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeVersion = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseTimestamp = (value: unknown): number | null => {
  const normalized = normalizeVersion(value);
  if (!normalized) {
    return null;
  }

  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

const getCurrentVersion = () => publicEnv.VERSION ?? "unknown";

const normalizeAnnouncementEndpoint = (endpoint: string): string | null => {
  try {
    const url = new URL(endpoint);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !ANNOUNCED_VERSION_ALLOWED_HOSTS.has(url.hostname)
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
};

const shouldExposeAnnouncedVersion = (
  announcedVersion: AnnouncedVersion,
  currentVersion: string
): boolean => {
  if (announcedVersion.version === currentVersion) {
    return true;
  }

  const buildTime = parseTimestamp(publicEnv.VERSION_BUILD_TIMESTAMP);
  const publishedTime = parseTimestamp(announcedVersion.publishedAt);

  if (publishedTime === null) {
    return false;
  }

  // Production sets VERSION_BUILD_TIMESTAMP before the build; only newer
  // announcements should stale that bundle. Local/custom configs without that
  // timestamp still honor a valid ready announcement instead of suppressing all
  // external announcements forever.
  return buildTime === null || publishedTime > buildTime;
};

const extractReadyVersion = (payload: unknown): AnnouncedVersion | null => {
  if (!isRecord(payload) || payload["ready"] !== true) {
    return null;
  }

  const version = normalizeVersion(payload["version"]);
  if (!version) {
    return null;
  }

  return {
    publishedAt: normalizeVersion(payload["published_at"]),
    version,
  };
};

async function fetchAnnouncedVersion(
  endpoint: string
): Promise<AnnouncedVersion | null> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    ANNOUNCED_VERSION_TIMEOUT_MS
  );

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return null;
    }

    return extractReadyVersion(payload);
  } finally {
    clearTimeout(timeout);
  }
}

async function getAnnouncedVersion(
  endpoint: string
): Promise<AnnouncedVersion | null> {
  const now = Date.now();

  if (
    announcedVersionCache?.endpoint === endpoint &&
    announcedVersionCache.expiresAt > now
  ) {
    return announcedVersionCache.version;
  }

  if (announcedVersionInFlight?.endpoint === endpoint) {
    return announcedVersionInFlight.promise;
  }

  const request: AnnouncedVersionInFlightRequest = {
    endpoint,
    promise: fetchAnnouncedVersion(endpoint).then((announcedVersion) => {
      if (announcedVersion) {
        announcedVersionCache = {
          endpoint,
          expiresAt: Date.now() + ANNOUNCED_VERSION_CACHE_TTL_MS,
          version: announcedVersion,
        };
      }

      return announcedVersion;
    }),
  };

  request.promise = request.promise.finally(() => {
    if (announcedVersionInFlight === request) {
      announcedVersionInFlight = null;
    }
  });
  announcedVersionInFlight = request;

  return request.promise;
}

const shouldRefreshClient = ({
  announcedVersion,
  clientVersion,
  useAnnouncementGate,
  version,
}: {
  readonly announcedVersion: string | null;
  readonly clientVersion: string | null;
  readonly useAnnouncementGate: boolean;
  readonly version: string;
}): boolean => {
  const currentClientVersion = clientVersion ?? version;

  // Production intentionally gates the toast on a valid, reachable announcement
  // endpoint. Local/staging or broken endpoint configs keep the historical
  // live-instance comparison so version drift remains detectable.
  const targetVersion = useAnnouncementGate
    ? announcedVersion
    : (announcedVersion ?? version);

  return targetVersion !== null && targetVersion !== currentClientVersion;
};

const versionResponse = ({
  announcedVersion,
  clientVersion,
  useAnnouncementGate,
  version,
}: {
  readonly announcedVersion: string | null;
  readonly clientVersion: string | null;
  readonly useAnnouncementGate: boolean;
  readonly version: string;
}) =>
  NextResponse.json(
    {
      announced_version: announcedVersion,
      stale: shouldRefreshClient({
        announcedVersion,
        clientVersion,
        useAnnouncementGate,
        version,
      }),
      version,
    },
    { headers: NO_STORE_HEADERS }
  );

export async function GET(request?: Request) {
  const version = getCurrentVersion();
  const clientVersion = normalizeVersion(
    request?.headers.get(CLIENT_VERSION_HEADER)
  );
  const endpoint = publicEnv.ANNOUNCED_VERSION_ENDPOINT;
  const configuredEndpoint = normalizeVersion(endpoint);
  const announcementEndpoint = configuredEndpoint
    ? normalizeAnnouncementEndpoint(configuredEndpoint)
    : null;
  let useAnnouncementGate = announcementEndpoint !== null;

  if (configuredEndpoint && !announcementEndpoint) {
    console.warn(
      "Ignoring invalid ANNOUNCED_VERSION_ENDPOINT; falling back to live version checks."
    );
  }

  if (announcementEndpoint) {
    try {
      const announcedVersion = await getAnnouncedVersion(announcementEndpoint);
      if (
        announcedVersion &&
        shouldExposeAnnouncedVersion(announcedVersion, version)
      ) {
        return versionResponse({
          announcedVersion: announcedVersion.version,
          clientVersion,
          useAnnouncementGate,
          version,
        });
      }
    } catch (error) {
      useAnnouncementGate = false;
      console.warn(
        "Failed to fetch announced version; falling back to live version checks.",
        error
      );
    }
  }

  return versionResponse({
    announcedVersion: null,
    clientVersion,
    useAnnouncementGate,
    version,
  });
}

export const __resetAnnouncedVersionCacheForTests = () => {
  announcedVersionCache = null;
  announcedVersionInFlight = null;
};
