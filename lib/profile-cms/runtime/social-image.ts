import type {
  CmsAssetV1,
  CmsPackageV1,
  CmsPageV1,
} from "@/lib/profile-cms/protocol/v1";
import { getCmsStudioDemoAssetPath } from "@/lib/profile-cms/studio/demo-assets";
import { getCmsStudioMemeDisplayAsset } from "@/lib/profile-cms/studio/meme-display-assets";
import { resolveCmsUri } from "./uri";

/** Explicit page choice wins; otherwise use the first displayed image on that page. */
export function getCmsPageSocialImage(
  document: CmsPackageV1,
  page: CmsPageV1,
  siteOrigin: string
): { asset: CmsAssetV1; url: string } | null {
  const ids: string[] = [];
  if (page.metadata.social_image_asset_id)
    ids.push(page.metadata.social_image_asset_id);
  for (const block of page.blocks) {
    const record: Readonly<Record<string, unknown>> = block;
    if (block.block_type === "image" && typeof record["asset_id"] === "string")
      ids.push(record["asset_id"]);
    if (
      (block.block_type === "gallery" ||
        block.block_type === "lightbox_gallery") &&
      Array.isArray(record["asset_ids"])
    ) {
      ids.push(
        ...record["asset_ids"].filter(
          (id): id is string => typeof id === "string"
        )
      );
    }
  }
  for (const id of ids) {
    const original = document.payload.assets.find(
      (asset) =>
        asset.id === id &&
        (asset.kind === "image" || asset.kind === "social_image")
    );
    if (!original) continue;
    const meme = getCmsStudioMemeDisplayAsset(original);
    const localPath = getCmsStudioDemoAssetPath(original) ?? meme?.localPath;
    const url = localPath
      ? new URL(localPath, siteOrigin).href
      : resolveCmsUri(original.uri);
    if (url) return { asset: meme?.asset ?? original, url };
  }
  return null;
}
