import type {
  CmsAssetV1,
  CmsPackageV1,
  CmsPageV1,
} from "@/lib/profile-cms/protocol/v1";
import type {
  CmsArtInspectionItem,
  CmsArtInspectionMetadata,
} from "@/components/profile-cms/CmsArtLightbox";
import type { SupportedLocale } from "@/i18n/locales";

export type CmsNftMediaProfileV1 = NonNullable<
  CmsPackageV1["payload"]["nft_media_profiles"]
>[number];
export type CmsDeepZoomManifestV1 = NonNullable<
  CmsPackageV1["payload"]["deep_zoom_manifests"]
>[number];
export type CmsExhibitionRoomV1 = NonNullable<
  CmsPackageV1["payload"]["exhibition_rooms"]
>[number];
export type CmsSourcePacketV1 = NonNullable<
  CmsPackageV1["payload"]["source_packets"]
>[number];
export type CmsDisplayVariantV1 =
  CmsNftMediaProfileV1["display_variants"][number];
export type CmsPackageSignatureV1 = CmsPackageV1["signatures"][number];

export type NftTrait = {
  readonly label: string;
  readonly value: string;
};

export type PagePreviewCard = {
  readonly page: CmsPageV1;
  readonly href: string;
  readonly item?: CmsArtInspectionItem | undefined;
};

export type ReferenceMetadataItem = {
  readonly label: string;
  readonly value: string;
};

export type LabelValueRow = {
  readonly label: string;
  readonly value: string | undefined;
  readonly href?: string | undefined;
};

export type RendererContext = {
  readonly cmsPackage: CmsPackageV1;
  readonly assetMap: Map<string, CmsAssetV1>;
  readonly pageMap: Map<string, CmsPageV1>;
  readonly nftProfileMap: Map<string, CmsNftMediaProfileV1>;
  readonly deepZoomMap: Map<string, CmsDeepZoomManifestV1>;
  readonly roomMap: Map<string, CmsExhibitionRoomV1>;
  readonly sourcePacketMap: Map<string, CmsSourcePacketV1>;
  readonly locale: SupportedLocale;
};

export const EMPTY_ART_METADATA: readonly CmsArtInspectionMetadata[] = [];
export const EMPTY_REFERENCE_METADATA: readonly ReferenceMetadataItem[] = [];
