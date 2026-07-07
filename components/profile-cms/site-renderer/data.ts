import { publicEnv } from "@/config/env";
import { formatDate as formatLocalizedDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  CmsAssetV1,
  CmsNavigationItemV1,
  CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";
import { getCmsPagePath } from "@/lib/profile-cms/runtime/routes";
import { resolveCmsUri } from "@/lib/profile-cms/runtime/uri";
import type {
  CmsPackageSignatureV1,
  CmsSourcePacketV1,
  LabelValueRow,
  RendererContext,
} from "@/components/profile-cms/site-renderer/types";

const SANDBOX_PERMISSION_ALLOWLIST = new Set([
  "allow-forms",
  "allow-pointer-lock",
  "allow-presentation",
  "allow-scripts",
]);

export function getUniqueLabelValueRows<T extends LabelValueRow>(
  items: readonly T[]
): ReadonlyArray<T & { readonly key: string }> {
  const seen = new Map<string, number>();

  return items.map((item) => {
    const baseKey = `${item.label}-${item.value ?? ""}-${item.href ?? ""}`;
    const occurrence = (seen.get(baseKey) ?? 0) + 1;
    seen.set(baseKey, occurrence);

    return {
      ...item,
      key: `${baseKey}-${occurrence}`,
    };
  });
}

export function formatProviderUri(
  locale: SupportedLocale,
  provider: string,
  uri: string
): string {
  return t(locale, "profileCms.provenance.providerUri", {
    provider,
    uri,
  });
}

export function formatSignature(
  locale: SupportedLocale,
  signature: CmsPackageSignatureV1
): string {
  return t(locale, "profileCms.provenance.signatureValue", {
    signer: signature.signer,
    type: signature.type,
  });
}

export function formatSourceSnapshot(
  locale: SupportedLocale,
  sourcePacket: CmsSourcePacketV1 | undefined
): string | undefined {
  if (!sourcePacket) {
    return undefined;
  }

  return t(locale, "profileCms.provenance.sourceSnapshotValue", {
    date: formatCmsDate(locale, sourcePacket.captured_at),
    type: sourcePacket.source_type,
  });
}

export function createRendererContext(
  cmsPackage: CmsPackageV1,
  locale: SupportedLocale
): RendererContext {
  return {
    cmsPackage,
    locale,
    assetMap: new Map(
      cmsPackage.payload.assets.map((asset) => [asset.id, asset])
    ),
    pageMap: new Map(cmsPackage.payload.pages.map((page) => [page.id, page])),
    nftProfileMap: new Map(
      (cmsPackage.payload.nft_media_profiles ?? []).map((profile) => [
        profile.id,
        profile,
      ])
    ),
    deepZoomMap: new Map(
      (cmsPackage.payload.deep_zoom_manifests ?? []).map((manifest) => [
        manifest.id,
        manifest,
      ])
    ),
    roomMap: new Map(
      (cmsPackage.payload.exhibition_rooms ?? []).map((room) => [room.id, room])
    ),
    sourcePacketMap: new Map(
      (cmsPackage.payload.source_packets ?? []).map((sourcePacket) => [
        sourcePacket.id,
        sourcePacket,
      ])
    ),
  };
}

export function getNavigationHref(
  item: CmsNavigationItemV1,
  context: RendererContext
): string | null {
  if (item.page_id) {
    return getCmsPagePath(context.cmsPackage, item.page_id);
  }

  return resolveCmsUri(item.url, { allowRelative: true });
}

export function getAsset(
  context: RendererContext,
  assetId: string | null | undefined
): CmsAssetV1 | undefined {
  return assetId ? context.assetMap.get(assetId) : undefined;
}

export function resolveAssetUrl(
  asset: CmsAssetV1 | null | undefined
): string | null {
  return resolveCmsUri(asset?.uri);
}

export function isRenderableModelAsset(asset: CmsAssetV1): boolean {
  const mimeType = asset.mime_type.toLowerCase();
  return (
    asset.kind === "model" ||
    mimeType === "model/gltf-binary" ||
    mimeType === "model/gltf+json" ||
    asset.uri.toLowerCase().endsWith(".glb") ||
    asset.uri.toLowerCase().endsWith(".gltf")
  );
}

export function resolveTrustedEmbedAssetUrl(
  asset: CmsAssetV1 | null | undefined
): string | null {
  const url = resolveAssetUrl(asset);
  if (!url) {
    return null;
  }

  return hasTrustedMediaResolverOrigin(url) ? url : null;
}

function hasTrustedMediaResolverOrigin(value: string): boolean {
  try {
    return (
      new URL(value).origin ===
      new URL(publicEnv.MEDIA_RESOLVER_ENDPOINT).origin
    );
  } catch {
    return false;
  }
}

export function sanitizeSandboxPermissions(
  permissions: readonly string[] | undefined
): string {
  return (
    permissions
      ?.filter((permission) => SANDBOX_PERMISSION_ALLOWLIST.has(permission))
      .join(" ") ?? ""
  );
}

export function getString(
  record: Record<string, unknown> | null | undefined,
  key: string
): string | undefined {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function getNumber(
  record: Record<string, unknown> | null | undefined,
  key: string
): number | undefined {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function getRecord(
  record: Record<string, unknown>,
  key: string
): Record<string, unknown> | undefined {
  const value = record[key];
  return isRecord(value) ? value : undefined;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getStringArray(
  record: Record<string, unknown>,
  key: string
): string[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function formatCmsDate(locale: SupportedLocale, value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatLocalizedDate(locale, date, {
    dateStyle: "medium",
    timeZone: "UTC",
  });
}
