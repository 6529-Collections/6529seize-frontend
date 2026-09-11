import type {
  MuseumPublication,
  MuseumPublicEntityRecord,
  MuseumPublicEntityGraph,
  MuseumSourceDocument,
} from "./types";

const VERA_MOLNAR_ACCESSION_ID = "6529NM.2026.003" as const;
const VERA_MOLNAR_ACCESSION_ENTITY_ID = "6529NM-ACC-ENT-0003" as const;
export const VERA_MOLNAR_OBJECT_ID = "6529NM.2026.003.01" as const;
const VERA_MOLNAR_CUSTODY_BLOCK = 25_816_984 as const;
export const VERA_MOLNAR_ARTIST_SLUG = "vera-molnar" as const;
export const MARTIN_GRASSER_ARTIST_SLUG = "martin-grasser" as const;

export const VERA_MOLNAR_PUBLIC_PATHS = {
  artistPractice: `records/accessions/${VERA_MOLNAR_ACCESSION_ID}/public/vera-molnar-artist-practice.md`,
  collaboratorPractice: `records/accessions/${VERA_MOLNAR_ACCESSION_ID}/public/martin-grasser-artist-practice.md`,
  projectEssay: `records/accessions/${VERA_MOLNAR_ACCESSION_ID}/public/themes-and-variations-project.md`,
  acquisitionEssay: `records/accessions/${VERA_MOLNAR_ACCESSION_ID}/public/gift-and-acquisition.md`,
  objectEntry: `records/accessions/${VERA_MOLNAR_ACCESSION_ID}/public/${VERA_MOLNAR_OBJECT_ID}.md`,
  sourceChronology: `records/accessions/${VERA_MOLNAR_ACCESSION_ID}/public/source-and-chronology.md`,
} as const;

const VERA_MOLNAR_OBJECT_RECORD_PATH =
  `records/accessions/${VERA_MOLNAR_ACCESSION_ID}/objects/${VERA_MOLNAR_OBJECT_ID}.json` as const;
const VERA_MOLNAR_WAVE_STATUS_PATH =
  "records/proposed-gifts/6529NM-PG-2026-002/wave-status-observation.json" as const;

const VERA_MOLNAR_WAVE_ID = "5f207393-5418-4a75-8738-e40edb44a94d";
const VERA_MOLNAR_DROP_ID = "d09d3c3b-d354-4e39-9e1f-1e676e3cb62e";

const VERA_PUBLIC_PATH_VALUES = Object.values(VERA_MOLNAR_PUBLIC_PATHS);
const VERA_ACCESSION_PREFIX = `records/accessions/${VERA_MOLNAR_ACCESSION_ID}/`;
const VERA_PRESENTATION_MANIFEST_PATH = `${VERA_ACCESSION_PREFIX}public/presentation-manifest.json`;

interface VeraActivationInput {
  readonly graph: MuseumPublicEntityGraph;
  readonly publication: MuseumPublication;
  readonly sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>;
}

/**
 * Vera is an atomic publication unit. The source repository may contain a
 * partial accession while it is being assembled; that state must not create
 * a half-routed artist, acquisition, or work in the visitor publication.
 */
export function assertVeraMolnarActivation(input: VeraActivationInput): void {
  const workEntity = input.graph.entities.find(
    (entity) =>
      entity.entityType === "WORK" &&
      entity.sourceRecordIds.includes(VERA_MOLNAR_OBJECT_ID)
  );
  const graphContainsVera =
    workEntity !== undefined ||
    input.graph.entities.some(
      (entity) =>
        entity.slug === VERA_MOLNAR_ARTIST_SLUG ||
        entity.slug === MARTIN_GRASSER_ARTIST_SLUG
    );
  const presentPublicPaths = VERA_PUBLIC_PATH_VALUES.filter((path) =>
    input.sourceDocuments.has(path)
  );
  if (presentPublicPaths.length === 0 && !graphContainsVera) return;

  for (const path of VERA_PUBLIC_PATH_VALUES) {
    const document = input.sourceDocuments.get(path);
    if (
      document?.mediaType !== "text/markdown" ||
      document.text.trim() === ""
    ) {
      throw new Error("vera_molnar_atomic_public_documents");
    }
  }

  const objectRecord = input.sourceDocuments.get(
    VERA_MOLNAR_OBJECT_RECORD_PATH
  );
  if (objectRecord?.mediaType !== "application/json") {
    throw new Error("vera_molnar_atomic_object_record");
  }

  const accessionMachineRecords = [...input.sourceDocuments.values()].filter(
    (document) =>
      document.path.startsWith(VERA_ACCESSION_PREFIX) &&
      document.path.endsWith(".json") &&
      !document.path.includes("/objects/")
  );
  const presentationRecords = accessionMachineRecords.filter(
    (document) => document.path === VERA_PRESENTATION_MANIFEST_PATH
  );
  if (
    accessionMachineRecords.length === 0 ||
    presentationRecords.length === 0
  ) {
    throw new Error("vera_molnar_atomic_machine_records");
  }

  const machineRoots = [objectRecord, ...accessionMachineRecords].map(
    parseMachineRecord
  );
  if (
    !machineRoots.every(hasApprovedReviewState) ||
    !hasDeepValue(machineRoots, VERA_MOLNAR_ACCESSION_ID) ||
    !hasDeepValue(machineRoots, VERA_MOLNAR_OBJECT_ID) ||
    !hasDeepValue(machineRoots, VERA_MOLNAR_CUSTODY_BLOCK) ||
    !hasExactWaveEvidence(
      input.sourceDocuments.get(VERA_MOLNAR_WAVE_STATUS_PATH)
    )
  ) {
    throw new Error("vera_molnar_atomic_source_evidence");
  }

  if (workEntity === undefined) {
    throw new Error("vera_molnar_atomic_work_entity");
  }
  const work = input.publication.works?.find(
    (candidate) => candidate.id === workEntity.id
  );
  if (
    work?.collectionMembership !== true ||
    !input.publication.workAliases?.some(
      (alias) =>
        alias.sourceObjectId === VERA_MOLNAR_OBJECT_ID &&
        alias.workId === workEntity.id
    )
  ) {
    throw new Error("vera_molnar_atomic_object_route");
  }

  assertVeraEntityRoutes(input, workEntity);

  const still = work.media.find(
    (media) => media.kind === "still" && media.role === "source"
  );
  if (
    still?.width !== 2400 ||
    still.height !== 2400 ||
    still.custody !== "upstream" ||
    still.upstreamProvider !== "art_blocks" ||
    still.variants?.length !== 3 ||
    still.variants.map((variant) => variant.width).join(",") !== "640,1280,2400"
  ) {
    throw new Error("vera_molnar_atomic_official_still");
  }
}

function assertVeraEntityRoutes(
  input: VeraActivationInput,
  workEntity: MuseumPublicEntityRecord
): void {
  const artistEntities = relatedEntities(
    input.graph,
    "ARTIST_CREATES_WORK",
    workEntity.id,
    "ARTIST"
  );
  const projectEntity = relatedEntity(
    input.graph,
    "PROJECT_CONTEXTUALIZES_WORK",
    workEntity.id,
    "PROJECT_OR_SERIES"
  );
  const acquisitionEntity = relatedEntity(
    input.graph,
    "CURATED_ACQUISITION_BRINGS_TOGETHER_WORK",
    workEntity.id,
    "CURATED_ACQUISITION"
  );
  const artists = artistEntities.flatMap((entity) => {
    const artist = input.publication.artists.find(
      (candidate) => candidate.id === entity.id
    );
    return artist === undefined ? [] : [artist];
  });
  const project =
    projectEntity === null
      ? undefined
      : input.publication.projects.find(
          (candidate) => candidate.id === projectEntity.id
        );
  const acquisition =
    acquisitionEntity === null
      ? undefined
      : input.publication.curatedAcquisitions?.find(
          (candidate) => candidate.id === acquisitionEntity.id
        );
  if (projectEntity === null || acquisitionEntity === null) {
    throw new Error("vera_molnar_atomic_entity_routes");
  }
  if (
    !artists.some((artist) => artist.slug === VERA_MOLNAR_ARTIST_SLUG) ||
    !artists.some((artist) => artist.slug === MARTIN_GRASSER_ARTIST_SLUG) ||
    project === undefined ||
    acquisition?.accessionLotIds.includes(VERA_MOLNAR_ACCESSION_ENTITY_ID) !==
      true ||
    acquisition.sourceAliases?.includes(VERA_MOLNAR_ACCESSION_ID) !== true ||
    acquisition.status !== "accessioned_into_permanent_collection" ||
    !hasCanonicalRoutes([
      ...artistEntities,
      projectEntity,
      acquisitionEntity,
      workEntity,
    ])
  ) {
    throw new Error("vera_molnar_atomic_entity_routes");
  }

  const requiredGraphRecords = [
    workEntity,
    ...artistEntities,
    projectEntity,
    acquisitionEntity,
  ].map((entity) => input.sourceDocuments.get(entity.sourcePath));
  if (
    requiredGraphRecords.some(
      (document) =>
        document?.mediaType !== "application/json" ||
        !hasApprovedReviewState(parseMachineRecord(document))
    )
  ) {
    throw new Error("vera_molnar_atomic_review_state");
  }
}

function parseMachineRecord(document: MuseumSourceDocument): unknown {
  try {
    return JSON.parse(document.text) as unknown;
  } catch {
    throw new Error("vera_molnar_atomic_machine_json");
  }
}

function hasDeepValue(
  values: readonly unknown[],
  expected: string | number
): boolean {
  return values.some((value) => {
    if (
      value === expected ||
      (typeof expected === "number" &&
        typeof value === "string" &&
        Number(value.replaceAll(",", "")) === expected)
    ) {
      return true;
    }
    if (Array.isArray(value))
      return value.some((item) => hasDeepValue([item], expected));
    if (typeof value !== "object" || value === null) return false;
    return Object.values(value).some((item) => hasDeepValue([item], expected));
  });
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function hasApprovedReviewState(value: unknown): boolean {
  const root = record(value);
  if (root === null) return false;
  const payload = record(root["payload"]);
  if (payload !== null) {
    const reviewer = record(payload["reviewer"]);
    return (
      payload["record_status"] === "reviewed" &&
      payload["review_status"] === "reviewed" &&
      reviewer?.["role"] === "reviewer" &&
      reviewer["outcome"] === "approved" &&
      typeof reviewer["reviewed_commit"] === "string"
    );
  }
  const control = record(root["record_control"]);
  const review = record(control?.["review"]);
  return (
    control?.["record_status"] === "reviewed" &&
    review?.["role"] === "reviewer" &&
    review["outcome"] === "approved" &&
    typeof review["reviewed_commit"] === "string"
  );
}

function hasExactWaveEvidence(
  document: MuseumSourceDocument | undefined
): boolean {
  if (document?.mediaType !== "application/json") return false;
  const root = record(parseMachineRecord(document));
  const payload = record(root?.["payload"]);
  return (
    payload?.["wave_id"] === VERA_MOLNAR_WAVE_ID &&
    payload["drop_id"] === VERA_MOLNAR_DROP_ID &&
    payload["proposal_id"] === "6529NM-PG-2026-002" &&
    payload["source_status"] === "WINNER" &&
    payload["api_reported_is_signed"] === true &&
    payload["observation_method"] === "wave_api_status_readback" &&
    hasApprovedReviewState(root)
  );
}

function relatedEntity(
  graph: MuseumPublicEntityGraph,
  relationType:
    | "ARTIST_CREATES_WORK"
    | "PROJECT_CONTEXTUALIZES_WORK"
    | "CURATED_ACQUISITION_BRINGS_TOGETHER_WORK",
  workId: string,
  entityType: "ARTIST" | "PROJECT_OR_SERIES" | "CURATED_ACQUISITION"
) {
  const relation = graph.relations.find(
    (candidate) =>
      candidate.relationType === relationType &&
      candidate.targetEntityId === workId
  );
  const entity = graph.entities.find(
    (candidate) => candidate.id === relation?.sourceEntityId
  );
  return entity?.entityType === entityType ? entity : null;
}

function relatedEntities(
  graph: MuseumPublicEntityGraph,
  relationType: "ARTIST_CREATES_WORK",
  workId: string,
  entityType: "ARTIST"
) {
  return graph.relations.flatMap((relation) => {
    if (
      relation.relationType !== relationType ||
      relation.targetEntityId !== workId
    ) {
      return [];
    }
    const entity = graph.entities.find(
      (candidate) => candidate.id === relation.sourceEntityId
    );
    return entity?.entityType === entityType ? [entity] : [];
  });
}

function hasCanonicalRoutes(
  entities: readonly { readonly canonicalRoute: string | null }[]
): boolean {
  return entities.every(
    (entity) => entity.canonicalRoute?.startsWith("/museum/network/") === true
  );
}
