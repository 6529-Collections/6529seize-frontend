import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import { MuseumJsonDisclosure } from "@/components/museum/MuseumMarkdown";
import {
  MuseumSectionHeading,
  MuseumStatusBadge,
} from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { getMuseumView } from "@/lib/museum/normalize";
import { buildMuseumRawUrl } from "@/lib/museum/source";
import {
  displayMuseumStatus,
  museumSlug,
  statusTone,
} from "@/lib/museum/presentation";

interface AccessionDetailProps {
  readonly params: Promise<{ accessionId: string }>;
}

export async function generateMetadata({
  params,
}: AccessionDetailProps): Promise<Metadata> {
  const { accessionId } = await params;
  const view = await getMuseumView();
  const lot = view.accessions.find(
    (item) => museumSlug(item.accessionLotId) === accessionId
  );
  return getAppMetadata({
    title:
      lot?.preferredTitle ??
      t(DEFAULT_LOCALE, "museum.network.accessions.title"),
    description: t(DEFAULT_LOCALE, "museum.network.accessions.description"),
  });
}

export default async function MuseumAccessionDetailPage({
  params,
}: AccessionDetailProps) {
  const { accessionId } = await params;
  const view = await getMuseumView();
  const lot = view.accessions.find(
    (item) => museumSlug(item.accessionLotId) === accessionId
  );
  if (!lot) notFound();
  const objectRecords = view.objects.filter(
    (object) => object.accessionLotId === lot.accessionLotId
  );

  return (
    <article>
      <Link
        href="/museum/network/accessions"
        className="hover:tw-text-primary-200 tw-text-sm tw-font-medium tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.accessions.detail.back")}
      </Link>
      <div className="tw-mt-8">
        <MuseumSectionHeading
          eyebrow={lot.accessionLotId}
          title={lot.preferredTitle}
          description={t(
            DEFAULT_LOCALE,
            "museum.network.accessions.description"
          )}
        />
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <MuseumStatusBadge
            label={displayMuseumStatus(lot.donationStatus)}
            tone={statusTone(lot.donationStatus)}
          />
          <MuseumStatusBadge
            label={displayMuseumStatus(lot.accessionStatus)}
            tone={statusTone(lot.accessionStatus)}
          />
        </div>
      </div>
      <dl className="tw-mt-8 tw-grid tw-gap-4 sm:tw-grid-cols-2">
        <div className="tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-4">
          <dt className="tw-text-xs tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.accessions.detail.objects")}
          </dt>
          <dd className="tw-m-0 tw-mt-2 tw-text-lg tw-font-semibold tw-text-white">
            {lot.objectCount ?? "—"}
          </dd>
        </div>
        <div className="tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-4">
          <dt className="tw-text-xs tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.accessions.detail.donor")}
          </dt>
          <dd className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-200">
            {lot.donorPublicCredit ?? "—"}
          </dd>
        </div>
        <div className="tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-4">
          <dt className="tw-text-xs tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.accessions.detail.custody")}
          </dt>
          <dd className="tw-m-0 tw-mt-2 tw-break-words tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-200">
            {lot.custodyEns ?? lot.custodyAddress ?? "—"}
          </dd>
        </div>
        <div className="tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-4">
          <dt className="tw-text-xs tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.accessions.detail.receipt")}
          </dt>
          <dd className="tw-m-0 tw-mt-2 tw-break-words tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-200">
            {lot.receiptTransactionHash ?? "—"}
            {lot.receiptBlockTime
              ? ` · ${formatDate(DEFAULT_LOCALE, lot.receiptBlockTime)}`
              : ""}
          </dd>
        </div>
      </dl>
      <section
        className="tw-mt-8 tw-rounded-2xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5"
        aria-labelledby="accession-limits-title"
      >
        <h2
          id="accession-limits-title"
          className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white"
        >
          {t(DEFAULT_LOCALE, "museum.network.accessions.detail.limits")}
        </h2>
        {lot.completionLimits.length > 0 ? (
          <ul className="tw-m-4 tw-mb-0 tw-list-disc tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300">
            {lot.completionLimits.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        ) : (
          <p className="tw-m-0 tw-mt-3 tw-text-sm tw-text-iron-400">—</p>
        )}
      </section>
      <section
        className="tw-mt-4 tw-rounded-2xl tw-border tw-border-primary-400/20 tw-bg-primary-500/5 tw-p-5"
        aria-labelledby="accession-objects-title"
      >
        <h2
          id="accession-objects-title"
          className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white"
        >
          {t(DEFAULT_LOCALE, "museum.network.accessions.detail.objects")}
        </h2>
        {objectRecords.length > 0 ? (
          <ul className="tw-m-4 tw-mb-0 tw-list-disc tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300">
            {objectRecords.map((object) => (
              <li key={object.objectId}>
                <Link
                  href={`/museum/network/objects/${museumSlug(object.objectId)}`}
                  className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                >
                  {object.title} ({object.objectId})
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "museum.network.accessions.detail.noObjects")}
          </p>
        )}
      </section>
      <div className="tw-mt-6">
        <MuseumJsonDisclosure
          label={t(DEFAULT_LOCALE, "museum.network.detail.technicalEvidence")}
          value={lot}
        />
      </div>
      <p className="tw-mt-4 tw-text-xs tw-text-iron-500">
        <a
          href={buildMuseumRawUrl(lot.sourcePath)}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-underline tw-underline-offset-4 hover:tw-text-iron-300"
        >
          {t(DEFAULT_LOCALE, "museum.network.detail.sourceRecord")}
        </a>
      </p>
    </article>
  );
}
