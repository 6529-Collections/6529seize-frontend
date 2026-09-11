import type { MuseumPublication } from "@/lib/museum/publication/types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MUSEUM_DATA_ARCHITECTURE_STANDARD_SLUGS } from "@/lib/museum/publication/dataArchitectureContract";
import { MuseumJsonDisclosure, MuseumMarkdown } from "./MuseumMarkdown";

export function dataArchitecturePublicationIsComplete(
  publication: MuseumPublication | null
): publication is MuseumPublication {
  if (publication === null) return false;
  const architecture = (publication as Partial<MuseumPublication>)
    .dataArchitecture;
  if (
    architecture?.id !== "6529NM_DATA_ARCHITECTURE_V1" ||
    architecture.introduction.sourcePath !== "docs/data-architecture.md" ||
    architecture.caseyImplementation.sourcePath !==
      "docs/data-architecture/casey-reas-implementation.md" ||
    architecture.caseySchedule.sourcePath !==
      "docs/data-architecture/casey-reas-machine-schedule.json" ||
    architecture.profileSourcePath !== "docs/data-architecture/profile.json" ||
    architecture.standards.length !==
      MUSEUM_DATA_ARCHITECTURE_STANDARD_SLUGS.length ||
    architecture.caseySchedule.objects.length !== 7 ||
    typeof architecture.profileJson !== "string" ||
    typeof architecture.caseySchedule.sourceJson !== "string" ||
    architecture.profileJson.trim().length === 0 ||
    architecture.caseySchedule.sourceJson.trim().length === 0
  ) {
    return false;
  }
  const declared = new Set(publication.declaredSourcePaths);
  const artworkIds = new Set(publication.artworks.map(({ id }) => id));
  const documents = [
    architecture.introduction,
    ...architecture.standards.map(({ document }) => document),
    architecture.caseyImplementation,
  ];
  return (
    architecture.standards.every(
      (standard, index) =>
        standard.slug === MUSEUM_DATA_ARCHITECTURE_STANDARD_SLUGS[index] &&
        standard.document.sourcePath ===
          `docs/data-architecture/${standard.slug}.md`
    ) &&
    architecture.caseySchedule.objects.every(({ objectId }) =>
      artworkIds.has(objectId)
    ) &&
    documents.every(
      (document) =>
        declared.has(document.sourcePath) &&
        publication.documents.some(
          (candidate) =>
            candidate.id === document.id &&
            candidate.sourcePath === document.sourcePath
        )
    ) &&
    declared.has(architecture.profileSourcePath) &&
    declared.has(architecture.caseySchedule.sourcePath)
  );
}

export function DataArchitectureManuscript({
  markdown,
  sourceCommit,
  sourcePath,
}: {
  readonly markdown: string;
  readonly sourceCommit: string;
  readonly sourcePath: string;
}) {
  return (
    <MuseumMarkdown
      embeddedDocument
      documentHeadings
      sourceCommit={sourceCommit}
      sourcePath={sourcePath}
      className="tw-text-base"
    >
      {markdown}
    </MuseumMarkdown>
  );
}

export function DataArchitectureProfileDisclosure({
  publication,
}: {
  readonly publication: MuseumPublication;
}) {
  const architecture = publication.dataArchitecture;
  return (
    <MuseumJsonDisclosure
      label={t(
        DEFAULT_LOCALE,
        "museum.network.dataArchitecture.profileDisclosure"
      )}
      sourceJson={architecture.profileJson}
    />
  );
}

export function DataArchitectureScheduleDisclosure({
  publication,
}: {
  readonly publication: MuseumPublication;
}) {
  const schedule = publication.dataArchitecture.caseySchedule;
  return (
    <MuseumJsonDisclosure
      label={t(
        DEFAULT_LOCALE,
        "museum.network.dataArchitecture.scheduleDisclosure"
      )}
      sourceJson={schedule.sourceJson}
    />
  );
}
