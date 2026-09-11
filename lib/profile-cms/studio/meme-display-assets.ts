import { assetSchema, type CmsAssetV1 } from "@/lib/profile-cms/protocol/v1";
import manifest from "./meme-display-assets.json";

interface CmsStudioMemeDisplayAsset {
  readonly cardId: number;
  readonly originalUri: string;
  readonly originalHash: string;
  readonly sourcePage: string;
  readonly localPath: string;
  readonly asset: CmsAssetV1;
}

/** Generated static display files; signed packages retain the original media. */
export const CMS_STUDIO_MEME_DISPLAY_ASSETS: readonly CmsStudioMemeDisplayAsset[] =
  manifest.assets.map((item) => ({
    ...item,
    asset: assetSchema.parse(item.asset),
  }));

/** A URI match alone must never substitute a preview for different signed bytes. */
export function getCmsStudioMemeDisplayAsset(
  original: Pick<CmsAssetV1, "uri" | "content_hash">
): CmsStudioMemeDisplayAsset | null {
  return (
    CMS_STUDIO_MEME_DISPLAY_ASSETS.find(
      (item) =>
        item.originalUri === original.uri &&
        item.originalHash === original.content_hash
    ) ?? null
  );
}
