import type { ReactNode } from "react";
import type { MuseumMediaMetadata } from "@/lib/museum/publication/types";
import {
  MuseumLandingMediaCard,
  type MuseumLandingMedia,
} from "./MuseumLandingMediaCard";

export function MuseumLandingHero({
  eyebrow,
  title,
  description,
  media,
  mediaMetadata,
  mediaTitle,
  mediaSubtitle,
  mediaHref,
  actions,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly media?: MuseumLandingMedia;
  readonly mediaMetadata?: MuseumMediaMetadata;
  readonly mediaTitle?: string;
  readonly mediaSubtitle?: string;
  readonly mediaHref?: string;
  readonly actions?: ReactNode;
}) {
  const mediaProps = media === undefined ? {} : { media };
  const metadataProps =
    mediaMetadata === undefined ? {} : { metadata: mediaMetadata };
  const hrefProps = mediaHref === undefined ? {} : { href: mediaHref };
  const subtitleProps =
    mediaSubtitle === undefined ? {} : { subtitle: mediaSubtitle };
  const hasMedia = mediaTitle !== undefined;
  return (
    <header
      className={`tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-12 md:tw-pb-16 ${hasMedia ? "tw-grid tw-gap-10 md:tw-grid-cols-[minmax(0,0.8fr)_minmax(22rem,1.2fr)] md:tw-items-start md:tw-gap-14" : ""}`}
    >
      <div className="tw-max-w-2xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-primary-300">
          {eyebrow}
        </p>
        <h1 className="tw-m-0 tw-mt-4 tw-text-4xl tw-font-semibold tw-leading-[1.05] tw-tracking-[-0.03em] tw-text-iron-50 sm:tw-text-6xl">
          {title}
        </h1>
        <p className="tw-m-0 tw-mt-6 tw-max-w-xl tw-text-lg tw-leading-8 tw-text-iron-300">
          {description}
        </p>
        {actions === undefined ? null : (
          <div className="tw-mt-8 tw-flex tw-flex-wrap tw-items-center tw-gap-x-5 tw-gap-y-2">
            {actions}
          </div>
        )}
      </div>
      {mediaTitle === undefined ? null : (
        <MuseumLandingMediaCard
          {...mediaProps}
          {...metadataProps}
          {...hrefProps}
          title={mediaTitle}
          {...subtitleProps}
          eager
          featured
        />
      )}
    </header>
  );
}
