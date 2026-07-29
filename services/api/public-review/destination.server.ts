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
