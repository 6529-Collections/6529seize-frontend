import { sha256 } from "js-sha256";

import { canonicalizeJson } from "./canonical-json";
import type { CmsPackageV1, CmsPayloadV1 } from "./schemas";

export function toCmsSha256Hash(input: string): string {
  return `sha256:${sha256(input)}`;
}

export function hashCanonicalJson(value: unknown): string {
  return toCmsSha256Hash(canonicalizeJson(value));
}

export function computeCmsPayloadHash(payload: CmsPayloadV1): string {
  return hashCanonicalJson(payload);
}

export function computeCmsPackageHash(cmsPackage: CmsPackageV1): string {
  return hashCanonicalJson(toPackageHashInput(cmsPackage));
}

export function withComputedCmsHashes(cmsPackage: CmsPackageV1): CmsPackageV1 {
  const payloadHash = computeCmsPayloadHash(cmsPackage.payload);
  const packageWithPayloadHash = {
    ...cmsPackage,
    integrity: {
      ...cmsPackage.integrity,
      payload_hash: payloadHash,
    },
  };
  const packageHash = computeCmsPackageHash(packageWithPayloadHash);

  return {
    ...packageWithPayloadHash,
    integrity: {
      ...packageWithPayloadHash.integrity,
      package_hash: packageHash,
    },
  };
}

export function toPackageHashInput(cmsPackage: CmsPackageV1): unknown {
  const baseIntegrity = {
    canonicalization: cmsPackage.integrity.canonicalization,
    hash_algorithm: cmsPackage.integrity.hash_algorithm,
    payload_hash: cmsPackage.integrity.payload_hash,
  };
  const integrity =
    typeof cmsPackage.integrity.note === "string"
      ? { ...baseIntegrity, note: cmsPackage.integrity.note }
      : baseIntegrity;

  return {
    schema: cmsPackage.schema,
    package_id: cmsPackage.package_id,
    profile: cmsPackage.profile,
    site: cmsPackage.site,
    payload: cmsPackage.payload,
    integrity,
    provenance: cmsPackage.provenance,
  };
}

export function isCmsSha256Hash(value: string): boolean {
  return /^sha256:[a-f0-9]{64}$/.test(value);
}
