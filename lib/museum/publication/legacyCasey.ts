import { assertApprovedArtBlocksUrl } from "./security";
import {
  assembleDataArchitecture,
  dataArchitectureDocuments,
} from "./dataArchitecture";
import {
  assembleInstitutionalPractice,
  institutionalPracticeDocuments,
} from "./institutionalPractice";
import { parseHeading } from "./legacyCaseyMarkdown";
import {
  CASEY_ACCESSION_ID,
  CASEY_ARTIST_ID,
  CASEY_GIFT_AUTHORIZATION_PATH,
  CASEY_OBJECT_IDS,
  CASEY_OBJECT_PATHS,
  CASEY_VISUAL_OBSERVATION_PATH,
} from "./legacyCaseyIdentifiers";
import { PROJECT_PUBLIC_DOCUMENTS } from "./legacyCaseyProjectDocuments";
import {
  assembleRightsHandbook,
  rightsCreditForObject,
  rightsHandbookDocuments,
} from "./rightsHandbook";
import {
  CASEY_PUBLIC_DOCUMENTS,
  LEGACY_CASEY_REQUIRED_PATHS,
  PROJECT_CONTRACTS,
  artworkIdsForDocument,
} from "./legacyCaseyContracts";
import type {
  MuseumAccessionedArtwork,
  MuseumArtist,
  MuseumGift,
  MuseumMedia,
  MuseumProject,
  MuseumPublication,
  MuseumPublicationAssembler,
  MuseumPublicationAssemblyContext,
  MuseumPublicDocument,
  MuseumRightsCredit,
  MuseumSourceDocument,
} from "./types";
export { LEGACY_CASEY_REQUIRED_PATHS };

type JsonRecord = Record<string, unknown>;

interface CaseyArtworkDraft {
  readonly objectId: string;
  readonly accessionLotId: string;
  readonly title: string;
  readonly artistName: string;
  readonly projectName: keyof typeof PROJECT_CONTRACTS;
  readonly projectPlatform: string;
  readonly projectReleaseYear: number;
  readonly medium: string;
  readonly creditLine: string;
  readonly licenseLabel: string | null;
  readonly sourcePath: string;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredRecord(value: unknown, code: string): JsonRecord {
  if (!isRecord(value)) {
    throw new Error(code);
  }
  return value;
}

function requiredString(value: unknown, code: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(code);
  }
  return value;
}

function requiredInteger(value: unknown, code: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new TypeError(code);
  }
  return value;
}

function requiredDocument(
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

function parseJsonDocument(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  path: string
): JsonRecord {
  const document = requiredDocument(documents, path, "application/json");
  try {
    return requiredRecord(
      JSON.parse(document.text) as unknown,
      "publication_required_json_shape"
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "publication_required_json_shape"
    ) {
      throw error;
    }
    throw new Error("publication_required_json_invalid");
  }
}

function sourcePayload(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  path: string
): JsonRecord {
  const record = parseJsonDocument(documents, path);
  return requiredRecord(record["payload"], "publication_payload_missing");
}

function parseCaseyObject(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  path: string,
  expectedObjectId: string
): CaseyArtworkDraft {
  const payload = sourcePayload(documents, path);
  const objectId = requiredString(
    payload["object_id"],
    "publication_object_id_missing"
  );
  if (objectId !== expectedObjectId) {
    throw new Error("publication_object_id_mismatch");
  }
  if (payload["current_state"] !== "accessioned") {
    throw new Error("publication_casey_not_accessioned");
  }

  const accessionLotId = requiredString(
    payload["accession_lot_id"],
    "publication_accession_id_missing"
  );
  if (accessionLotId !== CASEY_ACCESSION_ID) {
    throw new Error("publication_accession_id_mismatch");
  }

  const artist = requiredRecord(
    payload["artist"],
    "publication_artist_missing"
  );
  const project = requiredRecord(
    payload["project"],
    "publication_project_missing"
  );
  const projectName = requiredString(
    project["name"],
    "publication_project_name_missing"
  );
  if (!Object.hasOwn(PROJECT_CONTRACTS, projectName)) {
    throw new Error("publication_unknown_casey_project");
  }

  const licenseValue = project["platform_metadata_license_label"];
  if (licenseValue !== undefined && typeof licenseValue !== "string") {
    throw new Error("publication_license_label_invalid");
  }

  return {
    objectId,
    accessionLotId,
    title: requiredString(payload["title"], "publication_title_missing"),
    artistName: requiredString(
      artist["preferred_name"],
      "publication_artist_name_missing"
    ),
    projectName: projectName as keyof typeof PROJECT_CONTRACTS,
    projectPlatform: requiredString(
      project["platform"],
      "publication_project_platform_missing"
    ),
    projectReleaseYear: requiredInteger(
      project["release_year"],
      "publication_project_year_missing"
    ),
    medium: requiredString(payload["medium"], "publication_medium_missing"),
    creditLine: requiredString(
      payload["credit_line"],
      "publication_credit_line_missing"
    ),
    licenseLabel: typeof licenseValue === "string" ? licenseValue : null,
    sourcePath: path,
  };
}

function compareIdentifiers(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return left.localeCompare(right);
}

function parsePublicDocuments(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  projectByArtwork: ReadonlyMap<string, string>
): MuseumPublicDocument[] {
  const allProjectIds = [...new Set(projectByArtwork.values())].sort(
    compareIdentifiers
  );
  const sharedDocuments = CASEY_PUBLIC_DOCUMENTS.map(
    (contract): MuseumPublicDocument => {
      const source = requiredDocument(
        documents,
        contract.path,
        "text/markdown"
      );
      const projectId =
        contract.artworkId === null
          ? null
          : (projectByArtwork.get(contract.artworkId) ?? null);
      if (contract.artworkId !== null && projectId === null) {
        throw new Error("publication_document_relation_missing");
      }

      let projectIds: readonly string[] = [];
      if (
        contract.relation === "collection" ||
        contract.relation === "research"
      ) {
        projectIds = allProjectIds;
      } else if (projectId !== null) {
        projectIds = [projectId];
      }

      return {
        id: contract.id,
        kind: contract.kind,
        title: parseHeading(source.text),
        markdown: source.text,
        sha256: source.sha256,
        sourcePath: contract.path,
        artistIds: contract.relation === "institution" ? [] : [CASEY_ARTIST_ID],
        projectIds,
        giftIds:
          contract.relation === "artist" || contract.relation === "institution"
            ? []
            : [CASEY_ACCESSION_ID],
        artworkIds: artworkIdsForDocument(contract),
      };
    }
  );

  const projectDocuments = PROJECT_PUBLIC_DOCUMENTS.map(
    (contract): MuseumPublicDocument => {
      const source = requiredDocument(
        documents,
        contract.path,
        "text/markdown"
      );
      const projectId = PROJECT_CONTRACTS[contract.projectName].id;
      const artworkIds = [...projectByArtwork.entries()]
        .filter(([, artworkProjectId]) => artworkProjectId === projectId)
        .map(([artworkId]) => artworkId)
        .sort(compareIdentifiers);
      if (artworkIds.length === 0) {
        throw new Error("publication_project_document_relation_missing");
      }

      return {
        id: contract.id,
        kind: "project_essay",
        title: parseHeading(source.text),
        markdown: source.text,
        sha256: source.sha256,
        sourcePath: contract.path,
        artistIds: [CASEY_ARTIST_ID],
        projectIds: [projectId],
        giftIds: [CASEY_ACCESSION_ID],
        artworkIds,
      };
    }
  );

  return [...sharedDocuments, ...projectDocuments];
}

function mediaForArtwork(
  visualObject: JsonRecord,
  artwork: CaseyArtworkDraft,
  rightsCredit: MuseumRightsCredit
): readonly MuseumMedia[] {
  if (visualObject["object_id"] !== artwork.objectId) {
    throw new Error("publication_media_object_mismatch");
  }

  const rawMetadata = requiredRecord(
    visualObject["raw_metadata_source"],
    "publication_media_metadata_missing"
  );
  const staticCapture = requiredRecord(
    visualObject["static_capture"],
    "publication_static_capture_missing"
  );
  const liveCapture = requiredRecord(
    visualObject["live_capture"],
    "publication_live_capture_missing"
  );
  const staticRetention = requiredRecord(
    staticCapture["retention"],
    "publication_static_retention_missing"
  );
  const liveRetention = requiredRecord(
    liveCapture["retention"],
    "publication_live_retention_missing"
  );
  if (
    staticRetention["bytes_retained_in_public_repository"] !== false ||
    liveRetention["bytes_retained_in_public_repository"] !== false
  ) {
    throw new Error("publication_legacy_media_retention_changed");
  }

  const imageUrl = assertApprovedArtBlocksUrl(
    requiredString(rawMetadata["image_url"], "publication_static_url_missing"),
    "still"
  );
  const generatorUrl = assertApprovedArtBlocksUrl(
    requiredString(
      rawMetadata["generator_url"],
      "publication_live_url_missing"
    ),
    "live"
  );
  if (
    staticCapture["source_url"] !== imageUrl ||
    liveCapture["source_url"] !== generatorUrl
  ) {
    throw new Error("publication_media_source_mismatch");
  }

  const mediaTypeValue = staticCapture["media_type"];
  if (mediaTypeValue !== undefined && typeof mediaTypeValue !== "string") {
    throw new Error("publication_media_type_invalid");
  }

  return [
    {
      id: `${artwork.objectId}:upstream-still`,
      artworkId: artwork.objectId,
      kind: "still",
      role: "fallback",
      custody: "upstream",
      url: imageUrl,
      mediaType: typeof mediaTypeValue === "string" ? mediaTypeValue : null,
      width: null,
      height: null,
      altText: null,
      preservationStatus: "not_retained",
      sha256: null,
      upstreamProvider: "art_blocks",
      credit: rightsCredit,
      sourcePath: CASEY_VISUAL_OBSERVATION_PATH,
    },
    {
      id: `${artwork.objectId}:upstream-live`,
      artworkId: artwork.objectId,
      kind: "live",
      role: "source",
      custody: "upstream",
      url: generatorUrl,
      mediaType: null,
      width: null,
      height: null,
      altText: null,
      preservationStatus: "not_retained",
      sha256: null,
      upstreamProvider: "art_blocks",
      credit: rightsCredit,
      sourcePath: CASEY_VISUAL_OBSERVATION_PATH,
    },
  ];
}

function visualObjectsById(
  documents: ReadonlyMap<string, MuseumSourceDocument>
): ReadonlyMap<string, JsonRecord> {
  const payload = sourcePayload(documents, CASEY_VISUAL_OBSERVATION_PATH);
  const objectsValue = payload["objects"];
  if (!Array.isArray(objectsValue) || objectsValue.length !== 7) {
    throw new Error("publication_casey_media_incomplete");
  }

  const entries = objectsValue.map((value): readonly [string, JsonRecord] => {
    const record = requiredRecord(value, "publication_media_entry_invalid");
    return [
      requiredString(record["object_id"], "publication_media_object_missing"),
      record,
    ];
  });
  const result = new Map(entries);
  if (
    result.size !== CASEY_OBJECT_IDS.length ||
    CASEY_OBJECT_IDS.some((objectId) => !result.has(objectId))
  ) {
    throw new Error("publication_casey_media_incomplete");
  }
  return result;
}

function parseGift(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  documentIds: readonly string[]
): MuseumGift {
  const payload = sourcePayload(documents, CASEY_GIFT_AUTHORIZATION_PATH);
  const completionBoundary = requiredRecord(
    payload["completion_boundary"],
    "publication_gift_completion_missing"
  );
  const assets = payload["assets"];
  if (
    payload["acquisition_method"] !== "donation" ||
    payload["authorization_status"] !== "formally_accepted" ||
    completionBoundary["current_state"] !== "accessioned" ||
    !Array.isArray(assets)
  ) {
    throw new Error("publication_gift_status_invalid");
  }

  const assetIds = assets.map((asset) =>
    requiredString(
      requiredRecord(asset, "publication_gift_asset_invalid")["object_id"],
      "publication_gift_asset_id_missing"
    )
  );
  if (
    new Set(assetIds).size !== CASEY_OBJECT_IDS.length ||
    CASEY_OBJECT_IDS.some((objectId) => !assetIds.includes(objectId))
  ) {
    throw new Error("publication_casey_gift_incomplete");
  }

  const subjectId = requiredString(
    payload["subject_id"],
    "publication_gift_subject_missing"
  );
  if (subjectId !== CASEY_ACCESSION_ID) {
    throw new Error("publication_gift_subject_mismatch");
  }

  return {
    id: subjectId,
    accessionLotId: subjectId,
    authorizationId: requiredString(
      payload["authorization_id"],
      "publication_gift_authorization_missing"
    ),
    acquisitionMethod: "donation",
    institutionalStatus: "accessioned",
    donorPublicCredit: requiredString(
      payload["donor_public_credit"],
      "publication_gift_credit_missing"
    ),
    acceptedAt: requiredString(
      payload["formal_acceptance_date"],
      "publication_gift_date_missing"
    ),
    artworkIds: [...CASEY_OBJECT_IDS],
    documentIds,
    sourcePath: CASEY_GIFT_AUTHORIZATION_PATH,
  };
}

function buildProjects(
  drafts: readonly CaseyArtworkDraft[],
  documents: readonly MuseumPublicDocument[]
): MuseumProject[] {
  const grouped = new Map<
    keyof typeof PROJECT_CONTRACTS,
    CaseyArtworkDraft[]
  >();
  for (const draft of drafts) {
    const group = grouped.get(draft.projectName) ?? [];
    group.push(draft);
    grouped.set(draft.projectName, group);
  }

  return [...grouped.entries()]
    .map(([name, artworks]): MuseumProject => {
      const first = artworks[0];
      if (first === undefined) {
        throw new Error("publication_project_empty");
      }
      if (
        artworks.some(
          (artwork) =>
            artwork.projectPlatform !== first.projectPlatform ||
            artwork.projectReleaseYear !== first.projectReleaseYear
        )
      ) {
        throw new Error("publication_project_metadata_conflict");
      }

      const contract = PROJECT_CONTRACTS[name];
      return {
        id: contract.id,
        slug: contract.slug,
        title: name,
        artistId: CASEY_ARTIST_ID,
        platform: first.projectPlatform,
        releaseYear: first.projectReleaseYear,
        artworkIds: artworks.map((artwork) => artwork.objectId),
        documentIds: documents
          .filter((document) => document.projectIds.includes(contract.id))
          .map((document) => document.id),
        sourcePaths: artworks.map((artwork) => artwork.sourcePath),
      };
    })
    .sort((left, right) => left.title.localeCompare(right.title));
}

function assembleLegacyCaseyPublication(
  context: MuseumPublicationAssemblyContext
): MuseumPublication {
  const drafts = CASEY_OBJECT_PATHS.map((path, index) => {
    const expectedObjectId = CASEY_OBJECT_IDS[index];
    if (expectedObjectId === undefined) {
      throw new Error("publication_casey_contract_invalid");
    }
    return parseCaseyObject(context.documents, path, expectedObjectId);
  });
  if (drafts.some((draft) => draft.artistName !== "Casey REAS")) {
    throw new Error("publication_casey_artist_mismatch");
  }

  const projectByArtwork = new Map(
    drafts.map((draft): readonly [string, string] => [
      draft.objectId,
      PROJECT_CONTRACTS[draft.projectName].id,
    ])
  );
  const publicDocuments = parsePublicDocuments(
    context.documents,
    projectByArtwork
  );
  const institutionalPractice = assembleInstitutionalPractice(
    context.documents
  );
  const dataArchitecture = assembleDataArchitecture(
    context.documents,
    new Map(drafts.map(({ objectId, title }) => [objectId, title]))
  );
  const rightsHandbook = assembleRightsHandbook(context.documents);
  const allPublicDocuments = [
    ...publicDocuments,
    ...institutionalPracticeDocuments(institutionalPractice),
    ...dataArchitectureDocuments(dataArchitecture),
    ...rightsHandbookDocuments(rightsHandbook),
  ];
  const visualObjects = visualObjectsById(context.documents);

  const artworks = drafts.map((draft): MuseumAccessionedArtwork => {
    const rightsCredit = rightsCreditForObject(rightsHandbook, {
      id: draft.objectId,
      creditLine: draft.creditLine,
      licenseLabel: draft.licenseLabel,
      sourcePath: draft.sourcePath,
    });
    const visualObject = visualObjects.get(draft.objectId);
    if (visualObject === undefined) {
      throw new Error("publication_casey_media_incomplete");
    }

    return {
      id: draft.objectId,
      title: draft.title,
      artistId: CASEY_ARTIST_ID,
      projectId: PROJECT_CONTRACTS[draft.projectName].id,
      medium: draft.medium,
      institutionalStatus: "accessioned",
      accessionLotId: draft.accessionLotId,
      giftId: CASEY_ACCESSION_ID,
      programId: null,
      rightsCredit,
      media: mediaForArtwork(visualObject, draft, rightsCredit),
      documentIds: publicDocuments
        .filter((document) => document.artworkIds.includes(draft.objectId))
        .map((document) => document.id),
      sourcePath: draft.sourcePath,
    };
  });

  const projects = buildProjects(drafts, publicDocuments);
  const giftDocumentIds = publicDocuments
    .filter((document) => document.giftIds.includes(CASEY_ACCESSION_ID))
    .map((document) => document.id);
  const gift = parseGift(context.documents, giftDocumentIds);
  const artist: MuseumArtist = {
    id: CASEY_ARTIST_ID,
    slug: CASEY_ARTIST_ID,
    preferredName: "Casey REAS",
    projectIds: projects.map((project) => project.id),
    artworkIds: artworks.map((artwork) => artwork.id),
    documentIds: publicDocuments
      .filter((document) => document.artistIds.includes(CASEY_ARTIST_ID))
      .map((document) => document.id),
    sourcePaths: drafts.map((draft) => draft.sourcePath),
  };

  return {
    identity: context.identity,
    declaredSourcePaths: context.declaredSourcePaths,
    artists: [artist],
    projects,
    gifts: [gift],
    artworks,
    documents: allPublicDocuments,
    institutionalPractice,
    dataArchitecture,
    rightsHandbook,
  };
}

export const legacyCaseyPublicationAssembler: MuseumPublicationAssembler = {
  requiredPaths: LEGACY_CASEY_REQUIRED_PATHS,
  assemble: assembleLegacyCaseyPublication,
};
