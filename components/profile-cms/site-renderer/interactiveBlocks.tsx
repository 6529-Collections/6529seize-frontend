import CmsThreeDViewer from "@/components/profile-cms/CmsThreeDViewer";
import type {
  CmsThreeDAsset,
  CmsThreeDPlacement,
  CmsThreeDViewerConfig,
} from "@/components/profile-cms/CmsThreeDTypes";
import { t } from "@/i18n/messages";
import type { CmsAssetV1, CmsBlockV1 } from "@/lib/profile-cms/protocol/v1";
import { getCmsPagePath } from "@/lib/profile-cms/runtime/routes";
import { getCmsPerformanceBudgetBytes } from "@/lib/profile-cms/runtime/threeD";
import {
  getAsset,
  getString,
  isRenderableModelAsset,
  resolveAssetUrl,
  resolveTrustedEmbedAssetUrl,
  sanitizeSandboxPermissions,
} from "@/components/profile-cms/site-renderer/data";
import { InteractiveFallback } from "@/components/profile-cms/site-renderer/panels";
import type {
  CmsExhibitionRoomV1,
  RendererContext,
} from "@/components/profile-cms/site-renderer/types";

export function DeepZoomBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const manifest = context.deepZoomMap.get(
    getString(block, "deep_zoom_id") ??
      getString(block, "deep_zoom_manifest_id") ??
      ""
  );
  const asset = getAsset(context, manifest?.source_asset_id);
  return (
    <InteractiveFallback
      context={context}
      title={t(context.locale, "profileCms.interactive.deepZoom.title")}
      description={t(
        context.locale,
        "profileCms.interactive.deepZoom.description"
      )}
      asset={asset}
    />
  );
}

export function HtmlEmbedBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const policy = block.interactive_policy;
  const asset = getAsset(context, getString(block, "asset_id"));
  const assetUrl = resolveTrustedEmbedAssetUrl(asset);
  const fallbackAsset = getAsset(context, policy?.fallback_asset_id);

  if (policy?.hydration === "sandboxed_embed" && assetUrl) {
    return (
      <iframe
        className="tw-aspect-video tw-w-full tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
        src={assetUrl}
        title={
          asset?.alt_text ??
          t(context.locale, "profileCms.interactive.embed.iframeTitle")
        }
        sandbox={sanitizeSandboxPermissions(policy.sandbox_permissions)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <InteractiveFallback
      context={context}
      title={t(context.locale, "profileCms.interactive.embed.title")}
      description={t(
        context.locale,
        "profileCms.interactive.embed.description"
      )}
      asset={fallbackAsset ?? asset}
    />
  );
}

export function ObjectViewerBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const asset = getAsset(context, getString(block, "asset_id"));
  const objectAsset = toThreeDAsset(asset);
  const fallbackAsset = getAsset(
    context,
    block.interactive_policy?.fallback_asset_id
  );
  const posterAsset =
    getAsset(context, getString(block, "poster_asset_id")) ?? fallbackAsset;
  const poster = toThreeDAsset(posterAsset);

  if (asset && objectAsset && isRenderableModelAsset(asset)) {
    const config: CmsThreeDViewerConfig = {
      asset: objectAsset,
      budgetBytes: getCmsPerformanceBudgetBytes(
        block.interactive_policy?.performance_budget
      ),
      description: t(
        context.locale,
        "profileCms.interactive.object.description"
      ),
      kind: "object",
      poster,
      requiresActivation:
        block.interactive_policy?.requires_user_activation ?? true,
      sourceHref: resolveAssetUrl(asset) ?? undefined,
      title:
        getString(block, "title") ??
        asset.alt_text ??
        t(context.locale, "profileCms.interactive.object.title"),
    };

    return <CmsThreeDViewer config={config} locale={context.locale} />;
  }

  return (
    <InteractiveFallback
      context={context}
      title={t(context.locale, "profileCms.interactive.object.title")}
      description={t(
        context.locale,
        "profileCms.interactive.object.description"
      )}
      asset={fallbackAsset ?? asset}
      href={resolveAssetUrl(asset)}
    />
  );
}

export function RoomViewerBlock({
  block,
  context,
}: {
  readonly block: CmsBlockV1;
  readonly context: RendererContext;
}) {
  const room = context.roomMap.get(getString(block, "room_id") ?? "");
  const poster = getAsset(context, room?.poster_asset_id);
  const fallbackHref = room?.fallback_page_id
    ? getCmsPagePath(context.cmsPackage, room.fallback_page_id)
    : null;
  const placements =
    room?.placements
      .map((placement) => toThreeDPlacement(placement, context))
      .filter((placement): placement is CmsThreeDPlacement => !!placement) ??
    [];

  if (room && placements.length) {
    const config: CmsThreeDViewerConfig = {
      budgetBytes: getCmsPerformanceBudgetBytes(
        block.interactive_policy?.performance_budget
      ),
      description: t(context.locale, "profileCms.interactive.room.description"),
      fallbackHref: fallbackHref ?? undefined,
      kind: "room",
      placements,
      poster: toThreeDAsset(poster),
      preset: room.room_type,
      requiresActivation:
        block.interactive_policy?.requires_user_activation ?? true,
      title: room.title,
    };

    return <CmsThreeDViewer config={config} locale={context.locale} />;
  }

  return (
    <InteractiveFallback
      context={context}
      title={
        room?.title ?? t(context.locale, "profileCms.interactive.room.title")
      }
      description={t(context.locale, "profileCms.interactive.room.description")}
      asset={poster}
      href={fallbackHref}
    />
  );
}

function toThreeDPlacement(
  placement: CmsExhibitionRoomV1["placements"][number],
  context: RendererContext
): CmsThreeDPlacement | null {
  const asset = toThreeDAsset(getAsset(context, placement.asset_id));
  const detailHref = getCmsPagePath(
    context.cmsPackage,
    placement.detail_page_id
  );

  if (!asset || !detailHref) {
    return null;
  }

  return {
    asset,
    detailHref,
    displayMode: placement.display_mode,
    id: placement.id,
    label: placement.label ?? asset.alt,
    position: placement.position,
    rotation: placement.rotation,
    size: placement.size,
  };
}

function toThreeDAsset(
  asset: CmsAssetV1 | null | undefined
): CmsThreeDAsset | undefined {
  const url = resolveAssetUrl(asset);
  if (!asset || !url) {
    return undefined;
  }

  return {
    alt: asset.decorative ? "" : (asset.alt_text ?? asset.id),
    fileSizeBytes: asset.file_size_bytes,
    height: asset.height,
    id: asset.id,
    mimeType: asset.mime_type,
    title: asset.alt_text,
    url,
    width: asset.width,
  };
}
