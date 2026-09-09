import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MuseumManagedImage } from "../MuseumManagedImage";

export function MuseumResearchEditorialFigure({
  src,
  srcSet,
  width,
  height,
  alt,
  credit,
  sourceHref,
}: {
  readonly src: string;
  readonly srcSet?: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly credit: string;
  readonly sourceHref?: string;
}) {
  return (
    <figure className="tw-m-0 tw-mt-10 tw-max-w-5xl">
      <div
        className="tw-relative tw-w-full tw-overflow-hidden tw-bg-black"
        style={{ aspectRatio: width / height }}
      >
        <MuseumManagedImage
          src={src}
          width={width}
          height={height}
          alt={alt}
          loading="eager"
          fetchPriority="high"
          {...(srcSet === undefined ? {} : { srcSet })}
          sizes="(min-width: 1280px) 70vw, 100vw"
          failureMessage={t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
          retryLabel={t(DEFAULT_LOCALE, "museum.network.media.retry")}
          className="tw-h-full tw-w-full tw-object-contain"
        />
      </div>
      <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4 tw-text-sm tw-leading-6 tw-text-iron-400">
        <span>{credit}</span>
        <span className="tw-mt-1 tw-block tw-text-xs tw-text-iron-500">
          {t(DEFAULT_LOCALE, "museum.network.research.editorialIllustration")}
        </span>
        {sourceHref === undefined ? null : (
          <a
            href={sourceHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:tw-text-primary-200 tw-mt-2 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.research.viewImageSource")}
            <span className="tw-sr-only">
              {` ${t(DEFAULT_LOCALE, "museum.network.research.opensInNewTab")}`}
            </span>
          </a>
        )}
      </figcaption>
    </figure>
  );
}
