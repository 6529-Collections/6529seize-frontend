import { getAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import {
  parseReleaseOrder,
  VERSION_POLL_HEADERS,
} from "@/lib/version/versionPoll";
import { logVersionPoll } from "@/lib/version/versionPollLog.server";
import { NextResponse } from "next/server";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };
const ANNOUNCED_VERSION_TIMEOUT_MS = 5_000;
const ANNOUNCED_VERSION_CACHE_TTL_MS = 5_000;
const CLIENT_VERSION_HEADER = VERSION_POLL_HEADERS.version;
const ANNOUNCED_VERSION_ALLOWED_HOSTS = new Set([
  "dnclu2fna0b2b.cloudfront.net",
]);

export const dynamic = "force-dynamic";

type AnnouncedVersion = {
  readonly publishedAt: string | null;
  readonly releaseOrder: number | null;
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
  if (
    announcedVersion.releaseOrder !== null ||
    announcedVersion.version === currentVersion
  ) {
    return true;
  }

  const buildTime = parseTimestamp(publicEnv.VERSION_BUILD_TIMESTAMP);
  const publishedTime = parseTimestamp(announcedVersion.publishedAt);

  if (publishedTime === null) {
    return false;
  }

  // Keep the timestamp check for older announcement documents.
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
    releaseOrder: parseReleaseOrder(payload["release_order"]),
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
  clientReleaseOrder,
  clientVersion,
  useAnnouncementGate,
  version,
}: {
  readonly announcedVersion: AnnouncedVersion | null;
  readonly clientReleaseOrder: number | null;
  readonly clientVersion: string | null;
  readonly useAnnouncementGate: boolean;
  readonly version: string;
}): boolean => {
  // Production and any configured announcement endpoint fail closed. Only
  // local/staging without an announcement endpoint compare live instances.
  if (!useAnnouncementGate) return version !== (clientVersion ?? version);

  if (
    !announcedVersion ||
    announcedVersion.version === (clientVersion ?? version)
  ) {
    return false;
  }

  if (clientReleaseOrder === null) return true;

  return (
    announcedVersion.releaseOrder !== null &&
    announcedVersion.releaseOrder > clientReleaseOrder
  );
};

const versionResponse = ({
  announcedVersion,
  clientVersion,
  request,
  useAnnouncementGate,
  version,
}: {
  readonly announcedVersion: AnnouncedVersion | null;
  readonly clientVersion: string | null;
  readonly request: Request | undefined;
  readonly useAnnouncementGate: boolean;
  readonly version: string;
}) => {
  const clientReleaseOrder = parseReleaseOrder(
    clientVersion === null || clientVersion === version
      ? publicEnv.VERSION_RELEASE_ORDER
      : request?.headers.get(VERSION_POLL_HEADERS.releaseOrder)
  );
  const stale = shouldRefreshClient({
    announcedVersion,
    clientReleaseOrder,
    clientVersion,
    useAnnouncementGate,
    version,
  });
  // Adoption telemetry: sampled, and only about the tab's build.
  logVersionPoll(request?.headers, stale);
  const announcedReleaseOrder = announcedVersion?.releaseOrder ?? null;
  return NextResponse.json(
    {
      announced_version: announcedVersion?.version ?? null,
      ...(announcedReleaseOrder !== null
        ? { announced_release_order: announcedReleaseOrder }
        : {}),
      stale,
      version,
    },
    { headers: NO_STORE_HEADERS }
  );
};

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
  const useAnnouncementGate =
    configuredEndpoint !== null ||
    getAppEnvironment(publicEnv.BASE_ENDPOINT).isProduction;

  if (configuredEndpoint && !announcementEndpoint) {
    console.warn(
      "Ignoring invalid ANNOUNCED_VERSION_ENDPOINT; update availability is unconfirmed."
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
          announcedVersion,
          clientVersion,
          request,
          useAnnouncementGate,
          version,
        });
      }
    } catch (error) {
      console.warn(
        "Failed to fetch announced version; update availability is unconfirmed.",
        error
      );
    }
  }

  return versionResponse({
    announcedVersion: null,
    clientVersion,
    request,
    useAnnouncementGate,
    version,
  });
}

export const __resetAnnouncedVersionCacheForTests = () => {
  announcedVersionCache = null;
  announcedVersionInFlight = null;
};
