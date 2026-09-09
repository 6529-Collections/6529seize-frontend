import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { buildMuseumSignedWaveStormDropUrl } from "@/lib/museum/publication";
import {
  museumMediaResponsiveImage,
  selectMuseumStillMedia,
} from "@/lib/museum/publication/mediaSelection";
import {
  museumArtistHref,
  museumWorkHref,
} from "@/lib/museum/publication/routes";
import { MuseumManagedImage } from "@/components/museum/MuseumManagedImage";
import { MuseumMediaMetadataPlaceholder } from "@/components/museum/MuseumMediaMetadataPlaceholder";
import { MuseumProposalImage } from "@/components/museum/MuseumProposalImage";
import { MuseumStatusBadge } from "@/components/museum/MuseumShell";
import type {
  MuseumDirectoryArtistRecord,
  MuseumDirectoryWorkRecord,
} from "./MuseumDirectoryData";
import { museumDirectoryStatusText } from "./MuseumDirectoryData";

type MuseumDirectoryMediaStageShape = "source" | "artist";

function hasMuseumDirectoryMediaDimensions(
  width: number | null,
  height: number | null
): boolean {
  return width !== null && height !== null && width > 0 && height > 0;
}

function museumDirectoryMediaStageStyle(
  shape: MuseumDirectoryMediaStageShape,
  width: number | null,
  height: number | null
): { readonly aspectRatio: string } | undefined {
  if (shape === "artist" || !hasMuseumDirectoryMediaDimensions(width, height)) {
    return undefined;
  }
  return { aspectRatio: `${String(width)} / ${String(height)}` };
}

function museumDirectoryMediaStageClassName(
  shape: MuseumDirectoryMediaStageShape,
  width: number | null,
  height: number | null
): string {
  let aspectClassName = "";
  if (shape === "artist") {
    aspectClassName = "tw-aspect-[4/3]";
  } else if (!hasMuseumDirectoryMediaDimensions(width, height)) {
    aspectClassName = "tw-aspect-square";
  }
  return [
    "tw-flex tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-iron-950",
    shape === "artist"
      ? "tw-border tw-border-solid tw-border-iron-800 tw-p-3 sm:tw-p-4"
      : "",
    aspectClassName,
  ]
    .filter(Boolean)
    .join(" ");
}

function MuseumDirectoryEmptyStage({
  shape,
}: {
  readonly shape: MuseumDirectoryMediaStageShape;
}) {
  return (
    <div
      className={`tw-flex tw-items-center tw-justify-center tw-bg-iron-950 tw-p-8 tw-text-center tw-text-sm tw-leading-6 tw-text-iron-500 ${
        shape === "artist" ? "tw-aspect-[4/3]" : "tw-aspect-square"
      }`}
      data-testid="museum-directory-media-stage"
    >
      {t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
    </div>
  );
}

function MuseumDirectoryMediaStage({
  record,
  eager = false,
  shape = "source",
}: {
  readonly record: MuseumDirectoryWorkRecord | null;
  readonly eager?: boolean;
  readonly shape?: MuseumDirectoryMediaStageShape;
}) {
  if (record === null) return <MuseumDirectoryEmptyStage shape={shape} />;

  const retained = selectMuseumStillMedia(record.work.media);
  if (retained !== undefined) {
    const responsive = museumMediaResponsiveImage(retained);
    return (
      <div
        className={museumDirectoryMediaStageClassName(
          shape,
          retained.width,
          retained.height
        )}
        style={museumDirectoryMediaStageStyle(
          shape,
          retained.width,
          retained.height
        )}
        data-testid="museum-directory-media-stage"
      >
        <MuseumManagedImage
          src={responsive.src}
          {...(responsive.srcSet === undefined
            ? {}
            : { srcSet: responsive.srcSet })}
          {...(retained.width === null ? {} : { width: retained.width })}
          {...(retained.height === null ? {} : { height: retained.height })}
          alt={retained.altText ?? record.work.title}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
          failureMessage={t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
          retryLabel={t(DEFAULT_LOCALE, "museum.network.media.retry")}
          className="tw-h-full tw-w-full tw-object-contain tw-transition-transform tw-duration-300 group-hover:tw-scale-[1.01] motion-reduce:tw-transition-none"
        />
      </div>
    );
  }

  const presentation = record.work.presentationMedia?.[0];
  if (presentation !== undefined) {
    const sourceHref = buildMuseumSignedWaveStormDropUrl(
      presentation.source.waveId,
      presentation.source.dropId
    );
    const canOpenPresentation = presentation.affordances.includes(
      "open_upstream_presentation"
    );
    return (
      <div
        className={museumDirectoryMediaStageClassName(
          shape,
          presentation.width,
          presentation.height
        )}
        style={museumDirectoryMediaStageStyle(
          shape,
          presentation.width,
          presentation.height
        )}
        data-testid="museum-directory-media-stage"
      >
        <MuseumProposalImage
          src={presentation.mediaUrl}
          alt={presentation.altText}
          width={presentation.width}
          height={presentation.height}
          sourceByteSize={presentation.sourceByteSize}
          variants={presentation.variants}
          eager={eager}
          {...(sourceHref === null || !canOpenPresentation
            ? {}
            : {
                sourceHref,
                sourceLabel: t(
                  DEFAULT_LOCALE,
                  "museum.network.acquisitions.openPresentation"
                ),
              })}
          containerClassName="tw-h-full tw-w-full"
          className="tw-block tw-h-full tw-w-full tw-object-contain"
        />
      </div>
    );
  }

  const metadata = record.work.mediaMetadata?.[0];
  if (metadata !== undefined) {
    return (
      <div
        className={`${
          shape === "artist" ? "tw-aspect-[4/3]" : "tw-aspect-square"
        } tw-w-full tw-overflow-hidden tw-bg-black`}
        data-testid="museum-directory-media-stage"
      >
        <MuseumMediaMetadataPlaceholder
          title={record.work.title}
          metadata={metadata}
        />
      </div>
    );
  }

  return <MuseumDirectoryEmptyStage shape={shape} />;
}

export function MuseumDirectoryWorkCard({
  record,
  eager = false,
}: {
  readonly record: MuseumDirectoryWorkRecord;
  readonly eager?: boolean;
}) {
  const href = museumWorkHref(record.work.id);
  return (
    <article className="tw-group tw-min-w-0">
      <MuseumDirectoryMediaStage record={record} eager={eager} />
      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
        <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
          <h3 className="tw-m-0 tw-min-w-0 tw-text-base tw-font-semibold tw-text-iron-50">
            <Link
              href={href}
              className="hover:tw-text-primary-200 tw-text-inherit tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {record.work.title}
            </Link>
          </h3>
          <MuseumStatusBadge
            label={
              record.section === "permanent_collection"
                ? t(DEFAULT_LOCALE, "museum.network.collection.eyebrow")
                : t(DEFAULT_LOCALE, "museum.network.acquisitions.eyebrow")
            }
            tone={
              record.section === "permanent_collection" ? "success" : "warning"
            }
          />
        </div>
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {record.artist === null ? (
            record.artistName
          ) : (
            <Link
              href={museumArtistHref(record.artist.slug)}
              className="hover:tw-text-primary-200 tw-text-inherit tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {record.artistName}
            </Link>
          )}
        </p>
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
          {museumDirectoryStatusText(record)}
        </p>
        {record.work.medium ? (
          <p className="tw-m-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-500">
            {record.work.medium}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function MuseumDirectoryArtistCard({
  record,
  eager = false,
}: {
  readonly record: MuseumDirectoryArtistRecord;
  readonly eager?: boolean;
}) {
  return (
    <article className="tw-group tw-flex tw-h-full tw-min-w-0 tw-flex-col">
      <MuseumDirectoryMediaStage
        record={record.representative}
        eager={eager}
        shape="artist"
      />
      <div className="tw-flex tw-flex-1 tw-flex-col tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
        <h2 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          <Link
            href={museumArtistHref(record.artist.slug)}
            className="hover:tw-text-primary-200 tw-text-inherit tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {record.artist.preferredName}
          </Link>
        </h2>
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {record.relationship}
        </p>
      </div>
    </article>
  );
}
