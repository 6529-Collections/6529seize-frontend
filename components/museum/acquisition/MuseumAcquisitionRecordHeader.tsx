import Link from "next/link";
import { MuseumBreadcrumbs } from "../MuseumBreadcrumbs";
import { MuseumEntityContext } from "../MuseumEntityContext";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import type {
  MuseumAcquisitionViewModel,
  MuseumEntityContextModel,
} from "@/lib/museum/publication/ia";
import { t } from "@/i18n/messages";

function acquisitionAccessionNumber(
  acquisition: MuseumAcquisitionViewModel
): string | null {
  for (const path of acquisition.sourcePaths) {
    const match = /records\/accessions\/(6529NM\.\d{4}\.\d{3})(?:\/|$)/u.exec(
      path
    );
    if (match?.[1] !== undefined) return match[1];
  }
  return null;
}

export function MuseumAcquisitionRecordHeader({
  acquisition,
  context,
}: {
  readonly acquisition: MuseumAcquisitionViewModel;
  readonly context: MuseumEntityContextModel;
}) {
  const accessionNumber = acquisitionAccessionNumber(acquisition);
  return (
    <>
      <MuseumBreadcrumbs
        ariaLabel={t(
          DEFAULT_LOCALE,
          "museum.network.accessibility.breadcrumbs"
        )}
        items={context.breadcrumbs}
      />
      <Link
        href="/museum/network/acquisitions"
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.acquisitions.back")}
      </Link>
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.acquisitions.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {acquisition.title}
        </h1>
        <p className="tw-m-0 tw-mt-5 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {acquisition.thesis}
        </p>
        <p className="tw-m-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
          {acquisition.acquisitionMethod === "gift" ||
          acquisition.acquisitionMethod === "donation"
            ? t(DEFAULT_LOCALE, "museum.network.acquisitions.methodGift")
            : acquisition.acquisitionMethod}
          {accessionNumber === null ? null : ` · Accession ${accessionNumber}`}
        </p>
      </header>
    </>
  );
}

export function MuseumAcquisitionRecordContext({
  context,
  artFirst,
  curatorialDocumentCount,
  workCount,
}: {
  readonly context: MuseumEntityContextModel;
  readonly artFirst: boolean;
  readonly curatorialDocumentCount: number;
  readonly workCount: number;
}) {
  if (!artFirst) return null;
  return (
    <>
      <MuseumEntityContext
        context={context}
        labels={{
          ariaLabel: t(
            DEFAULT_LOCALE,
            "museum.network.accessibility.entityContext"
          ),
          status: t(DEFAULT_LOCALE, "museum.network.entity.status"),
          statusAsOf: t(DEFAULT_LOCALE, "museum.network.entity.statusAsOf"),
          source: t(DEFAULT_LOCALE, "museum.network.entity.sources"),
        }}
      />
      <nav
        aria-label={t(DEFAULT_LOCALE, "museum.network.acquisitions.onThisPage")}
        className="tw-mt-8 tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-2 tw-border-y tw-border-solid tw-border-iron-800 tw-py-3 tw-text-sm"
      >
        {workCount === 0 ? null : (
          <a
            href="#acquisition-works"
            className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.works")}
          </a>
        )}
        {curatorialDocumentCount === 0 ? null : (
          <a
            href="#acquisition-curatorial-reading"
            className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.acquisitions.curatorialReading")}
          </a>
        )}
        <a
          href="#acquisition-record"
          className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          {t(
            DEFAULT_LOCALE,
            "museum.network.acquisitions.acquisitionRecordAndSources"
          )}
        </a>
      </nav>
    </>
  );
}
