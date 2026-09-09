import Link from "next/link";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface ArtistRecordSummaryLink {
  readonly label: string;
  readonly href: string;
}

export function MuseumArtistRecordSummary({
  relationshipSummary,
  workCount,
  acquisition,
  profileHref,
  sourceHref,
}: {
  readonly relationshipSummary: string;
  readonly workCount: number;
  readonly acquisition?: ArtistRecordSummaryLink;
  readonly profileHref: string | null;
  readonly sourceHref: string | null;
}) {
  return (
    <section
      className="tw-mt-8 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800"
      aria-labelledby="museum-artist-record-summary-title"
    >
      <h2 id="museum-artist-record-summary-title" className="tw-sr-only">
        {t(DEFAULT_LOCALE, "museum.network.artists.record")}
      </h2>
      <dl className="tw-m-0 tw-grid tw-gap-x-8 tw-gap-y-6 tw-py-5 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
        <div>
          <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.artists.collectionRelationship")}
          </dt>
          <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
            {relationshipSummary}
          </dd>
        </div>
        <div>
          <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.artists.worksLabel")}
          </dt>
          <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(
              DEFAULT_LOCALE,
              workCount === 1
                ? "museum.network.artists.worksCount.one"
                : "museum.network.artists.worksCount.other",
              { count: formatInteger(DEFAULT_LOCALE, workCount) }
            )}
          </dd>
        </div>
        {acquisition === undefined ? null : (
          <div>
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.artists.acquisition")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6">
              <Link
                href={acquisition.href}
                className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                {acquisition.label}
              </Link>
            </dd>
          </div>
        )}
        {profileHref === null ? null : (
          <div>
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.artists.profile")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6">
              <Link
                href={profileHref}
                className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                {t(DEFAULT_LOCALE, "museum.network.artists.readProfile")}
              </Link>
            </dd>
          </div>
        )}
        {sourceHref === null ? null : (
          <div>
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
              {t(DEFAULT_LOCALE, "museum.network.artists.sourceRecord")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6">
              <a
                href={sourceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                {t(DEFAULT_LOCALE, "museum.network.detail.openSourceRecord")}
              </a>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
