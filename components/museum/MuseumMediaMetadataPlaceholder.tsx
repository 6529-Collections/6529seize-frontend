import type { MuseumMediaMetadata } from "@/lib/museum/publication/types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MuseumRightsLink } from "./MuseumRightsLink";

export function MuseumMediaMetadataPlaceholder({
  title,
  metadata,
}: {
  readonly title: string;
  readonly metadata: MuseumMediaMetadata;
}) {
  const headingId = `museum-media-metadata-${metadata.id}`;
  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className="tw-flex tw-h-full tw-min-h-48 tw-min-w-0 tw-flex-col tw-items-center tw-justify-center tw-overflow-y-auto tw-border-y tw-border-solid tw-border-iron-800 tw-bg-black tw-p-6 tw-text-center"
    >
      <p
        id={headingId}
        className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100"
      >
        {title}
      </p>
      <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(DEFAULT_LOCALE, "museum.network.media.metadataOnly")}
      </p>
      {metadata.altText === null ? null : (
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
          <span className="tw-font-semibold tw-text-iron-200">
            {t(DEFAULT_LOCALE, "museum.network.media.accessibilityDescription")}
            :
          </span>{" "}
          {metadata.altText}
        </p>
      )}
      <p className="tw-m-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-500">
        {metadata.credit.creditLine}
      </p>
      {metadata.credit.licenseLabel === null ? null : (
        <p className="tw-m-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-500">
          <MuseumRightsLink
            href={metadata.credit.licenseUrl ?? undefined}
            label={metadata.credit.licenseLabel}
            className="tw-text-iron-300 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          />
        </p>
      )}
      {metadata.context?.openHref === null ||
      metadata.context === undefined ? null : (
        <a
          href={metadata.context.openHref}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:tw-text-primary-200 tw-mt-4 tw-inline-flex tw-min-h-11 tw-w-fit tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(DEFAULT_LOCALE, "museum.network.media.openWaveContext")}
        </a>
      )}
    </div>
  );
}
