"use client";

import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import {
  AdditionalDetailsSection,
  ArweaveLinkRow,
  EmptyDetailsState,
  MetadataCard,
  MetricBlock,
  type AdditionalDetailsMediaRow,
} from "@/components/the-memes/MemePageAdditionalDetails";
import type { IAttribute, LabNFT } from "@/entities/INFT";
import { parseNftDescriptionToHtml, printMintDate } from "@/helpers/Helpers";
import {
  getAnimationDimensionsFromMetadata,
  getAnimationFileTypeFromMetadata,
  getImageDimensionsFromMetadata,
  getImageFileTypeFromMetadata,
} from "@/helpers/nft.helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ChartBarIcon,
  ChevronDownIcon,
  LinkIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";
import { type ReactNode, useId, useState } from "react";

type MemeLabMediaMetadata = Parameters<typeof getImageFileTypeFromMetadata>[0];
type MemeLabMetadataLinks = {
  readonly image?: unknown;
  readonly animation?: unknown;
  readonly animation_url?: unknown;
};

const trimToEmpty = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

function getMemeLabMetadataAttributes(metadata: unknown): IAttribute[] {
  const attributes =
    metadata !== null && typeof metadata === "object"
      ? (metadata as { readonly attributes?: unknown }).attributes
      : undefined;

  if (!Array.isArray(attributes)) {
    return [];
  }

  return attributes.filter(
    (attribute): attribute is IAttribute =>
      attribute !== null &&
      typeof attribute === "object" &&
      typeof (attribute as { readonly trait_type?: unknown }).trait_type ===
        "string" &&
      (typeof (attribute as { readonly value?: unknown }).value === "string" ||
        typeof (attribute as { readonly value?: unknown }).value === "number")
  );
}

function getMemeLabMediaMetadata(metadata: unknown): MemeLabMediaMetadata {
  if (
    metadata === null ||
    metadata === undefined ||
    typeof metadata === "string"
  ) {
    return metadata;
  }

  if (typeof metadata === "object") {
    return metadata;
  }

  return undefined;
}

function getMemeLabMetadataLinks(metadata: unknown): MemeLabMetadataLinks {
  return metadata !== null && typeof metadata === "object" ? metadata : {};
}

function getFirstNonEmptyValue(values: readonly string[]): string {
  return values.find((value) => value.length > 0) ?? "";
}

function getMemeLabArweaveRows(nft: LabNFT): AdditionalDetailsMediaRow[] {
  const mediaMetadata = getMemeLabMediaMetadata(nft.metadata);
  const metadataLinks = getMemeLabMetadataLinks(nft.metadata);
  const imageFormat = getImageFileTypeFromMetadata(mediaMetadata);
  const animationFormat = getAnimationFileTypeFromMetadata(mediaMetadata);
  const metadataHref = trimToEmpty(nft.uri);
  const metadataImageHref = trimToEmpty(metadataLinks.image);
  const nftImageHref = trimToEmpty(nft.image);
  const metadataAnimationUrlHref = trimToEmpty(metadataLinks.animation_url);
  const metadataAnimationHref = trimToEmpty(metadataLinks.animation);
  const nftAnimationHref = trimToEmpty(nft.animation);
  const artImageHref = getFirstNonEmptyValue([metadataImageHref, nftImageHref]);
  const artAnimationHref = getFirstNonEmptyValue([
    metadataAnimationUrlHref,
    metadataAnimationHref,
    nftAnimationHref,
  ]);
  const nftName = trimToEmpty(nft.name);
  const artDownloadName = nftName.length > 0 ? nftName : `meme-lab-${nft.id}`;

  return [
    ...(metadataHref
      ? [
          {
            label: "JSON",
            title: "JSON Metadata",
            url: metadataHref,
            openLabel: "Open JSON in new tab",
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
            downloadName: artDownloadName,
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
            downloadName: artDownloadName,
          },
        ]
      : []),
  ];
}

function getMemeLabDetailRows(nft: LabNFT) {
  const mediaMetadata = getMemeLabMediaMetadata(nft.metadata);
  const hasAnimation = Boolean(getResolvedAnimationSrc(nft));
  const imageFormat = getImageFileTypeFromMetadata(mediaMetadata);
  const animationFormat = getAnimationFileTypeFromMetadata(mediaMetadata);
  const imageDimensions = getImageDimensionsFromMetadata(mediaMetadata);
  const animationDimensions = getAnimationDimensionsFromMetadata(mediaMetadata);
  const fileType = hasAnimation ? animationFormat : imageFormat;
  const dimensions = hasAnimation ? animationDimensions : imageDimensions;
  const fileMediaKind = hasAnimation ? "Animation" : "Image";
  const fileTypeLabel = fileType
    ? `${fileMediaKind} - ${fileType.toUpperCase()}`
    : "N/A";

  return [
    { key: "edition-size", label: "Edition size", value: nft.supply },
    { key: "collection", label: "Collection", value: nft.collection },
    {
      key: "mint-date",
      label: "Mint date",
      value: printMintDate(nft.mint_date),
    },
    { key: "file-type", label: "File type", value: fileTypeLabel },
    { key: "dimensions", label: "Dimensions", value: dimensions ?? "N/A" },
  ];
}

function MemeLabAdditionalDetailsAccordion({
  defaultOpen,
  children,
  locale,
}: {
  readonly defaultOpen: boolean;
  readonly children: ReactNode;
  readonly locale: SupportedLocale;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="tw-mt-4 tw-border-0 tw-border-y tw-border-solid tw-border-white/10">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((current) => !current)}
        className="tw-group tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-4 tw-border-0 tw-bg-transparent tw-px-0 tw-py-2.5 tw-text-left tw-text-iron-300 tw-transition-colors tw-duration-150 tw-ease-out hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none"
      >
        <span className="tw-text-sm tw-font-medium tw-text-iron-300 group-hover:tw-text-white sm:tw-text-base">
          {t(locale, "memeLab.detail.additionalDetails")}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500 tw-transition-transform tw-duration-200 tw-ease-out group-hover:tw-text-white motion-reduce:tw-transition-none ${
            isOpen ? "tw-rotate-180 tw-text-iron-100" : ""
          }`}
        />
      </button>
      <div
        id={panelId}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`tw-grid tw-transition-[grid-template-rows,opacity] tw-duration-200 tw-ease-out motion-reduce:tw-transition-none ${
          isOpen
            ? "tw-grid-rows-[1fr] tw-opacity-100"
            : "tw-grid-rows-[0fr] tw-opacity-0"
        }`}
      >
        <div
          tabIndex={isOpen ? undefined : -1}
          className={isOpen ? "tw-overflow-visible" : "tw-overflow-hidden"}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

function MemeLabCardDescription({ nft }: { readonly nft: LabNFT }) {
  return (
    <section className="tw-max-w-4xl tw-text-pretty tw-pb-4">
      <div
        className="tw-text-base tw-font-normal tw-text-iron-300"
        dangerouslySetInnerHTML={{
          __html: parseNftDescriptionToHtml(nft.description),
        }}
      />
    </section>
  );
}

function MemeLabAdditionalDetailsContent({ nft }: { readonly nft: LabNFT }) {
  const arweaveRows = getMemeLabArweaveRows(nft);
  const detailRows = getMemeLabDetailRows(nft);
  const attributes = getMemeLabMetadataAttributes(nft.metadata);

  return (
    <div className="tw-space-y-[34px] tw-pb-8 tw-pt-8 sm:tw-space-y-14">
      {arweaveRows.length > 0 && (
        <AdditionalDetailsSection title="Arweave links" icon={LinkIcon}>
          <div>
            {arweaveRows.map((row) => (
              <ArweaveLinkRow row={row} key={`${row.label}-${row.url}`} />
            ))}
          </div>
        </AdditionalDetailsSection>
      )}

      <AdditionalDetailsSection title="Card details" icon={ChartBarIcon}>
        <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-6 sm:tw-grid-cols-3 sm:tw-gap-x-12 sm:tw-gap-y-8 xl:tw-grid-cols-5">
          {detailRows.map((row) => (
            <MetricBlock key={row.key} label={row.label} value={row.value} />
          ))}
        </div>
      </AdditionalDetailsSection>

      <AdditionalDetailsSection title="Properties" icon={SwatchIcon}>
        {attributes.length > 0 ? (
          <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 lg:tw-grid-cols-4">
            {attributes.map((attribute) => (
              <MetadataCard
                key={`${attribute.trait_type}-${attribute.value}`}
                label={attribute.trait_type}
                value={attribute.value}
              />
            ))}
          </div>
        ) : (
          <EmptyDetailsState>No properties found.</EmptyDetailsState>
        )}
      </AdditionalDetailsSection>
    </div>
  );
}

export function MemeLabOverviewDetails({
  nft,
  defaultAdditionalDetailsOpen,
  locale,
}: {
  readonly nft: LabNFT;
  readonly defaultAdditionalDetailsOpen: boolean;
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <MemeLabCardDescription nft={nft} />
      <MemeLabAdditionalDetailsAccordion
        key={defaultAdditionalDetailsOpen ? "details-open" : "details-closed"}
        defaultOpen={defaultAdditionalDetailsOpen}
        locale={locale}
      >
        <MemeLabAdditionalDetailsContent nft={nft} />
      </MemeLabAdditionalDetailsAccordion>
    </>
  );
}
