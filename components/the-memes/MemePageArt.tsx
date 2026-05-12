"use client";

import Download from "@/components/download/Download";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import type { IAttribute, MemesExtendedData, NFT } from "@/entities/INFT";
import {
  getAnimationDimensionsFromMetadata,
  getAnimationFileTypeFromMetadata,
  getImageDimensionsFromMetadata,
  getImageFileTypeFromMetadata,
} from "@/helpers/nft.helpers";
import {
  faBolt,
  faExternalLink,
  faLink,
  faPalette,
  faWaveSquare,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import type { ReactNode } from "react";

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

  return (
    <div className="tw-space-y-14 tw-pb-8 tw-pt-8">
      {mediaRows.length > 0 && (
        <AdditionalDetailsSection title="Arweave links" icon={faLink}>
          <div className="tw-divide-y tw-divide-iron-800">
            {mediaRows.map((row) => (
              <ArweaveLinkRow row={row} key={`${row.label}-${row.url}`} />
            ))}
          </div>
        </AdditionalDetailsSection>
      )}

      <AdditionalDetailsSection title="Properties" icon={faPalette}>
        {propertyAttributes.length > 0 ? (
          <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 2xl:tw-grid-cols-6">
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

      <div className="tw-grid tw-grid-cols-1 tw-gap-x-16 tw-gap-y-14 lg:tw-grid-cols-2">
        <AdditionalDetailsSection title="Stats" icon={faWaveSquare}>
          <div className="tw-grid tw-grid-cols-1 tw-gap-x-12 tw-gap-y-8 sm:tw-grid-cols-2">
            {statsRows.map((row) => (
              <MetricBlock key={row.key} label={row.label} value={row.value} />
            ))}
          </div>
        </AdditionalDetailsSection>

        <AdditionalDetailsSection title="Boosts" icon={faBolt}>
          {boostRows.length > 0 ? (
            <div className="tw-grid tw-grid-cols-1 tw-gap-x-12 tw-gap-y-8 sm:tw-grid-cols-2">
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
  readonly icon: IconDefinition;
  readonly children: ReactNode;
}) {
  return (
    <section>
      <div className="tw-mb-8 tw-flex tw-items-center tw-gap-4">
        <FontAwesomeIcon
          icon={icon}
          className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-400"
        />
        <h3 className="tw-mb-0 tw-whitespace-nowrap tw-text-lg tw-font-semibold tw-text-iron-100">
          {title}
        </h3>
        <div className="tw-h-px tw-min-w-10 tw-flex-1 tw-bg-iron-800" />
      </div>
      {children}
    </section>
  );
}

function ArweaveLinkRow({ row }: { readonly row: MediaRow }) {
  return (
    <div className="tw-grid tw-gap-x-6 tw-gap-y-2 tw-py-4 md:tw-grid-cols-[4rem_16rem_minmax(0,1fr)_auto] md:tw-items-center">
      <div className="tw-text-sm tw-font-semibold tw-uppercase tw-leading-5 tw-text-iron-500">
        {row.label}
      </div>
      <div className="tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
        {row.title}
      </div>
      <Link
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        className="tw-min-w-0 tw-truncate tw-font-mono tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400 tw-no-underline hover:tw-text-white"
      >
        {row.url}
      </Link>
      <div className="tw-flex tw-items-center tw-gap-4">
        <Link
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={row.openLabel}
          className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-400 tw-no-underline tw-transition-colors hover:tw-text-white"
        >
          Open
          <FontAwesomeIcon
            icon={faExternalLink}
            className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0"
          />
        </Link>
        {row.downloadName && (
          <Download
            href={row.url}
            name={row.downloadName}
            extension={row.extension ?? ""}
            variant="text"
            alwaysShowText={true}
          />
        )}
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
  return (
    <div className="tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-3">
      <div className="tw-truncate tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-400">
        {label}
      </div>
      <div
        title={String(value)}
        className="tw-mt-1 tw-truncate tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100"
      >
        {value}
      </div>
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
        className={`tw-mb-2 tw-text-sm tw-font-semibold tw-leading-5 ${
          highlightedLabel ? "tw-text-primary-400" : "tw-text-iron-400"
        }`}
      >
        {highlightedLabel && (
          <span className="tw-mr-2 tw-inline-block tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400" />
        )}
        {label}
      </div>
      <div className="tw-text-lg tw-font-semibold tw-leading-6 tw-text-white">
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
