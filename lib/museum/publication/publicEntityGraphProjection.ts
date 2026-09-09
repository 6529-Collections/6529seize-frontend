import type {
  MuseumAcquisitionAlias,
  MuseumAcquisitionProgram,
  MuseumArtist,
  MuseumCuratedAcquisition,
  MuseumEntityRelation,
  MuseumOrganization,
  MuseumProject,
  MuseumPublication,
  MuseumPublicEntityGraph,
  MuseumPublicEntityRecord,
  MuseumPublicEntityType,
  MuseumPublicRelationType,
  MuseumPublicRouteAlias,
  MuseumPublicWork,
  MuseumResearchPublication,
  MuseumSourceDocument,
  MuseumWorkAlias,
} from "./types";
import { buildMuseumTypedDocumentProjection } from "./typedDocuments";
import {
  mapAcquisitionStatus,
  mapWorkStatus,
  projectMediaRelations,
  type MuseumProjectedMedia,
} from "./publicEntityGraphMedia";
import {
  aliasesForWorks,
  immutableDocumentSource,
  mapAcquisitionMethod,
  mergeWorkAliases,
} from "./publicEntityGraphAliases";
import {
  profileStringArray,
  requireEntity,
  uniqueIds,
  isRelationGatedCollectionMember,
} from "./publicEntityGraphValidation";
import {
  requiredObject,
  requiredString,
  stringArray,
} from "./publicEntityGraphPrimitives";

interface MuseumGraphProjection {
  readonly artists: readonly MuseumArtist[];
  readonly organizations: readonly MuseumOrganization[];
  readonly projects: readonly MuseumProject[];
  readonly works: readonly MuseumPublicWork[];
  readonly workAliases: readonly MuseumWorkAlias[];
  readonly acquisitionPrograms: readonly MuseumAcquisitionProgram[];
  readonly curatedAcquisitions: readonly MuseumCuratedAcquisition[];
  readonly relations: readonly MuseumEntityRelation[];
  readonly researchPublications: readonly MuseumResearchPublication[];
  readonly acquisitionAliases: readonly MuseumAcquisitionAlias[];
  readonly routeAliases: readonly MuseumPublicRouteAlias[];
  readonly documents: MuseumPublication["documents"];
}

interface WorkProjectionContext {
  readonly base: MuseumPublication;
  readonly graph: MuseumPublicEntityGraph;
  readonly documentIdsByEntity: ReadonlyMap<string, readonly string[]>;
  readonly mediaBySubject: ReadonlyMap<string, MuseumProjectedMedia>;
  readonly workAliases: readonly MuseumWorkAlias[];
}

export function projectMuseumGraph(
  graph: MuseumPublicEntityGraph,
  base: MuseumPublication,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>,
  catalogMediaAssetPaths: readonly string[] = []
): MuseumGraphProjection {
  const typedDocuments = buildMuseumTypedDocumentProjection({
    graph,
    publication: base,
    sourceDocuments,
  });
  const mediaBySubject = projectMediaRelations(
    graph.entities,
    graph,
    sourceDocuments,
    catalogMediaAssetPaths
  );
  const workAliases = mergeWorkAliases([
    ...aliasesForWorks(graph.entities),
    ...graph.identityInventory.workAliases,
  ]);
  const workContext: WorkProjectionContext = {
    base,
    graph,
    documentIdsByEntity: typedDocuments.documentIdsByEntity,
    mediaBySubject,
    workAliases,
  };
  const works = projectWorks(graph, workContext);
  const artists = projectArtists(
    graph,
    base,
    typedDocuments.documentIdsByEntity
  );
  const organizations = projectOrganizations(
    graph,
    base,
    typedDocuments.documentIdsByEntity
  );
  const projects = projectProjects(
    graph,
    base,
    typedDocuments.documentIdsByEntity
  );
  const curatedAcquisitions = projectAcquisitions(
    graph,
    typedDocuments.documentIdsByEntity,
    mediaBySubject
  );
  const acquisitionPrograms = projectPrograms(
    graph,
    typedDocuments.documentIdsByEntity
  );
  const researchPublications = projectResearch(
    graph,
    typedDocuments.documentIdsByEntity,
    typedDocuments.documents
  );
  return {
    artists,
    organizations,
    projects,
    works,
    workAliases,
    acquisitionPrograms,
    curatedAcquisitions,
    relations: projectRelations(graph),
    researchPublications,
    acquisitionAliases: projectAcquisitionAliases(curatedAcquisitions, graph),
    routeAliases: graph.identityInventory.routeAliases,
    documents: typedDocuments.documents,
  };
}

function projectWorks(
  graph: MuseumPublicEntityGraph,
  context: WorkProjectionContext
): readonly MuseumPublicWork[] {
  return graph.entities
    .filter((entity) => entity.entityType === "WORK")
    .map((entity) => projectWork(entity, context));
}

function projectWork(
  entity: MuseumPublicEntityRecord,
  context: WorkProjectionContext
): MuseumPublicWork {
  const { base, documentIdsByEntity, mediaBySubject, workAliases } = context;
  const profile = entity.profile;
  const currentRelation = requiredObject(
    profile,
    "current_museum_relation",
    "public_entity_graph_work_relation"
  );
  const lifecycle = requiredString(
    profile,
    "work_lifecycle_status",
    "public_entity_graph_work_status"
  );
  const media = mediaBySubject.get(entity.id) ?? {
    retained: [],
    presentation: [],
    metadata: [],
  };
  const mintFact = requiredObject(
    profile,
    "mint_fact",
    "public_entity_graph_work_mint"
  );
  const mintStatus = requiredString(
    mintFact,
    "status",
    "public_entity_graph_work_mint_status"
  );
  const creatorIds = profileStringArray(entity, "creator_entity_ids");
  const artistId = creatorIds[0];
  if (artistId === undefined) {
    throw new Error("public_entity_graph_work_creator");
  }
  const sourceAliases = workAliases
    .filter((alias) => alias.workId === entity.id)
    .map((alias) => alias.sourceObjectId);
  const legacyDocumentIds = base.documents
    .filter((document) =>
      document.artworkIds.some((artworkId) => sourceAliases.includes(artworkId))
    )
    .map((document) => document.id);
  const documentIds = [
    ...new Set([
      ...legacyDocumentIds,
      ...(documentIdsByEntity.get(entity.id) ?? []),
    ]),
  ];
  const sourceRecordIds = entity.sourceRecordIds;
  const presentationMedia = media.presentation;
  return {
    kind: "work",
    id: entity.id,
    slug: entity.id,
    title: requiredString(profile, "title", "public_entity_graph_work_title"),
    medium: requiredString(
      profile,
      "medium",
      "public_entity_graph_work_medium"
    ),
    artistId,
    artistIds: creatorIds,
    projectId:
      profileStringArray(entity, "project_or_series_entity_ids")[0] ?? null,
    status: mapWorkStatus(lifecycle),
    collectionMembership: isRelationGatedCollectionMember(
      entity,
      context.graph.relations
    ),
    statusAsOf: requiredString(
      currentRelation,
      "as_of",
      "public_entity_graph_work_as_of"
    ),
    acquisitionIds: profileStringArray(entity, "acquisition_entity_ids"),
    programIds: profileStringArray(entity, "program_entity_ids"),
    media: media.retained,
    ...(media.metadata.length > 0 ? { mediaMetadata: media.metadata } : {}),
    ...(presentationMedia.length > 0 ? { presentationMedia } : {}),
    documentIds,
    sourceRecordIds,
    qualifiers: [
      { kind: "mint", status: mintStatus, sourcePath: entity.sourcePath },
    ],
    sourcePaths: [entity.sourcePath],
  };
}

function projectArtists(
  graph: MuseumPublicEntityGraph,
  base: MuseumPublication,
  documentIdsByEntity: ReadonlyMap<string, readonly string[]>
): readonly MuseumArtist[] {
  return graph.entities
    .filter((entity) => entity.entityType === "ARTIST")
    .map((entity) => {
      const workIds = graph.relations
        .filter(
          (relation) =>
            relation.relationType === "ARTIST_CREATES_WORK" &&
            relation.sourceEntityId === entity.id
        )
        .map((relation) => relation.targetEntityId);
      const projectIds = graph.relations
        .filter(
          (relation) =>
            relation.relationType === "AGENT_PLAYS_ROLE" &&
            relation.sourceEntityId === entity.id &&
            entityById(graph, relation.targetEntityId).entityType ===
              "PROJECT_OR_SERIES"
        )
        .map((relation) => relation.targetEntityId);
      const legacyDocumentIds = base.documents
        .filter((document) => document.artistIds.includes(entity.id))
        .map((document) => document.id);
      return {
        id: entity.id,
        slug: entity.slug ?? entity.id,
        preferredName: entity.label,
        projectIds,
        artworkIds: [],
        workIds,
        documentIds: [
          ...new Set([
            ...legacyDocumentIds,
            ...(documentIdsByEntity.get(entity.id) ?? []),
          ]),
        ],
        sourcePaths: [entity.sourcePath],
      };
    });
}

function projectOrganizations(
  graph: MuseumPublicEntityGraph,
  base: MuseumPublication,
  documentIdsByEntity: ReadonlyMap<string, readonly string[]>
): readonly MuseumOrganization[] {
  return graph.entities
    .filter((entity) => entity.entityType === "ORGANIZATION")
    .map((entity) => {
      const projectIds = graph.relations
        .filter(
          (relation) =>
            (relation.relationType === "ORGANIZATION_ORIGINATES_PROJECT" ||
              relation.relationType === "ORGANIZATION_PUBLISHES_PROJECT") &&
            relation.sourceEntityId === entity.id
        )
        .map((relation) => relation.targetEntityId);
      const legacyDocumentIds = base.documents
        .filter((document) =>
          document.projectIds.some((projectId) =>
            projectIds.includes(projectId)
          )
        )
        .map((document) => document.id);
      return {
        kind: "organization" as const,
        id: entity.id,
        slug: entity.slug ?? entity.id,
        preferredName: entity.label,
        projectIds,
        artworkIds: [],
        acquisitionIds: [],
        documentIds: [
          ...new Set([
            ...legacyDocumentIds,
            ...(documentIdsByEntity.get(entity.id) ?? []),
          ]),
        ],
        sourcePaths: [entity.sourcePath],
      };
    });
}

function projectProjects(
  graph: MuseumPublicEntityGraph,
  base: MuseumPublication,
  documentIdsByEntity: ReadonlyMap<string, readonly string[]>
): readonly MuseumProject[] {
  return graph.entities
    .filter((entity) => entity.entityType === "PROJECT_OR_SERIES")
    .map((entity) => {
      const legacyProject = base.projects.find(
        (project) => project.slug === (entity.slug ?? entity.id)
      );
      const agents = profileStringArray(entity, "agent_entity_ids");
      const artistIds = agents.filter(
        (id) => entityById(graph, id).entityType === "ARTIST"
      );
      const organizationIds = graph.relations
        .filter(
          (relation) =>
            (relation.relationType === "ORGANIZATION_ORIGINATES_PROJECT" ||
              relation.relationType === "ORGANIZATION_PUBLISHES_PROJECT") &&
            relation.targetEntityId === entity.id
        )
        .map((relation) => relation.sourceEntityId);
      const primaryAgentId = artistIds[0] ?? organizationIds[0] ?? entity.id;
      const legacyDocumentIds = base.documents
        .filter((document) => document.projectIds.includes(entity.id))
        .map((document) => document.id);
      return {
        id: entity.id,
        slug: entity.slug ?? entity.id,
        title: entity.label,
        artistId: primaryAgentId,
        artistIds,
        organizationIds,
        platform: "",
        releaseYear: 0,
        // The typed project identity remains authoritative. These legacy
        // object aliases keep the existing generative-study surface usable
        // until that surface has a canonical Work-aware adapter.
        artworkIds: legacyProject?.artworkIds ?? [],
        workIds: profileStringArray(entity, "work_entity_ids"),
        documentIds: [
          ...new Set([
            ...legacyDocumentIds,
            ...(documentIdsByEntity.get(entity.id) ?? []),
          ]),
        ],
        sourcePaths: [entity.sourcePath],
      };
    });
}

function projectAcquisitions(
  graph: MuseumPublicEntityGraph,
  documentIdsByEntity: ReadonlyMap<string, readonly string[]>,
  mediaBySubject: ReadonlyMap<string, MuseumProjectedMedia>
): readonly MuseumCuratedAcquisition[] {
  return graph.entities
    .filter(
      (entity) =>
        entity.entityType === "CURATED_ACQUISITION" &&
        graph.identityInventory.curatedAcquisitionIds.includes(entity.id)
    )
    .map((entity) => {
      const profile = entity.profile;
      const lifecycle = requiredObject(
        profile,
        "lifecycle",
        "public_entity_graph_acquisition_lifecycle"
      );
      const pathway = requiredObject(
        profile,
        "program_or_pathway",
        "public_entity_graph_acquisition_pathway"
      );
      const workIds = profileStringArray(entity, "work_entity_ids");
      const artistIds = uniqueIds(
        workIds.flatMap((workId) =>
          graph.relations
            .filter(
              (relation) =>
                relation.relationType === "ARTIST_CREATES_WORK" &&
                relation.targetEntityId === workId
            )
            .map((relation) => relation.sourceEntityId)
        )
      );
      const projectIds = uniqueIds(
        workIds.flatMap((workId) =>
          graph.relations
            .filter(
              (relation) =>
                relation.relationType === "PROJECT_CONTEXTUALIZES_WORK" &&
                relation.targetEntityId === workId
            )
            .map((relation) => relation.sourceEntityId)
        )
      );
      const organizationIds = uniqueIds(
        projectIds.flatMap((projectId) =>
          graph.relations
            .filter(
              (relation) =>
                (relation.relationType === "ORGANIZATION_ORIGINATES_PROJECT" ||
                  relation.relationType === "ORGANIZATION_PUBLISHES_PROJECT") &&
                relation.targetEntityId === projectId
            )
            .map((relation) => relation.sourceEntityId)
        )
      );
      const presentationMedia = workIds
        .flatMap((workId) => mediaBySubject.get(workId)?.presentation ?? [])
        .filter((media) => media.source.contextEntityId === entity.id);
      const sourceAliases = uniqueIds([
        ...stringArray(
          profile,
          "source_aliases",
          "public_entity_graph_acquisition_aliases",
          false
        ),
        ...graph.identityInventory.acquisitionAliases
          .filter((alias) => alias.acquisitionId === entity.id)
          .map((alias) => alias.alias),
      ]);
      const accessionIds = uniqueIds(
        workIds.flatMap((workId) =>
          graph.relations
            .filter(
              (relation) =>
                relation.relationType === "ACCESSION_ADMITS_WORK" &&
                relation.targetEntityId === workId
            )
            .map((relation) => relation.sourceEntityId)
        )
      );
      const typedDocumentIds = documentIdsByEntity.get(entity.id) ?? [];
      if (typedDocumentIds.length === 0) {
        throw new Error("public_entity_graph_publication_join_missing");
      }
      return {
        kind: "curated_acquisition" as const,
        id: entity.id,
        slug: entity.slug ?? entity.id,
        title: requiredString(
          profile,
          "title",
          "public_entity_graph_acquisition_title"
        ),
        thesis: requiredString(
          profile,
          "thesis",
          "public_entity_graph_acquisition_thesis"
        ),
        status: mapAcquisitionStatus(
          requiredString(
            lifecycle,
            "status",
            "public_entity_graph_acquisition_status"
          )
        ),
        statusAsOf: requiredString(
          lifecycle,
          "as_of",
          "public_entity_graph_acquisition_as_of"
        ),
        acquisitionMethod: mapAcquisitionMethod(
          requiredString(
            profile,
            "acquisition_method",
            "public_entity_graph_acquisition_method"
          )
        ),
        ...(sourceAliases.length > 0 ? { sourceAliases } : {}),
        programId:
          stringArray(
            pathway,
            "entity_ids",
            "public_entity_graph_acquisition_pathway_entities",
            false
          )[0] ?? null,
        artistIds,
        organizationIds,
        projectIds,
        workIds,
        accessionLotIds: accessionIds,
        ...(presentationMedia.length > 0 ? { presentationMedia } : {}),
        sourceDocumentIds: typedDocumentIds,
        sourcePaths: [entity.sourcePath],
      };
    });
}

function projectPrograms(
  graph: MuseumPublicEntityGraph,
  documentIdsByEntity: ReadonlyMap<string, readonly string[]>
): readonly MuseumAcquisitionProgram[] {
  return graph.entities
    .filter((entity) => entity.entityType === "ACQUISITION_PROGRAM")
    .map((entity) => {
      const profile = entity.profile;
      const rawStatus = requiredString(
        profile,
        "program_status",
        "public_entity_graph_program_status"
      );
      const sourceAliases = uniqueIds([
        ...profileStringArray(entity, "authority_record_ids", false),
        requiredString(profile, "program_id", "public_entity_graph_program_id"),
        ...graph.identityInventory.programAliases
          .filter((alias) => alias.programId === entity.id)
          .map((alias) => alias.alias),
      ]).filter((alias) => alias !== entity.id && alias !== entity.slug);
      const sourceDocumentIds = documentIdsByEntity.get(entity.id) ?? [];
      if (sourceDocumentIds.length === 0) {
        throw new Error("public_entity_graph_publication_join_missing");
      }
      if (entity.statusAsOf === undefined) {
        throw new Error("public_entity_graph_program_status_as_of");
      }
      return {
        kind: "acquisition_program" as const,
        id: entity.id,
        slug: entity.slug ?? entity.id,
        title: entity.label,
        status: mapProgramStatus(rawStatus),
        statusAsOf: entity.statusAsOf,
        acquisitionMethod: "other_authorized_method" as const,
        acquisitionIds: profileStringArray(
          entity,
          "produced_acquisition_entity_ids",
          false
        ),
        ...(sourceAliases.length > 0 ? { sourceAliases } : {}),
        sourceDocumentIds,
        sourcePaths: [entity.sourcePath],
      };
    });
}

function mapProgramStatus(value: string): MuseumAcquisitionProgram["status"] {
  switch (value) {
    case "open_call":
    case "active":
      return "open";
    case "complete":
      return "completed";
    case "selection_complete_acquisition_and_accession_unverified":
      return "selection_complete";
    case "proposed":
    case "open":
    case "selection_complete":
    case "acquisition_in_progress":
    case "completed":
    case "closed":
      return value;
    default:
      throw new Error("public_entity_graph_program_status");
  }
}

function projectResearch(
  graph: MuseumPublicEntityGraph,
  documentIdsByEntity: ReadonlyMap<string, readonly string[]>,
  documents: MuseumPublication["documents"]
): readonly MuseumResearchPublication[] {
  return graph.entities
    .filter((entity) => entity.entityType === "RESEARCH_PUBLICATION")
    .map((entity) => {
      const documentId = documentIdsByEntity.get(entity.id)?.[0];
      const document = documents.find(
        (candidate) => candidate.id === documentId
      );
      if (document === undefined) {
        throw new Error("public_entity_graph_research_document_join");
      }
      const profile = entity.profile;
      return {
        kind: "research" as const,
        id: entity.id,
        slug: entity.slug ?? entity.id,
        title: requiredString(
          profile,
          "title",
          "public_entity_graph_research_title"
        ),
        publicationKind: requiredString(
          profile,
          "publication_kind",
          "public_entity_graph_research_kind"
        ),
        publicationUri: immutableDocumentSource(
          graph.sourceCommit,
          document.sourcePath
        ),
        authorIds: profileStringArray(entity, "author_entity_ids"),
        subjectIds: profileStringArray(entity, "subject_entity_ids"),
        sourcePath: entity.sourcePath,
      };
    });
}

function projectRelations(
  graph: MuseumPublicEntityGraph
): readonly MuseumEntityRelation[] {
  const relationKindMap: Partial<
    Record<MuseumPublicRelationType, MuseumEntityRelation["relation"]>
  > = {
    INSTITUTION_HOLDS_COLLECTION: "institution_holds_collection",
    ARTIST_CREATES_WORK: "artist_creates_work",
    PROJECT_CONTEXTUALIZES_WORK: "project_contextualizes_work",
    ORGANIZATION_ORIGINATES_PROJECT: "organization_originates_project",
    ORGANIZATION_PUBLISHES_PROJECT: "organization_publishes_project",
    ACQUISITION_PROGRAM_PRODUCES_ACQUISITION:
      "acquisition_program_produces_curated_acquisition",
    CURATED_ACQUISITION_BRINGS_TOGETHER_WORK:
      "curated_acquisition_brings_together_work",
    PROGRAM_SELECTS_WORK: "program_selects_work",
    ACCESSION_ADMITS_WORK: "accession_admits_work",
    COLLECTION_CONTAINS_WORK: "collection_contains_work",
    PUBLICATION_INTERPRETS_ENTITY: "publication_interprets_entity",
    INSTITUTION_PUBLISHES_PUBLICATION: "institution_publishes_research",
  };
  return graph.relations.flatMap((relation) => {
    const mappedRelation = relationKindMap[relation.relationType];
    const source = requireEntity(
      graph.entities,
      relation.sourceEntityId,
      "public_entity_graph_relation_source"
    );
    const target = requireEntity(
      graph.entities,
      relation.targetEntityId,
      "public_entity_graph_relation_target"
    );
    const fromKind = projectEntityKind(source.entityType);
    const toKind = projectEntityKind(target.entityType);
    if (mappedRelation === undefined || fromKind === null || toKind === null) {
      return [];
    }
    return [
      {
        id: relation.id,
        relation: mappedRelation,
        from: { id: source.id, kind: fromKind },
        to: { id: target.id, kind: toKind },
        sourcePath: relation.sourcePath,
      },
    ];
  });
}

function projectEntityKind(
  type: MuseumPublicEntityType
): MuseumEntityRelation["from"]["kind"] | null {
  switch (type) {
    case "INSTITUTION":
    case "AGENT":
    case "ACCESSION":
    case "MEDIA_REFERENCE":
    case "EXHIBITION":
      return null;
    case "COLLECTION":
      return "collection";
    case "WORK":
      return "work";
    case "ARTIST":
      return "artist";
    case "ORGANIZATION":
      return "organization";
    case "PROJECT_OR_SERIES":
      return "project";
    case "CURATED_ACQUISITION":
      return "curated_acquisition";
    case "ACQUISITION_PROGRAM":
      return "acquisition_program";
    case "RESEARCH_PUBLICATION":
      return "research";
  }
}

function entityById(
  graph: MuseumPublicEntityGraph,
  id: string
): MuseumPublicEntityRecord {
  return requireEntity(graph.entities, id, "public_entity_graph_reference");
}

function projectAcquisitionAliases(
  acquisitions: readonly MuseumCuratedAcquisition[],
  graph: MuseumPublicEntityGraph
): readonly MuseumAcquisitionAlias[] {
  return acquisitions.flatMap((acquisition) => {
    const entity = entityById(graph, acquisition.id);
    return (acquisition.sourceAliases ?? []).map((alias) => ({
      kind: "acquisition_source_alias" as const,
      alias,
      acquisitionId: acquisition.id,
      sourcePath: entity.sourcePath,
    }));
  });
}
