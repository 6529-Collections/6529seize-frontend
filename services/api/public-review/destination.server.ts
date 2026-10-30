import "next/dist/compiled/server-only";

import {
  getPublicReviewDestinationsEnv,
  PUBLIC_REVIEW_DESTINATIONS_ENV,
} from "@/config/publicReviewDestinationEnv.server";
import type {
  PublicReviewDiscussionDestination,
  PublicReviewEnvironment,
} from "./types";

export { PUBLIC_REVIEW_DESTINATIONS_ENV };

const LOGICAL_KEY_SEGMENT_PATTERN = /^[a-z0-9]+$/;
const WAVE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENVIRONMENTS = new Set<PublicReviewEnvironment>([
  "local",
  "staging",
  "production",
]);

type DestinationMap = Readonly<
  Partial<Record<PublicReviewEnvironment, Readonly<Record<string, string>>>>
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidLogicalKey(value: string): boolean {
  if (!value || value.length > 120) {
    return false;
  }
  return value
    .split("-")
    .every((segment) => LOGICAL_KEY_SEGMENT_PATTERN.test(segment));
}

function parseEnvironmentDestinations({
  assignedWaveEnvironments,
  environment,
  value,
}: {
  readonly assignedWaveEnvironments: Map<string, PublicReviewEnvironment>;
  readonly environment: PublicReviewEnvironment;
  readonly value: Record<string, unknown>;
}): Record<string, string> {
  const destinations: Record<string, string> = {};
  for (const [logicalKey, rawWaveId] of Object.entries(value)) {
    if (!isValidLogicalKey(logicalKey)) {
      throw new Error(
        `Invalid public review destination key for ${environment}.`
      );
    }
    if (typeof rawWaveId !== "string" || !WAVE_ID_PATTERN.test(rawWaveId)) {
      throw new Error(
        `Invalid public review Wave id for ${environment}.${logicalKey}.`
      );
    }

    const waveId = rawWaveId.toLowerCase();
    const assignedEnvironment = assignedWaveEnvironments.get(waveId);
    if (assignedEnvironment && assignedEnvironment !== environment) {
      throw new Error(
        "A public review Wave id cannot be shared across environments."
      );
    }
    assignedWaveEnvironments.set(waveId, environment);
    destinations[logicalKey] = waveId;
  }
  return destinations;
}

function parseDestinationMap(raw: string | undefined): DestinationMap {
  if (raw === undefined || raw.trim() === "") {
    throw new Error(`${PUBLIC_REVIEW_DESTINATIONS_ENV} is not configured.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `${PUBLIC_REVIEW_DESTINATIONS_ENV} must contain valid JSON.`
    );
  }

  if (!isRecord(parsed)) {
    throw new Error(
      `${PUBLIC_REVIEW_DESTINATIONS_ENV} must be an environment object.`
    );
  }

  const destinations: Partial<
    Record<PublicReviewEnvironment, Record<string, string>>
  > = {};
  const assignedWaveEnvironments = new Map<string, PublicReviewEnvironment>();

  for (const environment of ENVIRONMENTS) {
    const environmentValue = parsed[environment];
    if (environmentValue === undefined) {
      continue;
    }
    if (!isRecord(environmentValue)) {
      throw new Error(
        `${PUBLIC_REVIEW_DESTINATIONS_ENV}.${environment} must be an object.`
      );
    }

    destinations[environment] = parseEnvironmentDestinations({
      assignedWaveEnvironments,
      environment,
      value: environmentValue,
    });
  }

  const unknownEnvironments = Object.keys(parsed).filter(
    (key) => !ENVIRONMENTS.has(key as PublicReviewEnvironment)
  );
  if (unknownEnvironments.length > 0) {
    throw new Error(
      `${PUBLIC_REVIEW_DESTINATIONS_ENV} contains an unknown environment.`
    );
  }

  return destinations;
}

export function resolvePublicReviewDiscussionDestination({
  environment,
  logicalKey,
}: {
  readonly environment: PublicReviewEnvironment;
  readonly logicalKey: string;
}): PublicReviewDiscussionDestination {
  if (!isValidLogicalKey(logicalKey)) {
    throw new Error("Invalid public review destination key.");
  }

  const destinations = parseDestinationMap(getPublicReviewDestinationsEnv());
  const waveId = destinations[environment]?.[logicalKey];
  if (waveId === undefined) {
    throw new Error(
      `Public review destination ${logicalKey} is not configured for ${environment}.`
    );
  }

  return { logicalKey, environment, waveId };
}

const SITE_DESTINATION_TIMEOUT_MS = 15_000;
const SITE_DESTINATION_CACHE_MS = 10 * 60_000;

const siteDestinations = new Map<
  string,
  {
    readonly destination: Promise<PublicReviewDiscussionDestination>;
    readonly expiresAt: number;
  }
>();

async function requestSiteDestination({
  environment,
  logicalKey,
  url,
}: {
  readonly environment: PublicReviewEnvironment;
  readonly logicalKey: string;
  readonly url: URL;
}): Promise<PublicReviewDiscussionDestination> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(SITE_DESTINATION_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(
      `The site's public review destination is unavailable (HTTP ${response.status}).`
    );
  }

  const payload: unknown = await response.json();
  const waveId = isRecord(payload) ? payload["waveId"] : undefined;
  if (
    !isRecord(payload) ||
    payload["environment"] !== environment ||
    payload["logicalKey"] !== logicalKey ||
    typeof waveId !== "string" ||
    !WAVE_ID_PATTERN.test(waveId)
  ) {
    throw new Error("The site returned an invalid public review destination.");
  }

  return { logicalKey, environment, waveId: waveId.toLowerCase() };
}

/**
 * Asks the site for a destination, for servers that carry none of the site's
 * configuration (the desktop app). The site's review pages already show the
 * destination to every reader. Answers are kept for ten minutes.
 */
export function fetchSitePublicReviewDiscussionDestination({
  environment,
  logicalKey,
  path,
  siteOrigin,
}: {
  readonly environment: PublicReviewEnvironment;
  readonly logicalKey: string;
  readonly path: string;
  readonly siteOrigin: string;
}): Promise<PublicReviewDiscussionDestination> {
  if (!isValidLogicalKey(logicalKey)) {
    return Promise.reject(new Error("Invalid public review destination key."));
  }
  const origin = new URL(siteOrigin).origin;
  const url = new URL(path, origin);
  if (url.origin !== origin) {
    return Promise.reject(
      new Error("The public review destination path leaves the site.")
    );
  }

  const cacheKey = `${environment}:${logicalKey}:${url.toString()}`;
  const now = Date.now();
  const cached = siteDestinations.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.destination;
  }

  const destination = requestSiteDestination({ environment, logicalKey, url });
  siteDestinations.set(cacheKey, {
    destination,
    expiresAt: now + SITE_DESTINATION_CACHE_MS,
  });
  destination.catch(() => {
    if (siteDestinations.get(cacheKey)?.destination === destination) {
      siteDestinations.delete(cacheKey);
    }
  });
  return destination;
}
