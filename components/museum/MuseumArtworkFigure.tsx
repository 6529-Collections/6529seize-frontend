import Image from "next/image";
import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CaseyArtwork } from "@/lib/museum/casey";
import { MuseumRightsLink } from "./MuseumRightsLink";

export function MuseumArtworkFigure({
  artwork,
  artistName,
  captionVariant = "default",
  eager = false,
  href,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: {
  readonly artwork: CaseyArtwork;
  readonly artistName?: string;
  readonly captionVariant?: "default" | "hero";
  readonly eager?: boolean;
  readonly href?: string;
  readonly sizes?: string;
}) {
  const isHeroCaption = captionVariant === "hero";
  const secondaryCaption =
    isHeroCaption && artistName
      ? t(DEFAULT_LOCALE, "museum.network.artwork.artistYear", {
          artist: artistName,
          year: artwork.year,
        })
      : t(DEFAULT_LOCALE, "museum.network.artwork.projectYear", {
          project: artwork.project,
          year: artwork.year,
        });
  const image = (
    <div className="tw-relative tw-aspect-square tw-w-full tw-overflow-hidden tw-bg-black">
      <Image
        src={artwork.imageUrl}
        alt={artwork.visualDescription}
        fill
        priority={eager}
        sizes={sizes}
        className="tw-object-contain tw-transition-transform tw-duration-300 group-hover:tw-scale-[1.01] motion-reduce:tw-transition-none"
        unoptimized
      />
    </div>
  );

  return (
    <figure
      className={`tw-group tw-m-0 tw-min-w-0 ${
        isHeroCaption
          ? "lg:tw-col-start-2 lg:tw-row-span-2 lg:tw-row-start-1 lg:tw-grid lg:tw-grid-rows-subgrid"
          : ""
      }`}
    >
      {href ? (
        <>
          <Link
            href={href}
            className="tw-block focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-4 focus-visible:tw-ring-offset-black"
          >
            {image}
          </Link>
          <figcaption className="tw-flex tw-min-w-0 tw-items-start tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4">
            <span className="tw-min-w-0">
              <span
                className={`tw-block tw-truncate tw-text-base tw-font-semibold tw-text-iron-50 ${isHeroCaption ? "tw-tracking-[-0.01em]" : ""}`}
              >
                {artwork.title}
              </span>
              <span className="tw-mt-1 tw-block tw-text-sm tw-text-iron-400">
                {secondaryCaption}
              </span>
            </span>
            <Link
              href={href}
              className={`group-hover:tw-text-primary-200 tw-inline-flex tw-min-h-6 tw-shrink-0 tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-primary-300 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${isHeroCaption ? "tw-mt-px" : "tw-underline tw-underline-offset-4"}`}
            >
              <span>
                {t(DEFAULT_LOCALE, "museum.network.artwork.viewWork")}
              </span>
              {isHeroCaption ? <span aria-hidden="true">→</span> : null}
            </Link>
          </figcaption>
        </>
      ) : (
        <>
          {image}
          <figcaption className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-4 tw-text-sm tw-leading-6 tw-text-iron-400">
            {artwork.creditLine}{" "}
            <MuseumRightsLink
              href={artwork.rightsUrl}
              label={artwork.rightsLabel}
              className="tw-text-iron-300 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            />
          </figcaption>
        </>
      )}
    </figure>
  );
}
