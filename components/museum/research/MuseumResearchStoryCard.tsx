import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumMedia } from "@/lib/museum/publication/types";
import { museumMediaResponsiveImage } from "@/lib/museum/publication/mediaSelection";
import { MuseumManagedImage } from "../MuseumManagedImage";
import { museumResearchMediaAspectRatio } from "./museumResearchMediaAspectRatio";

interface MuseumResearchStoryCardProps {
  readonly href: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly media: MuseumMedia | undefined;
  readonly actionLabel: string;
}

export function MuseumResearchStoryCard({
  href,
  eyebrow,
  title,
  description,
  media,
  actionLabel,
}: MuseumResearchStoryCardProps) {
  const imageDimensions: { width?: number; height?: number } = {};
  if (media?.width !== null && media?.width !== undefined) {
    imageDimensions.width = media.width;
  }
  if (media?.height !== null && media?.height !== undefined) {
    imageDimensions.height = media.height;
  }
  const mediaAspectRatio =
    media === undefined
      ? undefined
      : museumResearchMediaAspectRatio(media.width, media.height);
  const altText = media?.altText?.trim();
  const responsiveImage =
    media === undefined ? undefined : museumMediaResponsiveImage(media);
  const responsiveSrcSetProps =
    responsiveImage?.srcSet === undefined
      ? {}
      : { srcSet: responsiveImage.srcSet };

  return (
    <article className="tw-grid tw-min-w-0 tw-items-start tw-gap-8 lg:tw-grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:tw-gap-12">
      {media === undefined ? null : (
        <figure className="tw-group tw-m-0 tw-min-w-0">
          <Link
            href={href}
            aria-label={title}
            className="tw-block tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            <div
              className="tw-relative tw-w-full tw-overflow-hidden tw-bg-black"
              style={
                mediaAspectRatio === undefined
                  ? undefined
                  : { aspectRatio: mediaAspectRatio }
              }
            >
              <MuseumManagedImage
                src={responsiveImage?.src ?? media.url}
                {...responsiveSrcSetProps}
                sizes="(min-width: 1024px) 58vw, 100vw"
                {...imageDimensions}
                alt={
                  altText === undefined || altText.length === 0
                    ? title
                    : altText
                }
                loading="eager"
                fetchPriority="high"
                failureMessage={t(
                  DEFAULT_LOCALE,
                  "museum.network.media.unavailable"
                )}
                retryLabel={t(DEFAULT_LOCALE, "museum.network.media.retry")}
                className="tw-h-full tw-w-full tw-object-contain motion-reduce:tw-transition-none"
              />
            </div>
          </Link>
          <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
            <span className="tw-text-sm tw-text-iron-400">
              {media.credit.creditLine}
            </span>
          </figcaption>
        </figure>
      )}
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-8">
        <div>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {eyebrow}
          </p>
          <h2 className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-4xl">
            <Link
              href={href}
              className="hover:tw-text-primary-200 tw-text-inherit tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {title}
            </Link>
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-max-w-prose tw-text-base tw-leading-7 tw-text-iron-300">
            {description}
          </p>
        </div>
        <Link
          href={href}
          className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-self-start tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}
