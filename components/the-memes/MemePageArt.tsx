"use client";

import Download from "@/components/download/Download";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import type { IAttribute, MemesExtendedData, NFT } from "@/entities/INFT";
import { numberWithCommas } from "@/helpers/Helpers";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import {
  getAnimationDimensionsFromMetadata,
  getAnimationFileTypeFromMetadata,
  getImageDimensionsFromMetadata,
  getImageFileTypeFromMetadata,
} from "@/helpers/nft.helpers";
import {
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  ChartBarIcon,
  ChartBarSquareIcon,
  LinkIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { Tooltip } from "react-tooltip";

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

type MediaRow = {
  readonly label: string;
  readonly title: string;
  readonly url: string;
  readonly openLabel: string;
  readonly extension?: string | undefined;
  readonly downloadName?: string | undefined;
};

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
  nftMeta: MemesExtendedData | undefined;
}) {
  if (!props.show || !props.nft || !props.nftMeta) {
    return <></>;
  }

  const { nft, nftMeta } = props;
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
            label: "JSON",
            title: "JSON Metadata",
            url: metadataHref,
            openLabel: "Open raw metadata in new tab",
          },
        ]
      : []),
    ...(artImageHref
      ? [
          {
            label: imageFormat?.toUpperCase() ?? "IMAGE",
            title: "Image Asset",
            url: artImageHref,
            openLabel: "Open image in new tab",
            extension: imageFormat ?? "",
            downloadName: nft.name,
          },
        ]
      : []),
    ...(artAnimationHref
      ? [
          {
            label: animationFormat?.toUpperCase() ?? "ANIMATION",
            title: "Animation Asset",
            url: artAnimationHref,
            openLabel: "Open animation in new tab",
            extension: animationFormat ?? "",
            downloadName: nft.name,
          },
        ]
      : []),
  ];

  const detailRows = [
    {
      key: "meme",
      label: "Meme name",
      value: nftMeta.meme_name,
    },
    {
      key: "collection",
      label: "Collection",
      value: nft.collection,
    },
    {
      key: "dimensions",
      label: "Dimensions",
      value: dimensions ?? "N/A",
    },
  ];

  const propertyAttributes = attributes.filter(shouldShowPropertyAttribute);
  const statsRows = [
    ...detailRows,
    {
      key: "season",
      label: "Season",
      value: getAttributeValue(attributes, "Type - Season"),
    },
    {
      key: "meme-number",
      label: "Meme",
      value: getAttributeValue(attributes, "Type - Meme"),
    },
    {
      key: "card-number",
      label: "Card number",
      value: getAttributeValue(attributes, "Type - Card"),
    },
  ];
  const boostRows = attributes.filter(
    (attribute) => attribute.display_type === "boost_percentage"
  );
  const tdhRows = [
    {
      key: "tdh",
      label: "TDH",
      value: numberWithCommas(Math.round(nft.boosted_tdh * 100) / 100),
      highlightedLabel: true,
    },
    {
      key: "unweighted-tdh",
      label: "Unweighted TDH",
      value: numberWithCommas(Math.round(nft.tdh__raw * 100) / 100),
    },
    {
      key: "meme-rank",
      label: "Meme Rank",
      value: nft.tdh_rank ? `#${numberWithCommas(nft.tdh_rank)}` : "-",
    },
  ];

  return (
    <div className="tw-space-y-14 tw-pb-8 tw-pt-8">
      {mediaRows.length > 0 && (
        <AdditionalDetailsSection title="Arweave links" icon={LinkIcon}>
          <div>
            {mediaRows.map((row) => (
              <ArweaveLinkRow row={row} key={`${row.label}-${row.url}`} />
            ))}
          </div>
        </AdditionalDetailsSection>
      )}

      <AdditionalDetailsSection title="Properties" icon={SwatchIcon}>
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
          <EmptyDetailsState>No properties found.</EmptyDetailsState>
        )}
      </AdditionalDetailsSection>

      <AdditionalDetailsSection
        title="TDH breakdown"
        icon={ChartBarSquareIcon}
      >
        <div className="tw-flex tw-flex-wrap tw-gap-x-10 tw-gap-y-6 sm:tw-gap-x-16">
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
        <AdditionalDetailsSection title="Stats" icon={ChartBarIcon}>
          <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-6 sm:tw-gap-x-12 sm:tw-gap-y-8">
            {statsRows.map((row) => (
              <MetricBlock key={row.key} label={row.label} value={row.value} />
            ))}
          </div>
        </AdditionalDetailsSection>

        <AdditionalDetailsSection title="Boosts" icon={BoltIcon}>
          {boostRows.length > 0 ? (
            <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-6 sm:tw-gap-x-12 sm:tw-gap-y-8">
              {boostRows.map((attribute) => (
                <MetricBlock
                  key={attribute.trait_type}
                  label={attribute.trait_type}
                  value={`${Number(attribute.value) > 0 ? "+" : ""}${
                    attribute.value
                  }%`}
                  highlightedLabel={Number(attribute.value) > 0}
                />
              ))}
            </div>
          ) : (
            <EmptyDetailsState>No boosts found.</EmptyDetailsState>
          )}
        </AdditionalDetailsSection>
      </div>
    </div>
  );
}

function AdditionalDetailsSection({
  title,
  icon,
  children,
}: {
  readonly title: string;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly children: ReactNode;
}) {
  const Icon = icon;

  return (
    <section className="tw-space-y-6">
      <div className="tw-mb-2 tw-flex tw-items-center tw-gap-3">
        <Icon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500" />
        <h3 className="tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
          {title}
        </h3>
        <div className="tw-h-px tw-min-w-10 tw-flex-grow tw-bg-gradient-to-r tw-from-iron-700 tw-to-transparent" />
      </div>
      {children}
    </section>
  );
}

function ArweaveLinkRow({ row }: { readonly row: MediaRow }) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-3 last:tw-border-b-0 md:tw-flex-row md:tw-items-center md:tw-gap-6">
      <div className="tw-w-16 tw-shrink-0 tw-text-sm tw-font-semibold tw-uppercase tw-leading-5 tw-text-iron-500">
        {row.label}
      </div>
      <div className="tw-w-64 tw-shrink-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
        {row.title}
      </div>
      <Link
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        className="tw-min-w-0 tw-truncate tw-font-mono tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400 tw-no-underline hover:tw-text-iron-100 md:tw-flex-1"
      >
        {row.url}
      </Link>
      <div className="tw-flex tw-w-full tw-items-center tw-justify-start tw-gap-4 md:tw-ml-auto md:tw-w-auto md:tw-shrink-0 md:tw-justify-end">
        {row.downloadName && (
          <Download
            href={row.url}
            name={row.downloadName}
            extension={row.extension ?? ""}
            variant="text"
            alwaysShowText={true}
          />
        )}
        <Link
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={row.openLabel}
          className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-text-iron-500 tw-no-underline tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-100"
        >
          Open
          <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
}

function MetadataCard({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | number;
}) {
  const displayValue = String(value);
  const tooltipId = buildTooltipId("meme-property", label, displayValue);

  return (
    <div className="tw-flex tw-min-w-24 tw-flex-1 tw-flex-col tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-3 tw-py-2">
      <span className="tw-mb-1 tw-block tw-truncate tw-text-xs tw-font-normal tw-uppercase tw-leading-4 tw-tracking-wide tw-text-iron-500">
        {label}
      </span>
      <span
        className="tw-truncate tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-200"
        data-tooltip-id={tooltipId}
      >
        {displayValue}
      </span>
      <Tooltip
        id={tooltipId}
        place="top"
        offset={8}
        opacity={1}
        style={TOOLTIP_STYLES}
      >
        <span className="tw-text-xs">{displayValue}</span>
      </Tooltip>
    </div>
  );
}

function MetricBlock({
  label,
  value,
  highlightedLabel = false,
}: {
  readonly label: string;
  readonly value: string | number;
  readonly highlightedLabel?: boolean | undefined;
}) {
  return (
    <div>
      <div
        className={`tw-mb-1 tw-text-sm tw-font-semibold tw-leading-5 md:tw-mb-2 ${
          highlightedLabel ? "tw-text-primary-400" : "tw-text-iron-400"
        }`}
      >
        {highlightedLabel && (
          <span className="tw-mr-2 tw-inline-block tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400" />
        )}
        {label}
      </div>
      <div className="tw-text-sm tw-font-semibold tw-leading-5 tw-text-white md:tw-text-lg md:tw-leading-6">
        {value}
      </div>
    </div>
  );
}

function EmptyDetailsState({ children }: { readonly children: ReactNode }) {
  return (
    <div className="tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-500">
      {children}
    </div>
  );
}

function getAttributeValue(
  attributes: readonly IAttribute[],
  traitType: string
) {
  return (
    attributes.find((attribute) => attribute.trait_type === traitType)?.value ??
    "N/A"
  );
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
