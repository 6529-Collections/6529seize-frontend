import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppMetadata } from "@/components/providers/metadata";
import {
  MuseumSectionHeading,
  MuseumStatusBadge,
} from "@/components/museum/MuseumShell";
import { MuseumJsonDisclosure } from "@/components/museum/MuseumMarkdown";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumView } from "@/lib/museum/normalize";
import { buildMuseumRawUrl } from "@/lib/museum/source";
import {
  displayMuseumStatus,
  museumSlug,
  statusTone,
} from "@/lib/museum/presentation";

interface CollectionDetailProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CollectionDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const view = await getMuseumView();
  const collection = view.approvedCollections.find(
    (item) => museumSlug(item.approvalId) === slug
  );
  return getAppMetadata({
    title:
      collection?.preferredName ??
      t(DEFAULT_LOCALE, "museum.network.collections.title"),
    description:
      collection?.scopeDefinition ??
      t(DEFAULT_LOCALE, "museum.network.collections.description"),
  });
}

export default async function MuseumCollectionDetailPage({
  params,
}: CollectionDetailProps) {
  const { slug } = await params;
  const view = await getMuseumView();
  const collection = view.approvedCollections.find(
    (item) => museumSlug(item.approvalId) === slug
  );
  if (!collection) notFound();

  return (
    <article>
      <Link
        href="/museum/network/collections"
        className="hover:tw-text-primary-200 tw-text-sm tw-font-medium tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.collections.detail.back")}
      </Link>
      <div className="tw-mt-8">
        <MuseumSectionHeading
          eyebrow={collection.category}
          title={collection.preferredName}
          description={collection.scopeDefinition}
        />
        <MuseumStatusBadge
          label={displayMuseumStatus(collection.status)}
          tone={statusTone(collection.status)}
        />
      </div>
      <div className="tw-mt-8 tw-grid tw-gap-4 lg:tw-grid-cols-2">
        <section
          className="tw-rounded-2xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5"
          aria-labelledby="collection-exclusions-title"
        >
          <h2
            id="collection-exclusions-title"
            className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white"
          >
            {t(DEFAULT_LOCALE, "museum.network.collections.detail.exclusions")}
          </h2>
          {collection.exclusions.length > 0 ? (
            <ul className="tw-m-4 tw-mb-0 tw-list-disc tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300">
              {collection.exclusions.map((exclusion) => (
                <li key={exclusion}>{exclusion}</li>
              ))}
            </ul>
          ) : (
            <p className="tw-m-0 tw-mt-3 tw-text-sm tw-text-iron-400">—</p>
          )}
        </section>
        <section
          className="tw-rounded-2xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5"
          aria-labelledby="collection-governance-title"
        >
          <h2
            id="collection-governance-title"
            className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white"
          >
            {t(DEFAULT_LOCALE, "museum.network.collections.detail.governance")}
          </h2>
          <p className="tw-m-0 tw-mt-3 tw-font-mono tw-text-sm tw-text-iron-200">
            {collection.decisionId}
          </p>
          <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
            {collection.sourcePath}
          </p>
        </section>
      </div>
      <div className="tw-mt-6">
        <MuseumJsonDisclosure
          label={t(DEFAULT_LOCALE, "museum.network.detail.technicalEvidence")}
          value={collection}
        />
      </div>
      <p className="tw-mt-4 tw-text-xs tw-text-iron-500">
        <a
          href={buildMuseumRawUrl(collection.sourcePath)}
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
