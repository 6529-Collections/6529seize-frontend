import { parseHeading } from "./legacyCaseyMarkdown";
import {
  MUSEUM_DATA_ARCHITECTURE_CASEY_AUDIT_TITLE,
  MUSEUM_DATA_ARCHITECTURE_STANDARDS,
} from "./dataArchitectureContract";
import type {
  MuseumDataArchitecture,
  MuseumDataArchitectureCaseStudy,
  MuseumDataArchitectureCaseyObject,
  MuseumDataArchitectureImplementationState,
  MuseumDataArchitectureStandard,
  MuseumPublicDocument,
  MuseumSourceDocument,
  MuseumSha256,
} from "./types";

const PROFILE_PATH = "docs/data-architecture/profile.json";
const OVERVIEW_PATH = "docs/data-architecture.md";
const CASEY_IMPLEMENTATION_PATH =
  "docs/data-architecture/casey-reas-implementation.md";
const CASEY_SCHEDULE_PATH =
  "docs/data-architecture/casey-reas-machine-schedule.json";

export const DATA_ARCHITECTURE_REQUIRED_PATHS = [
  PROFILE_PATH,
  OVERVIEW_PATH,
  ...MUSEUM_DATA_ARCHITECTURE_STANDARDS.map(
    ({ slug }) => `docs/data-architecture/${slug}.md` as const
  ),
  CASEY_IMPLEMENTATION_PATH,
  CASEY_SCHEDULE_PATH,
] as const;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredRecord(value: unknown): JsonRecord {
  if (!isRecord(value))
    throw new Error("publication_data_architecture_invalid");
  return value;
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("publication_data_architecture_invalid");
  }
  return value;
}

function requiredInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error("publication_data_architecture_invalid");
  }
  return value;
}

function source(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  path: string,
  mediaType: MuseumSourceDocument["mediaType"]
): MuseumSourceDocument {
  const document = documents.get(path);
  if (document?.mediaType !== mediaType) {
    throw new Error("publication_required_document_missing");
  }
  return document;
}

function jsonSource(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  path: string
): readonly [MuseumSourceDocument, JsonRecord] {
  const document = source(documents, path, "application/json");
  try {
    return [document, requiredRecord(JSON.parse(document.text) as unknown)];
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "publication_data_architecture_invalid"
    ) {
      throw error;
    }
    throw new Error("publication_data_architecture_json_invalid");
  }
}

function markdownDocument(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  path: string,
  id: string,
  title: string,
  kind: MuseumPublicDocument["kind"]
): MuseumPublicDocument {
  const document = source(documents, path, "text/markdown");
  if (parseHeading(document.text) !== title) {
    throw new Error("publication_data_architecture_title_mismatch");
  }
  return {
    id,
    kind,
    title,
    markdown: document.text,
    sha256: document.sha256,
    sourcePath: path,
    artistIds: [],
    projectIds: [],
    giftIds: [],
    artworkIds: [],
  };
}

function implementationState(
  value: unknown
): MuseumDataArchitectureImplementationState {
  if (
    value !== "conceptual_mapping" &&
    value !== "source_fields_present" &&
    value !== "serialized" &&
    value !== "validated" &&
    value !== "operational"
  ) {
    throw new Error("publication_data_architecture_invalid");
  }
  return value;
}

function sha256(value: unknown): MuseumSha256 {
  const digest = requiredString(value);
  if (!/^sha256:[0-9a-f]{64}$/u.test(digest)) {
    throw new Error("publication_data_architecture_invalid");
  }
  return digest as MuseumSha256;
}

function parseCaseyObject(value: unknown): MuseumDataArchitectureCaseyObject {
  const item = requiredRecord(value);
  const caip19 = requiredString(item["caip19"]);
  if (!/^eip155:1\/erc721:0x[0-9a-f]{40}\/[0-9]+$/u.test(caip19)) {
    throw new Error("publication_data_architecture_invalid");
  }
  if (
    item["generator_bytes_retained"] !== false ||
    item["accession_state"] !== "accessioned" ||
    item["preservation_state"] !== "in_progress"
  ) {
    throw new Error("publication_data_architecture_invalid");
  }
  return {
    objectId: requiredString(item["object_id"]),
    title: requiredString(item["title"]),
    caip19,
    custodyReceiptLog: requiredInteger(item["custody_receipt_log"]),
    metadataSha256: sha256(item["metadata_sha256"]),
    generatorObservationSha256: sha256(item["generator_observation_sha256"]),
    generatorBytesRetained: false,
    accessionState: "accessioned",
    preservationState: "in_progress",
  };
}

function parseCaseySchedule(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  expectedArtworks: ReadonlyMap<string, string>
): MuseumDataArchitectureCaseStudy {
  const [document, value] = jsonSource(documents, CASEY_SCHEDULE_PATH);
  const objectsValue = value["objects"];
  if (!Array.isArray(objectsValue) || objectsValue.length !== 7) {
    throw new Error("publication_data_architecture_invalid");
  }
  const objects = objectsValue.map(parseCaseyObject);
  const objectIds = new Set(objects.map(({ objectId }) => objectId));
  if (
    objectIds.size !== 7 ||
    objectIds.size !== expectedArtworks.size ||
    objects.some(
      ({ objectId, title }) => expectedArtworks.get(objectId) !== title
    ) ||
    value["profile_id"] !== "6529NM_DATA_ARCHITECTURE_V1" ||
    value["accession_lot_id"] !== "6529NM.2026.001"
  ) {
    throw new Error("publication_data_architecture_casey_mismatch");
  }
  const custodyTransaction = requiredString(value["custody_transaction"]);
  if (!/^0x[0-9a-f]{64}$/u.test(custodyTransaction)) {
    throw new Error("publication_data_architecture_invalid");
  }
  return {
    profileId: "6529NM_DATA_ARCHITECTURE_V1",
    accessionLotId: "6529NM.2026.001",
    custodyTransaction,
    custodyBlock: requiredInteger(value["custody_block"]),
    evidenceManifestPath: requiredString(value["evidence_manifest_path"]),
    metadataDigestScope: requiredString(value["metadata_digest_scope"]),
    generatorDigestScope: requiredString(value["generator_digest_scope"]),
    objects,
    sourceJson: document.text,
    sourcePath: CASEY_SCHEDULE_PATH,
    sha256: document.sha256,
  };
}

export function assembleDataArchitecture(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  expectedArtworks: ReadonlyMap<string, string>
): MuseumDataArchitecture {
  const [profileDocument, profile] = jsonSource(documents, PROFILE_PATH);
  const standardsValue = profile["standards"];
  const implementationStates = profile["implementation_states"];
  const streamConvergence = requiredRecord(profile["stream_convergence"]);
  if (
    profile["profile_id"] !== "6529NM_DATA_ARCHITECTURE_V1" ||
    profile["profile_version"] !== "1.0.0" ||
    profile["status"] !== "working_standard" ||
    profile["source_document"] !== OVERVIEW_PATH ||
    profile["case_study_path"] !== CASEY_IMPLEMENTATION_PATH ||
    profile["case_study_data_path"] !== CASEY_SCHEDULE_PATH ||
    !Array.isArray(implementationStates) ||
    implementationStates.join("|") !==
      "conceptual_mapping|source_fields_present|serialized|validated|operational" ||
    streamConvergence["normative_for_profile"] !== false ||
    streamConvergence["status"] !== "deferred_until_museum_profile_release" ||
    streamConvergence["document_path"] !== "docs/stream-interoperability.md" ||
    !Array.isArray(standardsValue) ||
    standardsValue.length !== MUSEUM_DATA_ARCHITECTURE_STANDARDS.length
  ) {
    throw new Error("publication_data_architecture_invalid");
  }

  const title = requiredString(profile["title"]);
  const introduction = markdownDocument(
    documents,
    OVERVIEW_PATH,
    "data-architecture:overview",
    title,
    "data_architecture_overview"
  );
  const standards = standardsValue.map(
    (candidate, index): MuseumDataArchitectureStandard => {
      const contract = MUSEUM_DATA_ARCHITECTURE_STANDARDS[index];
      if (contract === undefined) {
        throw new Error("publication_data_architecture_invalid");
      }
      const { slug, title: documentTitle } = contract;
      const item = requiredRecord(candidate);
      const documentPath = `docs/data-architecture/${slug}.md`;
      if (item["slug"] !== slug || item["document_path"] !== documentPath) {
        throw new Error("publication_data_architecture_invalid");
      }
      const officialUrl = requiredString(item["official_url"]);
      if (!officialUrl.startsWith("https://")) {
        throw new Error("publication_data_architecture_invalid");
      }
      return {
        slug,
        name: requiredString(item["name"]),
        category: requiredString(item["category"]),
        humanQuestion: requiredString(item["human_question"]),
        authority: requiredString(item["authority"]),
        version: requiredString(item["version"]),
        authorityStatus: requiredString(item["authority_status"]),
        officialUrl,
        caseyState: implementationState(item["casey_state"]),
        document: markdownDocument(
          documents,
          documentPath,
          `data-architecture:${slug}`,
          documentTitle,
          "data_architecture_standard"
        ),
      };
    }
  );
  const caseyImplementation = markdownDocument(
    documents,
    CASEY_IMPLEMENTATION_PATH,
    "data-architecture:casey-reas-implementation",
    MUSEUM_DATA_ARCHITECTURE_CASEY_AUDIT_TITLE,
    "data_architecture_case_study"
  );

  return {
    id: "6529NM_DATA_ARCHITECTURE_V1",
    version: "1.0.0",
    status: "working_standard",
    observedOn: requiredString(profile["observed_on"]),
    title,
    introduction,
    standards,
    caseyImplementation,
    caseySchedule: parseCaseySchedule(documents, expectedArtworks),
    profileJson: profileDocument.text,
    profileSourcePath: PROFILE_PATH,
    profileSha256: profileDocument.sha256,
  };
}

export function dataArchitectureDocuments(
  architecture: MuseumDataArchitecture
): readonly MuseumPublicDocument[] {
  return [
    architecture.introduction,
    ...architecture.standards.map(({ document }) => document),
    architecture.caseyImplementation,
  ];
}
