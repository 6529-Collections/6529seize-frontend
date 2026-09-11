import Link from "next/link";
import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumEntityRef,
  MuseumEntityRefMedia,
  MuseumPublicAcquisitionStatus,
} from "@/lib/museum/publication/ia";
import {
  displayMuseumPublicAcquisitionStatus,
  displayMuseumStatus,
} from "@/lib/museum/presentation";
import {
  MuseumManagedImage,
  type MuseumManagedImageProps,
} from "./MuseumManagedImage";

function imageDimensions(
  media: MuseumEntityRefMedia | undefined
): Pick<MuseumManagedImageProps, "width" | "height"> {
  if (media === undefined) return {};
  const dimensions: { width?: number; height?: number } = {};
  if (media.width !== null) dimensions.width = media.width;
  if (media.height !== null) dimensions.height = media.height;
  return dimensions;
}

interface MuseumRelatedEntitiesProps {
  readonly entities: readonly MuseumEntityRef[];
  readonly headingId: string;
  readonly title: string;
  readonly entityNotes?: Readonly<Record<string, string>>;
}

const PUBLIC_ACQUISITION_STATUSES: readonly MuseumPublicAcquisitionStatus[] = [
  "proposed_in_museum_wave",
  "selected_by_museum_wave_acquisition_review_in_progress",
  "selected_through_acquisition_program_acquisition_pending",
  "acquisition_complete_accession_review_in_progress",
  "accessioned_into_permanent_collection",
  "closed_without_selection",
  "withdrawn",
];

function displayRelationStatus(status: string): string {
  return PUBLIC_ACQUISITION_STATUSES.includes(
    status as MuseumPublicAcquisitionStatus
  )
    ? displayMuseumPublicAcquisitionStatus(
        status as MuseumPublicAcquisitionStatus
      )
    : displayMuseumStatus(status);
}

export function MuseumRelatedEntities({
  entities,
  headingId,
  title,
  entityNotes = {},
}: MuseumRelatedEntitiesProps) {
  const visibleEntities = entities.filter(
    (entity) => entity.href.trim().length > 0 && entity.label.trim().length > 0
  );
  if (visibleEntities.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={headingId} className="tw-mt-12">
      <h2
        id={headingId}
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
      >
        {title}
      </h2>
      <ul className="tw-m-0 tw-mt-5 tw-grid tw-list-none tw-gap-x-8 tw-gap-y-10 tw-p-0 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
        {visibleEntities.map((entity) => {
          const media = entity.media;
          const dimensions = imageDimensions(media);
          const responsiveMedia: Pick<
            MuseumManagedImageProps,
            "srcSet" | "sizes"
          > = {
            ...(media?.srcSet === undefined ? {} : { srcSet: media.srcSet }),
            ...(media?.sizes === undefined ? {} : { sizes: media.sizes }),
          };
          const mediaContent =
            media === undefined ? null : (
              <span className="tw-block tw-aspect-[4/3] tw-overflow-hidden tw-bg-black">
                <MuseumManagedImage
                  src={media.src}
                  {...responsiveMedia}
                  {...dimensions}
                  alt={media.alt}
                  loading="lazy"
                  failureMessage={t(
                    DEFAULT_LOCALE,
                    "museum.network.media.unavailable"
                  )}
                  retryLabel={t(DEFAULT_LOCALE, "museum.network.media.retry")}
                  className="tw-block tw-h-full tw-w-full tw-object-contain tw-transition-transform tw-duration-300 group-hover:tw-scale-[1.01] motion-reduce:tw-transition-none"
                />
              </span>
            );
          return (
            <li
              key={`${entity.kind}:${entity.id}:${entity.href}`}
              className="tw-min-w-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-5"
              data-museum-entity-kind={entity.kind}
            >
              <div className="tw-group tw-flex tw-min-w-0 tw-flex-col tw-gap-3 tw-text-sm">
                {mediaContent}
                <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                  {entity.relation}
                </span>
                <Link
                  href={entity.href}
                  prefetch={false}
                  className="group-hover:tw-text-primary-200 tw-break-words tw-font-semibold tw-text-primary-300 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  {entity.label}
                </Link>
                {entityNotes[entity.id] === undefined ? null : (
                  <span className="tw-text-xs tw-leading-5 tw-text-iron-500">
                    {entityNotes[entity.id]}
                  </span>
                )}
                {entity.status === undefined &&
                (entity.statusAsOf === null ||
                  entity.statusAsOf === undefined) ? null : (
                  <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-leading-5 tw-text-iron-400">
                    {entity.status === undefined ? null : (
                      <span>
                        <span className="tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-500">
                          {t(DEFAULT_LOCALE, "museum.network.entity.status")}
                        </span>{" "}
                        {displayRelationStatus(entity.status)}
                      </span>
                    )}
                    {entity.statusAsOf === null ||
                    entity.statusAsOf === undefined ? null : (
                      <span>
                        <span className="tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-500">
                          {t(
                            DEFAULT_LOCALE,
                            "museum.network.entity.statusAsOf"
                          )}
                        </span>{" "}
                        <time dateTime={entity.statusAsOf}>
                          {formatDate(DEFAULT_LOCALE, entity.statusAsOf)}
                        </time>
                      </span>
                    )}
                  </div>
                )}
                {media?.creditLine === undefined ? null : (
                  <span className="tw-text-xs tw-leading-5 tw-text-iron-500">
                    {media.creditLine}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
