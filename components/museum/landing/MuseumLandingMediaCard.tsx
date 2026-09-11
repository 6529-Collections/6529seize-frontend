import Link from "next/link";
import type {
  MuseumExternalProposalPresentationVariant,
  MuseumMediaMetadata,
} from "@/lib/museum/publication/types";
import type { MuseumProgramMedia } from "@/lib/museum/types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MuseumManagedImage } from "@/components/museum/MuseumManagedImage";
import { MuseumMediaMetadataPlaceholder } from "@/components/museum/MuseumMediaMetadataPlaceholder";
import { MuseumProposalImage } from "@/components/museum/MuseumProposalImage";
import { MuseumProgramImage } from "@/components/museum/MuseumProgramImage";

export type MuseumLandingMedia =
  | {
      readonly kind: "governed";
      readonly src: string;
      readonly width: number | null;
      readonly height: number | null;
      readonly alt: string;
      readonly creditLine?: string;
      readonly srcSet?: string;
    }
  | {
      readonly kind: "proposal";
      readonly src: string;
      readonly width: number;
      readonly height: number;
      readonly alt: string;
      readonly sourceByteSize: number;
      readonly variants?: readonly MuseumExternalProposalPresentationVariant[];
      readonly sourceHref?: string;
      readonly sourceLabel?: string;
      readonly creditLine?: string;
      readonly requireIntentForLargeSource?: boolean;
      readonly optimizeSource?: boolean;
    }
  | {
      readonly kind: "program";
      readonly media: MuseumProgramMedia;
      readonly creditLine?: string;
    };

function MediaFrame({
  media,
  eager,
}: {
  readonly media: MuseumLandingMedia;
  readonly eager: boolean;
}) {
  const frameClassName =
    "tw-block tw-h-full tw-w-full tw-object-contain tw-transition-transform tw-duration-300 group-hover:tw-scale-[1.01] motion-reduce:tw-transition-none";

  if (media.kind === "program") {
    return (
      <MuseumProgramImage
        media={media.media}
        sizes="(min-width: 1280px) 42vw, (min-width: 640px) 70vw, 100vw"
        eager={eager}
        className={frameClassName}
      />
    );
  }

  if (media.kind === "proposal") {
    return (
      <MuseumProposalImage
        src={media.src}
        alt={media.alt}
        width={media.width}
        height={media.height}
        sourceByteSize={media.sourceByteSize}
        variants={media.variants}
        requireIntentForLargeSource={media.requireIntentForLargeSource ?? true}
        optimizeSource={media.optimizeSource ?? false}
        {...(media.sourceHref === undefined || media.sourceLabel === undefined
          ? {}
          : {
              sourceHref: media.sourceHref,
              sourceLabel: media.sourceLabel,
            })}
        eager={eager}
        className={frameClassName}
      />
    );
  }

  return (
    <MuseumManagedImage
      src={media.src}
      {...(media.width === null ? {} : { width: media.width })}
      {...(media.height === null ? {} : { height: media.height })}
      alt={media.alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      sizes="(min-width: 1280px) 42vw, (min-width: 640px) 70vw, 100vw"
      {...(media.srcSet === undefined ? {} : { srcSet: media.srcSet })}
      failureMessage={t(DEFAULT_LOCALE, "museum.network.media.unavailable")}
      retryLabel={t(DEFAULT_LOCALE, "museum.network.media.retry")}
      className={frameClassName}
    />
  );
}

function mediaAspectRatio(media: MuseumLandingMedia): string | undefined {
  if (media.kind === "governed" || media.kind === "proposal") {
    return media.width !== null &&
      media.height !== null &&
      media.width > 0 &&
      media.height > 0
      ? `${media.width} / ${media.height}`
      : undefined;
  }
  const variant = media.media.variants[0];
  const width = media.media.sourceWidth ?? variant?.width ?? null;
  const height = media.media.sourceHeight ?? variant?.height ?? null;
  return width !== null && height !== null && width > 0 && height > 0
    ? `${width} / ${height}`
    : undefined;
}

export function MuseumLandingMediaCard({
  media,
  metadata,
  href,
  title,
  subtitle,
  status,
  creditLine,
  eager = false,
  featured = false,
}: {
  readonly media?: MuseumLandingMedia;
  readonly metadata?: MuseumMediaMetadata;
  readonly href?: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly status?: string;
  readonly creditLine?: string;
  readonly eager?: boolean;
  readonly featured?: boolean;
}) {
  let frame;
  if (media !== undefined) {
    frame = (
      <div
        className="tw-flex tw-items-center tw-justify-center tw-overflow-hidden tw-bg-iron-950"
        style={{ aspectRatio: mediaAspectRatio(media) ?? "4 / 5" }}
      >
        <MediaFrame media={media} eager={eager} />
      </div>
    );
  } else if (metadata !== undefined) {
    frame = (
      <MuseumMediaMetadataPlaceholder title={title} metadata={metadata} />
    );
  } else {
    frame = (
      <div className="tw-flex tw-aspect-[4/5] tw-items-end tw-bg-iron-950 tw-p-5">
        <p className="tw-m-0 tw-max-w-[18rem] tw-text-sm tw-leading-6 tw-text-iron-400">
          The public record does not currently include an image for this work.
        </p>
      </div>
    );
  }

  const resolvedCreditLine = creditLine ?? media?.creditLine;

  return (
    <figure
      className="tw-group tw-m-0 tw-min-w-0"
      data-testid="museum-landing-media-card"
    >
      <div
        className={`tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 ${featured ? "tw-shadow-[0_24px_80px_rgba(0,0,0,0.35)]" : ""}`}
      >
        {frame}
      </div>
      <figcaption className="tw-pt-4 sm:tw-pt-5">
        {href === undefined ? (
          <span className="tw-block tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
            {title}
          </span>
        ) : (
          <Link
            href={href}
            className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {title}
          </Link>
        )}
        {subtitle === undefined ? null : (
          <span className="tw-mt-1 tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
            {subtitle}
          </span>
        )}
        {status === undefined ? null : (
          <span className="tw-mt-2 tw-block tw-text-sm tw-leading-6 tw-text-iron-300">
            {status}
          </span>
        )}
        {resolvedCreditLine === undefined ? null : (
          <span className="tw-mt-3 tw-block tw-text-xs tw-leading-5 tw-text-iron-500">
            {resolvedCreditLine}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
