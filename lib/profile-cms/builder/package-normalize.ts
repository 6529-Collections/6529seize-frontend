// Maps the real backend ApiProfileCmsPackage record (snake_case, see the
// backend repo's src/api-serverless/src/profile-cms/profile-cms.handlers.ts
// and src/api-serverless/src/generated/models/ApiProfileCmsPackage.ts) into a
// small camelCase record the builder drafts list/load UI can render, without
// requiring every consumer to know the wire field names.
import type { ApiProfileCmsPackage } from "@/generated/models/ApiProfileCmsPackage";
import {
  validateCmsPackageV1,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";

// The OpenAPI generator aliases the on-wire `package` field to `_package` in
// the generated client class; plain JSON responses keep the original
// `package` key, so the adapter reads the wire shape directly.
export type ProfileCmsPackageWire = Omit<ApiProfileCmsPackage, "_package"> & {
  readonly package: unknown;
};

type ProfileCmsPackageStatus = `${ApiProfileCmsPackage["status"]}`;

export type ProfileCmsPackageRecord = {
  readonly id: string;
  readonly profileId: string;
  readonly profileHandle: string;
  readonly packageId: string;
  readonly version: number;
  readonly status: ProfileCmsPackageStatus;
  readonly packageHash: string;
  readonly payloadHash: string;
  readonly updatedAt: string;
  readonly createdAt: string;
  readonly publishedAt?: string | undefined;
};

export type LoadedProfileCmsPackageRecord = ProfileCmsPackageRecord & {
  readonly cmsPackage: CmsPackageV1;
};

export function normalizeProfileCmsPackageRecord(
  record: ProfileCmsPackageWire
): ProfileCmsPackageRecord {
  return {
    id: record.id,
    profileId: record.profile_id,
    profileHandle: record.profile_handle,
    packageId: record.package_id,
    version: record.version,
    status: record.status,
    packageHash: record.package_hash,
    payloadHash: record.payload_hash,
    updatedAt: new Date(record.updated_at).toISOString(),
    createdAt: new Date(record.created_at).toISOString(),
    ...(record.published_at === undefined
      ? {}
      : { publishedAt: new Date(record.published_at).toISOString() }),
  };
}

// Hashes are not re-enforced here: a stored draft may predate local edits and
// the builder recomputes hashes before every save/validate anyway. Structural
// V1 validation still rejects malformed stored payloads before they can crash
// the editor state import.
export function normalizeLoadedProfileCmsPackageRecord(
  record: ProfileCmsPackageWire
): LoadedProfileCmsPackageRecord {
  const validation = validateCmsPackageV1(record.package, {
    allowFixtureSignatures: true,
    allowFixtureStorage: true,
    enforceHashes: false,
  });
  if (!validation.valid) {
    throw new Error("invalid_profile_cms_package");
  }

  return {
    ...normalizeProfileCmsPackageRecord(record),
    cmsPackage: record.package as CmsPackageV1,
  };
}
