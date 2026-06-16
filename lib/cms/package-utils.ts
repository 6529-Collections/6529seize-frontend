import { sha256 } from "js-sha256";

import { canonicalizeCmsJson } from "./canonicalize";
import { cmsPackageSchema } from "./schema";
import {
  CMS_PACKAGE_SCHEMA,
  type CmsHash,
  type CmsPayload,
  type CmsPublishedPackage,
  type CmsSignatureEnvelope,
  type CmsStorageLocation,
} from "./types";

export function hashCmsJson(value: unknown): CmsHash {
  return `sha256:${sha256(canonicalizeCmsJson(value))}`;
}

export function getCmsPayloadHash(payload: CmsPayload): CmsHash {
  return hashCmsJson(payload);
}

export function getCmsPackageHash(
  cmsPackage: Omit<CmsPublishedPackage, "package_hash"> & {
    readonly package_hash?: CmsHash;
  }
): CmsHash {
  return hashCmsJson({
    ...cmsPackage,
    package_hash: null,
  });
}

export function buildCmsPackage(param: {
  readonly payload: CmsPayload;
  readonly signature: CmsSignatureEnvelope;
  readonly storage: readonly CmsStorageLocation[];
}): CmsPublishedPackage {
  const payloadHash = getCmsPayloadHash(param.payload);
  const packageWithoutHash = {
    schema: CMS_PACKAGE_SCHEMA,
    payload_hash: payloadHash,
    package_hash: null,
    payload: param.payload,
    signature: param.signature,
    storage: param.storage,
  };
  const packageHash = hashCmsJson(packageWithoutHash);

  return {
    schema: CMS_PACKAGE_SCHEMA,
    payload_hash: payloadHash,
    package_hash: packageHash,
    payload: param.payload,
    signature: param.signature,
    storage: param.storage,
  };
}

export function parseCmsPackage(value: unknown): CmsPublishedPackage {
  const parsed = cmsPackageSchema.parse(value);
  return parsed as CmsPublishedPackage;
}

export function assertCmsPackageHashes(cmsPackage: CmsPublishedPackage): void {
  const payloadHash = getCmsPayloadHash(cmsPackage.payload);
  if (payloadHash !== cmsPackage.payload_hash) {
    throw new Error(
      `CMS payload hash mismatch: expected ${cmsPackage.payload_hash}, got ${payloadHash}`
    );
  }

  const packageHash = getCmsPackageHash(cmsPackage);
  if (packageHash !== cmsPackage.package_hash) {
    throw new Error(
      `CMS package hash mismatch: expected ${cmsPackage.package_hash}, got ${packageHash}`
    );
  }
}
