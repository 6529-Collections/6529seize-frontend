import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CmsAssetV1, CmsBlockV1 } from "@/lib/profile-cms/protocol/v1";
import {
  CmsInspectableArtwork,
  type CmsArtInspectionItem,
  type CmsArtInspectionMetadata,
  type CmsArtInspectorLabels,
} from "@/components/profile-cms/CmsArtLightbox";
import type { CmsArtGridMode } from "@/components/profile-cms/cmsArtGalleryClasses";
import {
  getString,
  resolveAssetUrl,
} from "@/components/profile-cms/site-renderer/data";
import { UnsupportedBlock } from "@/components/profile-cms/site-renderer/links";
import {
  EMPTY_ART_METADATA,
  type CmsDisplayVariantV1,
  type RendererContext,
} from "@/components/profile-cms/site-renderer/types";

export function AssetImage({
  asset,
  caption,
  context,
  extraMetadata = EMPTY_ART_METADATA,
  imageClassName = "tw-object-contain",
  loading = "lazy",
  title,
}: {
  readonly asset: CmsAssetV1 | null | undefined;
  readonly caption?: string | undefined;
  readonly context: RendererContext;
  readonly extraMetadata?: readonly CmsArtInspectionMetadata[] | undefined;
  readonly imageClassName?: string | undefined;
  readonly loading?: "eager" | "lazy" | undefined;
  readonly title?: string | undefined;
}) {
  const item = asset
    ? createArtInspectionItem({
        asset,
        caption,
        context,
        extraMetadata,
        title,
      })
    : null;

  if (!item) {
    return (
      <UnsupportedBlock
        label={t(context.locale, "profileCms.block.imageUnavailable")}
      />
    );
  }

  return (
    <CmsInspectableArtwork
      caption={caption}
      imageClassName={imageClassName}
      item={item}
      labels={getArtInspectorLabels(context.locale)}
      loading={loading}
    />
  );
}

export function MediaCaption({
  asset,
}: {
  readonly asset: CmsAssetV1 | undefined;
}) {
  if (!asset?.alt_text) {
    return null;
  }

  return (
    <figcaption className="tw-text-sm tw-leading-6 tw-text-iron-400">
      {asset.alt_text}
    </figcaption>
  );
}

export function getMediaCaptionTrackSrc(
  asset: CmsAssetV1 | undefined,
  locale: SupportedLocale
): string {
  const caption = asset?.alt_text?.trim();
  if (!caption) {
    return getWebVttDataUri(t(locale, "profileCms.media.noCaptions"));
  }

  return getWebVttDataUri(caption);
}

function getWebVttDataUri(caption: string): string {
  const vtt = `WEBVTT\n\n00:00:00.000 --> 99:59:59.000\n${escapeWebVttText(caption)}\n`;
  return `data:text/vtt;charset=utf-8,${encodeURIComponent(vtt)}`;
}

function escapeWebVttText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function createArtInspectionItem({
  asset,
  caption,
  context,
  extraMetadata = [],
  originalAsset,
  title,
  variant,
}: {
  readonly asset: CmsAssetV1;
  readonly caption?: string | undefined;
  readonly context: RendererContext;
  readonly extraMetadata?: readonly CmsArtInspectionMetadata[] | undefined;
  readonly originalAsset?: CmsAssetV1 | undefined;
  readonly title?: string | undefined;
  readonly variant?: CmsDisplayVariantV1 | undefined;
}): CmsArtInspectionItem | null {
  if (asset.kind !== "image" && asset.kind !== "social_image") {
    return null;
  }

  const src = resolveAssetUrl(asset);
  if (!src) {
    return null;
  }

  const originalUrl = resolveAssetUrl(originalAsset);
  const roleLabel = getAssetRoleLabel(context.locale, asset, variant);
  const metadata = compactMetadataEntries([
    {
      label: t(context.locale, "profileCms.art.metadata.role"),
      value: roleLabel,
    },
    {
      label: t(context.locale, "profileCms.art.metadata.assetId"),
      value: asset.id,
    },
    {
      label: t(context.locale, "profileCms.art.metadata.kind"),
      value: asset.kind,
    },
    {
      label: t(context.locale, "profileCms.art.metadata.mimeType"),
      value: asset.mime_type,
    },
    {
      label: t(context.locale, "profileCms.art.metadata.dimensions"),
      value: formatAssetDimensions(context.locale, asset),
    },
    {
      href: src,
      label: t(context.locale, "profileCms.art.metadata.displayMedia"),
      value: asset.uri,
    },
    {
      href:
        originalAsset && originalAsset.id !== asset.id
          ? (originalUrl ?? undefined)
          : undefined,
      label: t(context.locale, "profileCms.art.metadata.originalMedia"),
      value:
        originalAsset && originalAsset.id !== asset.id ? originalAsset.uri : "",
    },
    {
      label: t(context.locale, "profileCms.art.metadata.sourceAsset"),
      value:
        variant?.source_asset_id && variant.source_asset_id !== asset.id
          ? variant.source_asset_id
          : "",
    },
    {
      label: t(context.locale, "profileCms.art.metadata.contentHash"),
      value: asset.content_hash,
    },
    {
      label: t(context.locale, "profileCms.art.metadata.rights"),
      value: asset.rights ?? "",
    },
    ...extraMetadata,
  ]);

  return {
    id: asset.id,
    title: title ?? asset.alt_text ?? asset.id,
    src,
    alt: asset.decorative ? "" : (asset.alt_text ?? title ?? ""),
    metadata,
    ...(caption || asset.alt_text
      ? { caption: caption ?? asset.alt_text }
      : {}),
    ...(roleLabel ? { roleLabel } : {}),
    ...(asset.width ? { width: asset.width } : {}),
    ...(asset.height ? { height: asset.height } : {}),
    ...(variant?.background ? { background: variant.background } : {}),
  };
}

export function compactMetadataEntries(
  entries: readonly CmsArtInspectionMetadata[]
): CmsArtInspectionMetadata[] {
  return entries.filter(
    (entry) => typeof entry.value === "string" && entry.value.trim().length > 0
  );
}

function formatAssetDimensions(
  locale: SupportedLocale,
  asset: CmsAssetV1
): string {
  if (!asset.width || !asset.height) {
    return "";
  }

  return t(locale, "profileCms.art.metadata.dimensionsValue", {
    height: formatInteger(locale, asset.height),
    width: formatInteger(locale, asset.width),
  });
}

export function getArtInspectorLabels(
  locale: SupportedLocale
): CmsArtInspectorLabels {
  return {
    inspect: t(locale, "profileCms.art.inspect"),
    close: t(locale, "profileCms.art.close"),
    previous: t(locale, "profileCms.art.previous"),
    next: t(locale, "profileCms.art.next"),
    zoomIn: t(locale, "profileCms.art.zoomIn"),
    zoomOut: t(locale, "profileCms.art.zoomOut"),
    resetZoom: t(locale, "profileCms.art.resetZoom"),
    fullscreen: t(locale, "profileCms.art.fullscreen"),
    showMetadata: t(locale, "profileCms.art.showMetadata"),
    hideMetadata: t(locale, "profileCms.art.hideMetadata"),
    metadataTitle: t(locale, "profileCms.art.metadata.title"),
  };
}

function getAssetRoleLabel(
  locale: SupportedLocale,
  asset: CmsAssetV1,
  variant: CmsDisplayVariantV1 | undefined
): string {
  if (asset.roles?.includes("original")) {
    return t(locale, "profileCms.art.role.original");
  }

  if (asset.roles?.some((role) => role === "poster" || role === "fallback")) {
    return t(locale, "profileCms.art.role.poster");
  }

  if (variant?.source_asset_id && variant.source_asset_id !== asset.id) {
    return t(locale, "profileCms.art.role.derivative");
  }

  if (
    asset.roles?.some((role) =>
      ["thumbnail", "grid", "detail", "fullscreen", "social"].includes(role)
    )
  ) {
    return t(locale, "profileCms.art.role.derivative");
  }

  return t(locale, "profileCms.art.role.display");
}

export function getGalleryMode(
  block: CmsBlockV1,
  fallback: CmsArtGridMode
): CmsArtGridMode {
  const value =
    getString(block, "display_mode") ??
    getString(block, "grid_mode") ??
    getString(block, "mode");

  if (
    value === "editorial" ||
    value === "dense" ||
    value === "contact_sheet" ||
    value === "clean"
  ) {
    return value;
  }

  return fallback;
}

export function getGalleryModeLabel(
  locale: SupportedLocale,
  mode: CmsArtGridMode
): string {
  switch (mode) {
    case "editorial":
      return t(locale, "profileCms.gallery.mode.editorial");
    case "dense":
      return t(locale, "profileCms.gallery.mode.dense");
    case "contact_sheet":
      return t(locale, "profileCms.gallery.mode.contactSheet");
    case "clean":
      return t(locale, "profileCms.gallery.mode.clean");
  }
}
