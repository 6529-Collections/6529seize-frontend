import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MuseumManagedImage } from "./MuseumManagedImage";

export function MuseumPublicMediaFigure({
  src,
  width,
  height,
  alt,
  href,
  title,
  byline,
  qualifier,
  sourceHref,
  sourceLabel,
  eager = false,
  sizes = "(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw",
}: {
  readonly src: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly alt: string;
  readonly href?: string;
  readonly title: string;
  readonly byline?: string;
  readonly qualifier?: string;
  readonly sourceHref?: string;
  readonly sourceLabel?: string;
  readonly eager?: boolean;
  readonly sizes?: string;
}) {
  const image = (
    <div className="tw-relative tw-aspect-square tw-w-full tw-overflow-hidden tw-bg-black">
      <MuseumManagedImage
        src={src}
        {...(width === null ? {} : { width })}
        {...(height === null ? {} : { height })}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        sizes={sizes}
        failureMessage={t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
        retryLabel={t(DEFAULT_LOCALE, "museum.network.media.retry")}
        {...(sourceHref === undefined || sourceLabel === undefined
          ? {}
          : { sourceHref, sourceLabel })}
        className="tw-h-full tw-w-full tw-object-contain tw-transition-transform tw-duration-300 group-hover:tw-scale-[1.01] motion-reduce:tw-transition-none"
      />
    </div>
  );

  return (
    <figure className="tw-group tw-m-0 tw-min-w-0">
      {image}
      <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
        {href ? (
          <Link
            href={href}
            className="tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {title}
          </Link>
        ) : (
          <span className="tw-text-base tw-font-semibold tw-text-iron-50">{title}</span>
        )}
        {byline ? <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">{byline}</span> : null}
        {qualifier ? (
          <span className="tw-mt-1 tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
            {qualifier}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
