import type { Metadata } from "next";
import Link from "next/link";
import { getAppMetadata } from "@/components/providers/metadata";
import { MuseumRecordCard } from "@/components/museum/MuseumRecordCard";
import {
  MuseumSectionHeading,
  MuseumStatusBadge,
} from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumView } from "@/lib/museum/normalize";
import {
  displayMuseumStatus,
  museumSlug,
  statusTone,
} from "@/lib/museum/presentation";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.collections.title"),
  description: t(DEFAULT_LOCALE, "museum.network.collections.description"),
});

export default async function MuseumCollectionsPage() {
  const view = await getMuseumView();

  return (
    <section aria-labelledby="museum-collections-title">
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.explore.collections")}
        title={t(DEFAULT_LOCALE, "museum.network.collections.title")}
        description={t(
          DEFAULT_LOCALE,
          "museum.network.collections.description"
        )}
      />
      {view.approvedCollections.length === 0 ? (
        <p className="tw-m-0 tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5 tw-text-sm tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.collections.empty")}
        </p>
      ) : (
        <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
          {view.approvedCollections.map((collection) => (
            <MuseumRecordCard
              key={collection.approvalId}
              href={`/museum/network/collections/${museumSlug(collection.approvalId)}`}
              eyebrow={collection.category}
              title={collection.preferredName}
              description={collection.scopeDefinition}
              meta={collection.decisionId}
            >
              <MuseumStatusBadge
                label={displayMuseumStatus(collection.status)}
                tone={statusTone(collection.status)}
              />
            </MuseumRecordCard>
          ))}
        </div>
      )}
      <Link
        href="/museum/network"
        className="hover:tw-text-primary-200 tw-mt-8 tw-inline-flex tw-text-sm tw-font-medium tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.notFound.back")}
      </Link>
    </section>
  );
}
