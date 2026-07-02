"use client";

import {
  AdditionalDetailsSection,
  ArweaveLinkRow,
  EmptyDetailsState,
  MetadataCard,
  MetricBlock,
  type AdditionalDetailsMediaRow,
} from "@/components/the-memes/MemePageAdditionalDetails";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import type { IAttribute, NFT } from "@/entities/INFT";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import {
  getAnimationDimensionsFromMetadata,
  getAnimationFileTypeFromMetadata,
  getImageDimensionsFromMetadata,
  getImageFileTypeFromMetadata,
} from "@/helpers/nft.helpers";
import { formatInteger, formatNumber, roundTo } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  BoltIcon,
  ChartBarIcon,
  ChartBarSquareIcon,
  LinkIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";

const PROPERTY_EXCLUDED_TRAITS = new Set([
  "Type - Season",
  "Type - Meme",
  "Type - Card",
]);

function shouldShowPropertyAttribute(attribute: IAttribute): boolean {
  const displayType = attribute.display_type?.trim().toLowerCase();

  return (
    !PROPERTY_EXCLUDED_TRAITS.has(attribute.trait_type) &&
    (!displayType || displayType === "text")
  );
}

type MediaRow = AdditionalDetailsMediaRow;

type MediaMetadata = {
  readonly animation_details?: {
    readonly format?: string | null | undefined;
    readonly width?: number | null | undefined;
    readonly height?: number | null | undefined;
  } | null;
  readonly image_details?: {
    readonly format?: string | null | undefined;
    readonly width?: number | null | undefined;
    readonly height?: number | null | undefined;
  } | null;
};

type MemeMetadata = MediaMetadata & {
  readonly image?: unknown;
  readonly animation?: unknown;
  readonly animation_url?: unknown;
  readonly attributes?: unknown;
};

export function MemePageArt(props: {
  show: boolean;
  nft: NFT | undefined;
  nftMeta: ApiMemesExtendedData | undefined;
  locale?: SupportedLocale;
}) {
  if (!props.show || !props.nft || !props.nftMeta) {
    return <></>;
  }

  const { nft, nftMeta } = props;
  const locale = props.locale ?? DEFAULT_LOCALE;
  const unavailableValue = t(locale, "theMemes.detail.art.values.notAvailable");
  const downloadLabels = {
    cancelDownload: t(locale, "theMemes.detail.art.download.cancelDownload"),
    complete: t(locale, "theMemes.detail.art.download.complete"),
    dismissComplete: t(locale, "theMemes.detail.art.download.dismissComplete"),
    download: t(locale, "theMemes.detail.art.download.download"),
    downloadComplete: t(
      locale,
      "theMemes.detail.art.download.downloadComplete"
    ),
    downloadFile: t(locale, "theMemes.detail.art.download.downloadFile"),
    downloading: t(locale, "theMemes.detail.art.download.downloading"),
    downloadingFile: t(locale, "theMemes.detail.art.download.downloadingFile"),
    downloadingProgress: (percentage: number) =>
      t(locale, "theMemes.detail.art.download.downloadingProgress", {
        percentage: formatInteger(locale, percentage),
      }),
  };
  const animationHref = getResolvedAnimationSrc(nft);
  const hasAnimation = Boolean(animationHref);
  const rawMetadata: unknown = nft.metadata;
  const mediaMetadata = getMediaMetadata(rawMetadata);
  const metadata = getMetadataObject(rawMetadata);
  const imageFormat = getImageFileTypeFromMetadata(mediaMetadata);
  const animationFormat = getAnimationFileTypeFromMetadata(mediaMetadata);
  const imageDimensions = getImageDimensionsFromMetadata(mediaMetadata);
  const animationDimensions = getAnimationDimensionsFromMetadata(mediaMetadata);
  const metadataHref = nft.uri.trim();
  const attributes = Array.isArray(metadata?.attributes)
    ? metadata.attributes.filter(isAttribute)
    : [];
  const artImageHref = firstNonEmpty([
    typeof metadata?.image === "string" ? metadata.image : undefined,
    nft.image,
  ]);
  const artAnimationHref = firstNonEmpty([
    typeof metadata?.animation_url === "string"
      ? metadata.animation_url
      : undefined,
    typeof metadata?.animation === "string" ? metadata.animation : undefined,
    nft.animation,
  ]);
  const dimensions = hasAnimation ? animationDimensions : imageDimensions;
  const mediaRows: MediaRow[] = [
    ...(metadataHref
      ? [
          {
            label: t(locale, "theMemes.detail.art.links.jsonLabel"),
            title: t(locale, "theMemes.detail.art.links.jsonTitle"),
            url: metadataHref,
            openLabel: t(locale, "theMemes.detail.art.links.openRawMetadata"),
            openText: t(locale, "theMemes.detail.art.links.open"),
          },
        ]
      : []),
    ...(artImageHref
      ? [
          {
            label:
              imageFormat?.toUpperCase() ??
              t(locale, "theMemes.detail.art.links.imageFallbackLabel"),
            title: t(locale, "theMemes.detail.art.links.imageTitle"),
            url: artImageHref,
            openLabel: t(locale, "theMemes.detail.art.links.openImage"),
            openText: t(locale, "theMemes.detail.art.links.open"),
            extension: imageFormat ?? "",
            downloadName: nft.name,
            downloadLabels,
          },
        ]
      : []),
    ...(artAnimationHref
      ? [
          {
            label:
              animationFormat?.toUpperCase() ??
              t(locale, "theMemes.detail.art.links.animationFallbackLabel"),
            title: t(locale, "theMemes.detail.art.links.animationTitle"),
            url: artAnimationHref,
            openLabel: t(locale, "theMemes.detail.art.links.openAnimation"),
            openText: t(locale, "theMemes.detail.art.links.open"),
            extension: animationFormat ?? "",
            downloadName: nft.name,
            downloadLabels,
          },
        ]
      : []),
  ];

  const detailRows = [
    {
      key: "meme",
      label: t(locale, "theMemes.detail.art.fields.memeName"),
      value: nftMeta.meme_name,
    },
    {
      key: "collection",
      label: t(locale, "theMemes.detail.art.fields.collection"),
      value: nft.collection,
    },
    {
      key: "dimensions",
      label: t(locale, "theMemes.detail.art.fields.dimensions"),
      value: dimensions ?? unavailableValue,
    },
  ];

  const propertyAttributes = attributes.filter(shouldShowPropertyAttribute);
  const statsRows = [
    ...detailRows,
    {
      key: "season",
      label: t(locale, "theMemes.detail.art.fields.season"),
      value: getAttributeValue(attributes, "Type - Season", unavailableValue),
    },
    {
      key: "meme-number",
      label: t(locale, "theMemes.detail.art.fields.meme"),
      value: getAttributeValue(attributes, "Type - Meme", unavailableValue),
    },
    {
      key: "card-number",
      label: t(locale, "theMemes.detail.art.fields.cardNumber"),
      value: getAttributeValue(attributes, "Type - Card", unavailableValue),
    },
  ];
  const boostRows = attributes.filter(
    (attribute) => attribute.display_type === "boost_percentage"
  );
  const tdhRows = [
    {
      key: "tdh",
      label: t(locale, "theMemes.detail.art.fields.tdh"),
      value: formatNumber(locale, roundTo(nft.boosted_tdh, 2), {
        maximumFractionDigits: 2,
      }),
      highlightedLabel: true,
    },
    {
      key: "unweighted-tdh",
      label: t(locale, "theMemes.detail.art.fields.unweightedTdh"),
      value: formatNumber(locale, roundTo(nft.tdh__raw, 2), {
        maximumFractionDigits: 2,
      }),
    },
    {
      key: "meme-rank",
      label: t(locale, "theMemes.detail.art.fields.memeRank"),
      value: nft.tdh_rank
        ? t(locale, "theMemes.detail.art.values.rank", {
            rank: formatInteger(locale, nft.tdh_rank),
          })
        : unavailableValue,
    },
  ];

  return (
    <div className="tw-space-y-14 tw-pb-8 tw-pt-8">
      {mediaRows.length > 0 && (
        <AdditionalDetailsSection
          title={t(locale, "theMemes.detail.art.sections.arweaveLinks")}
          icon={LinkIcon}
        >
          <div>
            {mediaRows.map((row) => (
              <ArweaveLinkRow row={row} key={`${row.label}-${row.url}`} />
            ))}
          </div>
        </AdditionalDetailsSection>
      )}

      <AdditionalDetailsSection
        title={t(locale, "theMemes.detail.art.sections.properties")}
        icon={SwatchIcon}
      >
        {propertyAttributes.length > 0 ? (
          <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 lg:tw-grid-cols-4">
            {propertyAttributes.map((attribute) => (
              <MetadataCard
                key={attribute.trait_type}
                label={attribute.trait_type}
                value={attribute.value}
              />
            ))}
          </div>
        ) : (
          <EmptyDetailsState>
            {t(locale, "theMemes.detail.art.empty.noProperties")}
          </EmptyDetailsState>
        )}
      </AdditionalDetailsSection>

      <AdditionalDetailsSection
        title={t(locale, "theMemes.detail.art.sections.tdhBreakdown")}
        icon={ChartBarSquareIcon}
      >
        <div className="tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-6 sm:tw-gap-x-16">
          {tdhRows.map((row) => (
            <MetricBlock
              key={row.key}
              label={row.label}
              value={row.value}
              highlightedLabel={row.highlightedLabel}
            />
          ))}
        </div>
      </AdditionalDetailsSection>

      <div className="tw-grid tw-grid-cols-1 tw-gap-x-16 tw-gap-y-14 lg:tw-grid-cols-2">
        <AdditionalDetailsSection
          title={t(locale, "theMemes.detail.art.sections.stats")}
          icon={ChartBarIcon}
        >
          <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-6 sm:tw-gap-x-12 sm:tw-gap-y-8">
            {statsRows.map((row) => (
              <MetricBlock key={row.key} label={row.label} value={row.value} />
            ))}
          </div>
        </AdditionalDetailsSection>

        <AdditionalDetailsSection
          title={t(locale, "theMemes.detail.art.sections.boosts")}
          icon={BoltIcon}
        >
          {boostRows.length > 0 ? (
            <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-6 sm:tw-gap-x-12 sm:tw-gap-y-8">
              {boostRows.map((attribute) => (
                <MetricBlock
                  key={attribute.trait_type}
                  label={attribute.trait_type}
                  value={formatBoostValue(locale, attribute.value)}
                  highlightedLabel={Number(attribute.value) > 0}
                />
              ))}
            </div>
          ) : (
            <EmptyDetailsState>
              {t(locale, "theMemes.detail.art.empty.noBoosts")}
            </EmptyDetailsState>
          )}
        </AdditionalDetailsSection>
      </div>
    </div>
  );
}

function getAttributeValue(
  attributes: readonly IAttribute[],
  traitType: string,
  fallback: string
) {
  return (
    attributes.find((attribute) => attribute.trait_type === traitType)?.value ??
    fallback
  );
}

function formatBoostValue(locale: SupportedLocale, value: string | number) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return t(locale, "theMemes.detail.art.values.boostPercent", {
    sign: numericValue > 0 ? "+" : "",
    value: formatNumber(locale, numericValue, { maximumFractionDigits: 2 }),
  });
}

function isAttribute(value: unknown): value is IAttribute {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { readonly trait_type?: unknown }).trait_type === "string"
  );
}

function getMediaMetadata(
  metadata: unknown
): MediaMetadata | string | null | undefined {
  if (
    typeof metadata === "string" ||
    metadata === null ||
    metadata === undefined
  ) {
    return metadata;
  }

  if (typeof metadata === "object") {
    return metadata as MediaMetadata;
  }

  return undefined;
}

function getMetadataObject(metadata: unknown): MemeMetadata | undefined {
  return metadata !== null && typeof metadata === "object"
    ? (metadata as MemeMetadata)
    : undefined;
}

function firstNonEmpty(values: readonly (string | null | undefined)[]) {
  for (const value of values) {
    const trimmedValue = value?.trim();
    if (trimmedValue) {
      return trimmedValue;
    }
  }

  return "";
}
