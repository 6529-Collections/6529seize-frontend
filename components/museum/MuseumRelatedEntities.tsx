import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumEntityRef,
  MuseumEntityRefMedia,
} from "@/lib/museum/publication/ia";
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
}

export function MuseumRelatedEntities({
  entities,
  headingId,
  title,
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
      <ul className="tw-m-0 tw-mt-5 tw-list-none tw-divide-y tw-divide-iron-800 tw-border-y tw-border-solid tw-border-iron-800 tw-p-0 sm:tw-grid sm:tw-grid-cols-2 sm:tw-divide-x sm:tw-divide-y-0 xl:tw-grid-cols-3">
        {visibleEntities.map((entity) => {
          const media = entity.media;
          const dimensions = imageDimensions(media);
          const mediaContent =
            media === undefined ? null : (
              <span className="tw-block tw-aspect-[4/3] tw-overflow-hidden tw-bg-black">
                <MuseumManagedImage
                  src={media.src}
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
              className="tw-min-w-0 tw-border-solid tw-border-iron-800 sm:tw-border-b sm:tw-border-b-0 sm:tw-border-r-0 sm:tw-border-t-0 sm:tw-px-5 first:sm:tw-pl-0 last:sm:tw-pr-0"
              data-museum-entity-kind={entity.kind}
            >
              <div className="tw-group tw-flex tw-min-w-0 tw-flex-col tw-gap-3 tw-py-4 tw-text-sm">
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
