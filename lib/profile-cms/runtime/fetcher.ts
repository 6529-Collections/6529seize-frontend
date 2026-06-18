import minimalProfileHomepagePackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/minimal-profile-homepage.package.json";
import {
  isProfileCmsRuntimeEnabledEnv,
  shouldUseProfileCmsRuntimeFixturePrimaryEnv,
} from "@/config/profileCmsRuntimeEnv";
import {
  CMS_PACKAGE_SCHEMA,
  validateCmsPackageV1,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";
import { commonApiFetch } from "@/services/api/common-api";

/**
 * API client endpoint for HTTP GET /api/profile-cms/:handle/primary.
 *
 * Expected envelope:
 * { package, package_id, version, package_hash, payload_hash, updated_at, published_at? }
 *
 * This public primary pointer is auth-agnostic by contract. Do not forward
 * request auth headers into this endpoint; the short handle cache is shared
 * across server requests.
 */
export const PROFILE_CMS_PRIMARY_SITE_ENDPOINT = "profile-cms/{handle}/primary";

const PRIMARY_POINTER_CACHE_TTL_MS = 10_000;
const FIXTURE_PRIMARY_SITE_HANDLES = new Set(["punk6529"]);

type ProfileCmsPrimarySiteCacheEntry = {
  readonly expiresAt: number;
  readonly promise: Promise<ProfileCmsPrimarySite | null>;
};

type ProfileCmsPrimarySiteApiResponse =
  | CmsPackageV1
  | {
      readonly package?: unknown;
      readonly package_id?: string | undefined;
      readonly version?: string | undefined;
      readonly package_hash?: string | undefined;
      readonly payload_hash?: string | undefined;
      readonly updated_at?: string | undefined;
      readonly published_at?: string | undefined;
    };

type PrimarySiteEnvelopeHashes = {
  readonly packageHash: string;
  readonly payloadHash: string;
};

export type ProfileCmsPrimarySite = {
  readonly cmsPackage: CmsPackageV1;
  readonly packageId?: string | undefined;
  readonly version?: string | undefined;
  readonly packageHash?: string | undefined;
  readonly payloadHash?: string | undefined;
  readonly updatedAt?: string | undefined;
  readonly publishedAt?: string | undefined;
  readonly source: "api" | "fixture";
};

const cache = new Map<string, ProfileCmsPrimarySiteCacheEntry>();

export async function getProfileCmsPrimarySite({
  handle,
}: {
  readonly handle: string;
  readonly headers: Record<string, string>;
}): Promise<ProfileCmsPrimarySite | null> {
  if (!isProfileCmsRuntimeEnabled()) {
    return null;
  }

  const cacheKey = handle.trim().toLowerCase();
  if (!cacheKey) {
    return null;
  }

  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = fetchProfileCmsPrimarySite({
    handle: cacheKey,
  }).catch((error: unknown) => {
    cache.delete(cacheKey);
    throw error;
  });
  cache.set(cacheKey, {
    expiresAt: now + PRIMARY_POINTER_CACHE_TTL_MS,
    promise,
  });
  return promise;
}

export async function fetchProfileCmsPrimarySite({
  handle,
}: {
  readonly handle: string;
  readonly headers?: Record<string, string>;
}): Promise<ProfileCmsPrimarySite | null> {
  const normalizedHandle = handle.trim().toLowerCase();
  const endpoint = PROFILE_CMS_PRIMARY_SITE_ENDPOINT.replace(
    "{handle}",
    encodeURIComponent(normalizedHandle)
  );

  let response: ProfileCmsPrimarySiteApiResponse;
  try {
    // This endpoint is public by contract; do not vary the cached primary
    // pointer by caller auth headers.
    response = await commonApiFetch<ProfileCmsPrimarySiteApiResponse>({
      endpoint,
      headers: {},
    });
  } catch (error) {
    const fixtureSite = getFixturePrimarySite(normalizedHandle);
    if (fixtureSite && isApiUnavailableError(error)) {
      return fixtureSite;
    }

    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }

  return normalizePrimarySiteResponse(response, {
    expectedHandle: normalizedHandle,
  });
}

export function normalizePrimarySiteResponse(
  response: ProfileCmsPrimarySiteApiResponse,
  options: { readonly expectedHandle?: string | undefined } = {}
): ProfileCmsPrimarySite {
  if (allowDirectFixturePackageResponse() && isCmsPackage(response)) {
    return normalizeFixturePackage(response);
  }

  const cmsPackage = getValidatedPrimarySitePackage(response);
  assertExpectedHandle(cmsPackage, options.expectedHandle);
  const hashes = getPrimarySiteEnvelopeHashes(response, cmsPackage);
  assertEnvelopeHashes(cmsPackage, hashes);

  return createPrimarySiteResult(response, cmsPackage, hashes);
}

function getValidatedPrimarySitePackage(
  response: ProfileCmsPrimarySiteApiResponse
): CmsPackageV1 {
  const cmsPackage = extractPackage(response, {
    allowDirectPackage: allowDirectFixturePackageResponse(),
  });

  if (!cmsPackage) {
    throw new Error(
      "Profile CMS primary-site response did not include a package."
    );
  }

  assertProductionPackage(cmsPackage);
  return cmsPackage;
}

function assertProductionPackage(cmsPackage: CmsPackageV1): void {
  const validation = validateCmsPackageV1(cmsPackage, {
    allowFixtureSignatures: false,
    allowFixtureStorage: false,
    enforceHashes: true,
  });

  if (!validation.valid) {
    throw new Error(
      `Profile CMS package failed V1 validation${getIssueSummarySuffix(
        validation.issues
      )}`
    );
  }
}

function getIssueSummarySuffix(
  issues: ReadonlyArray<{
    readonly severity: string;
    readonly code: string;
    readonly path: string;
  }>
): string {
  const issueSummary = issues
    .filter((issue) => issue.severity === "error")
    .slice(0, 3)
    .map((issue) => `${issue.code} at ${issue.path}`)
    .join(", ");
  return issueSummary ? `: ${issueSummary}` : ".";
}

function assertExpectedHandle(
  cmsPackage: CmsPackageV1,
  expectedHandle: string | undefined
): void {
  if (
    expectedHandle &&
    cmsPackage.profile.handle.toLowerCase() !== expectedHandle.toLowerCase()
  ) {
    throw new Error("Profile CMS package handle mismatch.");
  }
}

function getPrimarySiteEnvelopeHashes(
  response: ProfileCmsPrimarySiteApiResponse,
  cmsPackage: CmsPackageV1
): PrimarySiteEnvelopeHashes {
  return {
    packageHash:
      getStringField(response, "package_hash") ??
      cmsPackage.integrity.package_hash,
    payloadHash:
      getStringField(response, "payload_hash") ??
      cmsPackage.integrity.payload_hash,
  };
}

function assertEnvelopeHashes(
  cmsPackage: CmsPackageV1,
  hashes: PrimarySiteEnvelopeHashes
): void {
  if (hashes.packageHash !== cmsPackage.integrity.package_hash) {
    throw new Error("Profile CMS package_hash envelope mismatch.");
  }

  if (hashes.payloadHash !== cmsPackage.integrity.payload_hash) {
    throw new Error("Profile CMS payload_hash envelope mismatch.");
  }
}

function createPrimarySiteResult(
  response: ProfileCmsPrimarySiteApiResponse,
  cmsPackage: CmsPackageV1,
  hashes: PrimarySiteEnvelopeHashes
): ProfileCmsPrimarySite {
  const packageId =
    getStringField(response, "package_id") ?? cmsPackage.package_id;
  const version = getStringField(response, "version");
  const updatedAt = getStringField(response, "updated_at");
  const publishedAt = getStringField(response, "published_at");

  return {
    cmsPackage,
    ...(packageId ? { packageId } : {}),
    ...(version ? { version } : {}),
    packageHash: hashes.packageHash,
    payloadHash: hashes.payloadHash,
    ...(updatedAt ? { updatedAt } : {}),
    ...(publishedAt ? { publishedAt } : {}),
    source: "api",
  };
}

export function clearProfileCmsRuntimeCacheForTests(): void {
  cache.clear();
}

function isProfileCmsRuntimeEnabled(): boolean {
  return isProfileCmsRuntimeEnabledEnv();
}

function allowDirectFixturePackageResponse(): boolean {
  return shouldUseProfileCmsRuntimeFixturePrimaryEnv();
}

function getFixturePrimarySite(handle: string): ProfileCmsPrimarySite | null {
  if (
    !shouldUseProfileCmsRuntimeFixturePrimaryEnv() ||
    !FIXTURE_PRIMARY_SITE_HANDLES.has(handle)
  ) {
    return null;
  }

  const cmsPackage = minimalProfileHomepagePackage as unknown as CmsPackageV1;
  return normalizeFixturePackage(cmsPackage);
}

function normalizeFixturePackage(
  cmsPackage: CmsPackageV1
): ProfileCmsPrimarySite {
  const validation = validateCmsPackageV1(cmsPackage, {
    allowFixtureSignatures: true,
    allowFixtureStorage: true,
    enforceHashes: false,
  });

  if (!validation.valid) {
    throw new Error("Profile CMS fixture package failed V1 validation.");
  }

  return {
    cmsPackage,
    packageId: cmsPackage.package_id,
    packageHash: cmsPackage.integrity.package_hash,
    payloadHash: cmsPackage.integrity.payload_hash,
    source: "fixture",
  };
}

function extractPackage(
  input: unknown,
  { allowDirectPackage }: { readonly allowDirectPackage: boolean }
): CmsPackageV1 | null {
  if (allowDirectPackage && isCmsPackage(input)) {
    return input;
  }

  if (!isRecord(input)) {
    return null;
  }

  const directPackage = input["package"];
  if (isCmsPackage(directPackage)) {
    return directPackage;
  }

  return null;
}

function isCmsPackage(value: unknown): value is CmsPackageV1 {
  return (
    isRecord(value) &&
    value["schema"] === CMS_PACKAGE_SCHEMA &&
    isRecord(value["payload"])
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getStringField(input: unknown, key: string): string | undefined {
  if (!isRecord(input)) {
    return undefined;
  }

  const value = input[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isNotFoundError(error: unknown): boolean {
  if (error === null || error === undefined) {
    return false;
  }

  const status = getErrorStatus(error);

  if (status === 404) {
    return true;
  }

  const message = getErrorMessage(error);
  return /not found|cannot get|404/i.test(message);
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object") {
    return undefined;
  }

  const apiError = error as {
    readonly response?: { readonly status?: number | undefined } | undefined;
    readonly status?: number | undefined;
  };
  return apiError.status ?? apiError.response?.status;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "";
}

function isApiUnavailableError(error: unknown): boolean {
  if (isNotFoundError(error)) {
    return false;
  }

  const message = getErrorMessage(error);
  return /failed to fetch|network request failed|network error|econnrefused|enotfound/i.test(
    message
  );
}
