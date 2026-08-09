import type { Metadata } from "next";
import Link from "next/link";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumSectionHeading } from "@/components/museum/MuseumShell";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { MuseumPublication, MuseumPublicDocument } from "@/lib/museum/publication/types";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { museumResearchHref } from "@/lib/museum/publication/routes";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";
import { museumDocumentKindLabelKey } from "@/lib/museum/publication/documentLabels";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.research.title"),
  description: t(DEFAULT_LOCALE, "museum.network.research.description"),
});

export type MuseumResearchGroup = "art" | "practice" | "methods";

export interface MuseumResearchIndexEntry {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly group: MuseumResearchGroup;
  readonly sourcePath: string;
  readonly typed: boolean;
  readonly document?: MuseumPublicDocument;
  readonly publicationUri?: string;
}

function researchGroup(value: string): MuseumResearchGroup {
  const normalized = value.toLocaleLowerCase();
  if (/(?:artist|project|work|acquisition|close|reading)/u.test(normalized)) {
    return "art";
  }
  if (/(?:institution|accession|rights|preservation|data|practice)/u.test(normalized)) {
    return "practice";
  }
  return "methods";
}

function documentGroup(document: MuseumPublicDocument): MuseumResearchGroup {
  if (
    document.kind === "collection_essay" ||
    document.kind === "gift_narrative" ||
    document.kind === "artist_practice" ||
    document.kind === "project_essay" ||
    document.kind === "object_entry" ||
    document.kind === "acquisition_essay" ||
    document.kind === "program_essay"
  ) {
    return "art";
  }
  if (
    document.kind === "institutional_practice_study" ||
    document.kind === "institutional_practice_adjacent" ||
    document.kind === "institution_profile" ||
    document.kind === "data_architecture_overview" ||
    document.kind === "data_architecture_standard" ||
    document.kind === "data_architecture_case_study" ||
    document.kind === "rights_handbook" ||
    document.kind === "rights_artist_guide" ||
    document.kind === "rights_collector_guide"
  ) {
    return "practice";
  }
  return "methods";
}

export function buildMuseumResearchIndex(
  publication: MuseumPublication
): readonly MuseumResearchIndexEntry[] {
  const typed = publication.researchPublications ?? [];
  const typedEntries = typed.flatMap((record) => {
    const document = publication.documents.find(
      (candidate) =>
        candidate.id === record.id ||
        buildImmutableMuseumBlobUrl(
          publication.identity.commit,
          candidate.sourcePath
        ) === record.publicationUri
    );
    const immutablePublicationUri = document === undefined
      ? null
      : buildImmutableMuseumBlobUrl(
          publication.identity.commit,
          document.sourcePath
        );
    if (
      document === undefined ||
      immutablePublicationUri === null ||
      immutablePublicationUri !== record.publicationUri
    ) {
      return [];
    }
    return [{
      id: record.id,
      slug: record.slug,
      title: record.title,
      group: researchGroup(record.publicationKind),
      sourcePath: record.sourcePath,
      typed: true,
      publicationUri: immutablePublicationUri,
      document,
    }];
  });
  const representedDocumentIds = new Set(
    typedEntries.map((entry) => entry.document.id)
  );
  const documentEntries = publication.documents
    .filter((document) => document.kind !== "founding_principles" && document.kind !== "open_museum_statement")
    .filter((document) => !representedDocumentIds.has(document.id))
    .map((document) => ({
      id: document.id,
      slug: document.id,
      title: document.title,
      group: documentGroup(document),
      sourcePath: document.sourcePath,
      typed: false,
      document,
    }));
  return [...typedEntries, ...documentEntries];
}

const GROUPS: readonly [MuseumResearchGroup, MessageKey, MessageKey][] = [
  ["art", "museum.network.research.artAndArtists", "museum.network.research.artAndArtistsDescription"],
  ["practice", "museum.network.research.museumPractice", "museum.network.research.museumPracticeDescription"],
  ["methods", "museum.network.research.sourcesMethods", "museum.network.research.sourcesMethodsDescription"],
];

export default async function MuseumResearchPage() {
  const publication = (await getMuseumPublicationState()).publication;
  if (publication === null) return <MuseumPublicationUnavailable />;
  const entries = buildMuseumResearchIndex(publication);

  return (
    <section>
      <MuseumSectionHeading
        eyebrow={t(DEFAULT_LOCALE, "museum.network.research.indexEyebrow")}
        title={t(DEFAULT_LOCALE, "museum.network.research.indexTitle")}
        description={t(DEFAULT_LOCALE, "museum.network.research.indexDescription")}
      />
      <div className="tw-space-y-12">
        {GROUPS.map(([group, titleKey, descriptionKey]) => {
          const groupEntries = entries.filter((entry) => entry.group === group);
          if (groupEntries.length === 0) return null;
          return (
            <section key={group} aria-labelledby={`research-${group}-title`}>
              <h2 id={`research-${group}-title`} className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">{t(DEFAULT_LOCALE, titleKey)}</h2>
              <p className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">{t(DEFAULT_LOCALE, descriptionKey)}</p>
              <ul className="tw-m-0 tw-mt-5 tw-list-none tw-border-y tw-border-solid tw-border-iron-800 tw-p-0">
                {groupEntries.map((entry) => (
                  <li key={entry.id} className="tw-border-b tw-border-solid tw-border-iron-800 last:tw-border-b-0">
                    <Link
                      href={museumResearchHref(entry.slug)}
                      className="tw-flex tw-min-h-20 tw-flex-col tw-justify-center tw-gap-1 tw-py-5 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                    >
                      <span className="tw-text-lg tw-font-semibold tw-text-iron-50 hover:tw-text-primary-200">{entry.title}</span>
                      <span className="tw-text-sm tw-text-iron-500">
                        {t(
                          DEFAULT_LOCALE,
                          museumDocumentKindLabelKey(entry.document?.kind ?? "source_record")
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}
