import type { MuseumPublication } from "@/lib/museum/publication/types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { MuseumJsonDisclosure, MuseumMarkdown } from "./MuseumMarkdown";

const STANDARD_SLUGS = [
  "spectrum",
  "cidoc-crm",
  "lido",
  "premis",
  "prov-o",
  "getty-aat-ulan",
  "iiif",
  "c2pa",
  "bagit",
  "ocfl",
  "caip-19",
] as const;

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
    architecture.standards.length !== STANDARD_SLUGS.length ||
    architecture.caseySchedule.objects.length !== 7
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
        standard.slug === STANDARD_SLUGS[index] &&
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
      value={{
        $schema: "../../schemas/museum-data-architecture-profile.schema.json",
        profile_id: architecture.id,
        profile_version: architecture.version,
        status: architecture.status,
        observed_on: architecture.observedOn,
        title: architecture.title,
        source_document: architecture.introduction.sourcePath,
        implementation_states: [
          "conceptual_mapping",
          "source_fields_present",
          "serialized",
          "validated",
          "operational",
        ],
        standards: architecture.standards.map((standard) => ({
          slug: standard.slug,
          name: standard.name,
          category: standard.category,
          human_question: standard.humanQuestion,
          authority: standard.authority,
          version: standard.version,
          authority_status: standard.authorityStatus,
          official_url: standard.officialUrl,
          document_path: standard.document.sourcePath,
          casey_state: standard.caseyState,
        })),
        case_study_path: architecture.caseyImplementation.sourcePath,
        case_study_data_path: architecture.caseySchedule.sourcePath,
        stream_convergence: {
          normative_for_profile: false,
          status: "deferred_until_museum_profile_release",
          document_path: "docs/stream-interoperability.md",
        },
      }}
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
      value={{
        $schema:
          "../../schemas/museum-data-architecture-case-study.schema.json",
        profile_id: schedule.profileId,
        accession_lot_id: schedule.accessionLotId,
        custody_transaction: schedule.custodyTransaction,
        custody_block: schedule.custodyBlock,
        evidence_manifest_path: schedule.evidenceManifestPath,
        metadata_digest_scope: schedule.metadataDigestScope,
        generator_digest_scope: schedule.generatorDigestScope,
        objects: schedule.objects.map((object) => ({
          object_id: object.objectId,
          title: object.title,
          caip19: object.caip19,
          custody_receipt_log: object.custodyReceiptLog,
          metadata_sha256: object.metadataSha256,
          generator_observation_sha256: object.generatorObservationSha256,
          generator_bytes_retained: object.generatorBytesRetained,
          accession_state: object.accessionState,
          preservation_state: object.preservationState,
        })),
      }}
    />
  );
}
