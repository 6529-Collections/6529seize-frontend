import { getImageProps } from "next/image";

import type { CmsAssetV1 } from "@/lib/profile-cms/protocol/v1";
import { getCmsStudioDemoAssetPath } from "@/lib/profile-cms/studio/demo-assets";
import { getCmsStudioMemeDisplayAsset } from "@/lib/profile-cms/studio/meme-display-assets";
import { isCmsApprovedPixelArtAsset } from "@/lib/profile-cms/studio/approved-assets";
import type { RendererContext } from "../site-renderer/types";
import { createArtInspectionItem } from "../site-renderer/media";

export function getApprovedMedia(
  asset: CmsAssetV1 | undefined,
  context: RendererContext,
  title?: string
) {
  if (!asset) return null;
  const item = createArtInspectionItem({ asset, context, title });
  if (!item) return null;
  const local =
    getCmsStudioDemoAssetPath(asset) ??
    getCmsStudioMemeDisplayAsset(asset)?.localPath;
  const pixelArt = asset.width === 32 || isCmsApprovedPixelArtAsset(asset);
  let src = local ?? item.src;
  if (local && !pixelArt)
    src = getImageProps({
      src: local,
      alt: item.alt,
      width: 1200,
      height: Math.round((1200 * (item.height ?? 1)) / (item.width ?? 1)),
    }).props.src;
  return { item, pixelArt, src };
}
