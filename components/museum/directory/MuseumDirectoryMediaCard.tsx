import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { buildMuseumSignedWaveStormDropUrl } from "@/lib/museum/publication";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";
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

function MuseumDirectoryEmptyStage() {
  return (
    <div className="tw-flex tw-aspect-square tw-items-center tw-justify-center tw-bg-iron-950 tw-p-8 tw-text-center tw-text-sm tw-leading-6 tw-text-iron-500">
      {t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
    </div>
  );
}

function MuseumDirectoryMediaStage({
  record,
  eager = false,
}: {
  readonly record: MuseumDirectoryWorkRecord | null;
  readonly eager?: boolean;
}) {
  if (record === null) return <MuseumDirectoryEmptyStage />;

  const retained = selectMuseumStillMedia(record.work.media);
  if (retained !== undefined) {
    return (
      <div className="tw-aspect-square tw-w-full tw-overflow-hidden tw-bg-black">
        <MuseumManagedImage
          src={retained.url}
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
      <div className="tw-aspect-square tw-w-full tw-overflow-hidden tw-bg-black">
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
          className="tw-block tw-h-full tw-w-full tw-object-contain"
        />
      </div>
    );
  }

  const metadata = record.work.mediaMetadata?.[0];
  if (metadata !== undefined) {
    return (
      <div className="tw-aspect-square tw-w-full tw-overflow-hidden tw-bg-black">
        <MuseumMediaMetadataPlaceholder
          title={record.work.title}
          metadata={metadata}
        />
      </div>
    );
  }

  return <MuseumDirectoryEmptyStage />;
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
    <article className="tw-group tw-min-w-0">
      <MuseumDirectoryMediaStage record={record.representative} eager={eager} />
      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
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
