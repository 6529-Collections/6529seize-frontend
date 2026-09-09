import Link from "next/link";
import { MuseumProposalImage } from "@/components/museum/MuseumProposalImage";
import { MuseumPublicMediaFigure } from "@/components/museum/MuseumPublicMediaFigure";
import { MuseumReviewedProgramMediaFigure } from "@/components/museum/MuseumReviewedProgramMediaFigure";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { findReviewedProgramMediaMatch } from "@/lib/museum/normalize";
import { buildMuseumSignedWaveStormDropUrl } from "@/lib/museum/publication";
import {
  museumMediaResponsiveImage,
  selectMuseumStillMedia,
} from "@/lib/museum/publication/mediaSelection";
import { MUSEUM_MAGNUM_ACQUISITION_ID } from "@/lib/museum/publication/collectionSemantics";
import { museumWorkHref } from "@/lib/museum/publication/routes";
import type { MuseumPublicWork } from "@/lib/museum/publication/types";
import type { MuseumView } from "@/lib/museum/types";

interface TypedArtistWorkCardProps {
  readonly index: number;
  readonly relationshipLabel: (work: MuseumPublicWork) => string;
  readonly view: MuseumView | null;
  readonly work: MuseumPublicWork;
}

export function TypedArtistWorkCard({
  index,
  relationshipLabel,
  view,
  work,
}: TypedArtistWorkCardProps) {
  const media = selectMuseumStillMedia(work.media);
  const programMediaMatch =
    media === undefined
      ? findReviewedProgramMediaMatch(view, [
          work.id,
          ...(work.sourceRecordIds ?? []),
        ])
      : null;
  const presentation = work.presentationMedia?.[0];
  if (media !== undefined) {
    const responsive = museumMediaResponsiveImage(media);
    const altText = media.altText;
    if (altText === null || altText.trim() === "") {
      throw new Error("museum_artist_work_alt_text_missing");
    }
    return (
      <MuseumPublicMediaFigure
        key={work.id}
        src={responsive.src}
        {...(responsive.srcSet === undefined
          ? {}
          : { srcSet: responsive.srcSet })}
        width={media.width}
        height={media.height}
        alt={altText}
        href={museumWorkHref(work.id)}
        title={work.title}
        byline={relationshipLabel(work)}
        eager={index === 0}
      />
    );
  }
  if (programMediaMatch !== null) {
    const metadata = work.mediaMetadata?.find((candidate) =>
      candidate.sourceRecordIds?.includes(programMediaMatch.sourceRecordId)
    );
    return (
      <MuseumReviewedProgramMediaFigure
        key={work.id}
        media={programMediaMatch.media}
        metadata={metadata}
        sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
        eager={index === 0}
      >
        <Link
          href={museumWorkHref(work.id)}
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {work.title}
        </Link>
        <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
          {relationshipLabel(work)}
        </span>
      </MuseumReviewedProgramMediaFigure>
    );
  }
  if (presentation !== undefined) {
    const sourceHref = buildMuseumSignedWaveStormDropUrl(
      presentation.source.waveId,
      presentation.source.dropId
    );
    const canOpenPresentation = presentation.affordances.includes(
      "open_upstream_presentation"
    );
    return (
      <figure key={work.id} className="tw-m-0 tw-min-w-0">
        <div className="tw-group tw-block">
          <div className="tw-aspect-square tw-overflow-hidden tw-bg-black">
            <MuseumProposalImage
              src={presentation.mediaUrl}
              alt={presentation.altText}
              width={presentation.width}
              height={presentation.height}
              sourceByteSize={presentation.sourceByteSize}
              variants={presentation.variants}
              {...(sourceHref === null || !canOpenPresentation
                ? {}
                : {
                    sourceHref,
                    sourceLabel: t(
                      DEFAULT_LOCALE,
                      "museum.network.acquisitions.openPresentation"
                    ),
                  })}
              className="tw-block tw-h-full tw-w-full tw-object-contain"
              eager={index === 0}
            />
          </div>
        </div>
        <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
          <Link
            href={museumWorkHref(work.id)}
            className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {work.title}
          </Link>
          <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
            {relationshipLabel(work)}
          </span>
          <span className="tw-mt-2 tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
            {presentation.credit.creditLine} ·{" "}
            {t(
              DEFAULT_LOCALE,
              presentation.source.contextEntityId ===
                MUSEUM_MAGNUM_ACQUISITION_ID
                ? "museum.network.rights.magnumInstitutionalDisplayCaption"
                : "museum.network.acquisitions.presentationRights"
            )}
          </span>
        </figcaption>
      </figure>
    );
  }
  return (
    <p
      key={work.id}
      className="tw-m-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4"
    >
      <Link
        href={museumWorkHref(work.id)}
        className="tw-text-primary-300 tw-underline tw-underline-offset-4"
      >
        {work.title}
      </Link>
    </p>
  );
}
