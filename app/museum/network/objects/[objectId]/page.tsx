import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import {
  MuseumJsonDisclosure,
  MuseumMarkdown,
} from "@/components/museum/MuseumMarkdown";
import {
  MuseumSectionHeading,
  MuseumStatusBadge,
} from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumView } from "@/lib/museum/normalize";
import {
  museumSlugMatches,
  displayMuseumStatus,
  statusTone,
} from "@/lib/museum/presentation";
import { buildMuseumRawUrl } from "@/lib/museum/source";

interface MuseumObjectDetailProps {
  readonly params: Promise<{ objectId: string }>;
}

export async function generateMetadata({
  params,
}: MuseumObjectDetailProps): Promise<Metadata> {
  const { objectId } = await params;
  const view = await getMuseumView();
  const object = view.objects.find((item) =>
    museumSlugMatches(item.objectId, objectId)
  );
  return getAppMetadata({
    title: object?.title ?? t(DEFAULT_LOCALE, "museum.network.objects.title"),
    description:
      object?.scope ?? t(DEFAULT_LOCALE, "museum.network.objects.description"),
  });
}

export default async function MuseumObjectDetailPage({
  params,
}: MuseumObjectDetailProps) {
  const { objectId } = await params;
  const view = await getMuseumView();
  const object = view.objects.find((item) =>
    museumSlugMatches(item.objectId, objectId)
  );
  if (!object) notFound();
  const record = object.record as {
    readonly artist_statement?: unknown;
  };
  const artistStatement =
    typeof record.artist_statement === "object" &&
    record.artist_statement !== null &&
    !Array.isArray(record.artist_statement)
      ? (record.artist_statement as { readonly text?: unknown })
      : null;
  const statementText =
    typeof artistStatement?.text === "string" ? artistStatement.text : "";

  return (
    <article>
      <Link
        href="/museum/network/programs"
        className="hover:tw-text-primary-200 tw-text-sm tw-font-medium tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.objects.back")}
      </Link>
      <div className="tw-mt-8">
        <MuseumSectionHeading
          eyebrow={object.objectId}
          title={object.title}
          description={object.artist}
        />
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <MuseumStatusBadge
            label={displayMuseumStatus(object.status)}
            tone={statusTone(object.status)}
          />
          <MuseumStatusBadge
            label={t(
              DEFAULT_LOCALE,
              object.accessionLotId
                ? "museum.network.objects.accessioned"
                : "museum.network.objects.selectedNotAccessioned"
            )}
            tone={object.accessionLotId ? "success" : "warning"}
          />
        </div>
      </div>
      {object.classification && (
        <p className="tw-mt-6 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {object.classification}
        </p>
      )}
      {object.scope && (
        <p className="tw-mt-3 tw-max-w-3xl tw-text-xs tw-leading-5 tw-text-iron-500">
          {object.scope}
        </p>
      )}
      {statementText && (
        <section
          className="tw-mt-8 tw-max-w-3xl tw-rounded-2xl tw-border tw-border-white/10 tw-bg-iron-900/60 tw-p-5"
          aria-labelledby="object-statement-title"
        >
          <h2
            id="object-statement-title"
            className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white"
          >
            {t(DEFAULT_LOCALE, "museum.network.objects.statement")}
          </h2>
          <div className="tw-mt-5">
            <MuseumMarkdown>{statementText}</MuseumMarkdown>
          </div>
        </section>
      )}
      <div className="tw-mt-8">
        <MuseumJsonDisclosure
          label={t(DEFAULT_LOCALE, "museum.network.detail.technicalEvidence")}
          value={object.record}
        />
      </div>
      <p className="tw-mt-4 tw-text-xs tw-text-iron-500">
        <a
          href={buildMuseumRawUrl(object.sourcePath)}
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
