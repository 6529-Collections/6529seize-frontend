import { assetSchema, type CmsAssetV1 } from "@/lib/profile-cms/protocol/v1";
import manifest from "./approved-assets.json";

/** Display bytes are hash-bound; original sources and transformations are recorded separately. */
export const CMS_APPROVED_ART_ASSETS: readonly CmsAssetV1[] =
  manifest.assets.map((entry) => assetSchema.parse(entry.asset));

function findApprovedAsset(asset: Pick<CmsAssetV1, "uri" | "content_hash">) {
  return manifest.assets.find(
    (entry) =>
      entry.asset.uri === asset.uri &&
      entry.asset.content_hash === asset.content_hash
  );
}

export function getCmsApprovedDisplayAssetPath(
  asset: CmsAssetV1
): string | null {
  const entry = findApprovedAsset(asset);
  return entry ? new URL(entry.asset.uri).pathname : null;
}

export function getCmsApprovedAssetTitle(asset: CmsAssetV1): string | null {
  return findApprovedAsset(asset)?.title ?? null;
}

export function isCmsApprovedPixelArtAsset(asset: CmsAssetV1): boolean {
  return findApprovedAsset(asset)?.provenance.kind === "onchain_svg_raster";
}
