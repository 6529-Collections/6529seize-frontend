import {
  MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
  MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_PATH,
  MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA_PATH,
  parseMuseumPublicEntityGraph,
} from "@/lib/museum/publication/publicEntityGraph";
import { parseMuseumEntityRecord } from "@/lib/museum/publication/publicEntityGraphParsing";
import {
  assertGraphReferences,
  isRelationGatedCollectionMember,
} from "@/lib/museum/publication/publicEntityGraphValidation";
import { buildMuseumAcquisitionIndex } from "@/lib/museum/publication/ia";
import { resolveMuseumWorkId } from "@/lib/museum/publication/routes";
import { mapAcquisitionStatus } from "@/lib/museum/publication/publicEntityGraphMedia";
import type {
  MuseumCuratedAcquisition,
  MuseumPublication,
  MuseumPublicEntityRecord,
  MuseumPublicRelationRecord,
  MuseumSourceDocument,
} from "@/lib/museum/publication/types";

const SOURCE_COMMIT = "a".repeat(40);
const ENTITY_SCHEMA =
  "0xd8aef6592fe156c4c3c10e59de540f5cdf8b130eedca322e0e22b30764bee1a9";
const RELATION_SCHEMA =
  "0xaa76f1b93e01ae7a1cff2717b0c814df772fd26d3997a47847a1887cba6756de";
const GRAPH_CONTROL_PATHS = [
  MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH,
  MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_PATH,
  MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA_PATH,
] as const;

function documentFor(
  path: string,
  recordType: "PUBLIC_ENTITY" | "PUBLIC_RELATION",
  payload: Record<string, unknown>
): MuseumSourceDocument {
  const schemaId =
    recordType === "PUBLIC_ENTITY" ? ENTITY_SCHEMA : RELATION_SCHEMA;
  return {
    path,
    sha256: null,
    mediaType: "application/json",
    text: JSON.stringify({
      envelope: {
        recordType,
        schemaId,
        subjectId: `0x${"0".repeat(64)}`,
        uri: `https://github.com/6529-Collections/6529networkmuseum/blob/${SOURCE_COMMIT}/${path}`,
      },
      payload: { ...payload, schema_id: schemaId, record_type: recordType },
    }),
  };
}

function commonPayload(id: string): Record<string, unknown> {
  return {
    record_id: id,
    subject_id: id,
    visibility: "public",
    record_version: "1.0.0",
    created_at: "2026-08-08T00:00:00Z",
    effective_at: "2026-08-08T00:00:00Z",
    status_observation: {
      status_label: "published",
      observed_at: "2026-08-08T00:00:00Z",
      evidence_refs: [],
    },
    source_record_ids: [id],
    evidence_refs: [
      {
        uri: "https://example.test/evidence",
        label: "Evidence",
        observed_at: "2026-08-08T00:00:00Z",
        evidence_class: "C",
      },
    ],
  };
}

function institutionDocument(): MuseumSourceDocument {
  const path = "records/entities/6529NM-I-0001.json";
  return documentFor(path, "PUBLIC_ENTITY", {
    ...commonPayload("6529NM-I-0001"),
    entity_id: "6529NM-I-0001",
    entity_type: "INSTITUTION",
    preferred_label: "6529 Network Museum",
    public_slug: null,
    canonical_route: "/museum/network",
    page_exposure: "canonical_page",
    entity_status: "published",
    profile: {
      profile_type: "INSTITUTION",
      evidence_refs: [
        {
          uri: "https://example.test/institution",
          label: "Institution",
          observed_at: "2026-08-08T00:00:00Z",
          evidence_class: "C",
        },
      ],
      collection_entity_id: "6529NM-C-0001",
    },
  });
}

function relationDocument(
  relationType: string,
  targetEntityId = "6529NM-C-9999"
): MuseumSourceDocument {
  const path = "records/relations/6529NM-REL-0001.json";
  return documentFor(path, "PUBLIC_RELATION", {
    ...commonPayload("6529NM-REL-0001"),
    relation_id: "6529NM-REL-0001",
    relation_type: relationType,
    assertion_status: "asserted",
    source_entity_id: "6529NM-I-0001",
    target_entity_id: targetEntityId,
    qualifier: {},
  });
}

describe("PUBLIC_ENTITY/PUBLIC_RELATION graph boundary", () => {
  it.each([
    ["proposed_in_museum_wave", "proposed_in_museum_wave"],
    [
      "selected_by_museum_wave_acquisition_review_in_progress",
      "selected_by_museum_wave_acquisition_review_in_progress",
    ],
    [
      "selected_through_acquisition_program_acquisition_pending",
      "selected_through_acquisition_program_acquisition_pending",
    ],
    [
      "acquisition_complete_accession_review_in_progress",
      "acquisition_complete_accession_review_in_progress",
    ],
    [
      "accessioned_into_permanent_collection",
      "accessioned_into_permanent_collection",
    ],
    ["closed_without_selection", "closed_without_selection"],
    ["withdrawn", "withdrawn"],
    [
      "selected_through_acquisition_program",
      "selected_through_acquisition_program_acquisition_pending",
    ],
    [
      "acquisition_pending",
      "selected_through_acquisition_program_acquisition_pending",
    ],
    [
      "acquisition_complete",
      "acquisition_complete_accession_review_in_progress",
    ],
    [
      "accession_review_in_progress",
      "acquisition_complete_accession_review_in_progress",
    ],
    ["accessioned", "accessioned_into_permanent_collection"],
  ])("projects acquisition status %s as %s", (source, expected) => {
    expect(mapAcquisitionStatus(source)).toBe(expected);
  });

  it("fails closed for an unknown acquisition status", () => {
    expect(() => mapAcquisitionStatus("selected_unminted")).toThrow(
      "public_entity_graph_acquisition_status_unpublishable"
    );
  });

  it("keeps the released pre-ontology path compatible", () => {
    expect(
      parseMuseumPublicEntityGraph(new Map(), [], SOURCE_COMMIT)
    ).toBeNull();
  });

  it("accepts a rights-limited media record with metadata and no direct locator", () => {
    const path = "records/entities/6529NM-MED-0003.json";
    const document = documentFor(path, "PUBLIC_ENTITY", {
      ...commonPayload("6529NM-MED-0003"),
      entity_id: "6529NM-MED-0003",
      entity_type: "MEDIA_REFERENCE",
      preferred_label: "Historical Wave proposal image",
      public_slug: null,
      canonical_route: null,
      page_exposure: "relational_only",
      entity_status: "published",
      profile: {
        profile_type: "MEDIA_REFERENCE",
        evidence_refs: [
          {
            uri: "https://example.test/media",
            label: "Media record",
            observed_at: "2026-08-08T00:00:00Z",
            evidence_class: "C",
          },
        ],
        media: {
          media_role: "historical_wave_proposal_presentation",
          source_locator: { uri: null },
          media_type: "image/jpeg",
          visual: false,
          accessibility_status: "withheld",
          subject_entity_id: "6529NM-W-0024",
          credit: "© artist / Magnum Photos. All Rights Reserved.",
          rights: { status: "restricted" },
          source_observation: { status: "observed" },
          allowed_ui_affordances: [
            "alt_text",
            "copy_citation",
            "open_wave_proposal_context",
          ],
          signed_wave: {
            wave_id: "5f207393-5418-4a75-8738-e40edb44a94d",
            drop_id: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
            publication_record_id: "6529NM-PG-2026-001",
          },
        },
      },
    });

    const parsed = parseMuseumEntityRecord(document, SOURCE_COMMIT);
    expect(parsed.entityType).toBe("MEDIA_REFERENCE");
    expect(parsed.profile["media"]).toMatchObject({
      media_role: "historical_wave_proposal_presentation",
      source_locator: { uri: null },
    });
  });

  it("rejects a direct historical-proposal image without an approved token source", () => {
    const path = "records/entities/6529NM-MED-0003.json";
    const document = documentFor(path, "PUBLIC_ENTITY", {
      ...commonPayload("6529NM-MED-0003"),
      entity_id: "6529NM-MED-0003",
      entity_type: "MEDIA_REFERENCE",
      preferred_label: "Historical Wave proposal image",
      public_slug: null,
      canonical_route: null,
      page_exposure: "relational_only",
      entity_status: "published",
      profile: {
        profile_type: "MEDIA_REFERENCE",
        media: {
          media_role: "historical_wave_proposal_presentation",
          source_locator: {
            uri: "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_7ee51a67-07b7-4c91-87ed-464c56446c43/image.jpg",
          },
          token_source_locator: null,
          media_type: "image/jpeg",
          visual: true,
          width: 1200,
          height: 900,
          accessibility_text: "A documentary photograph.",
          accessibility_status: "provided",
          subject_entity_id: "6529NM-W-0024",
          credit: "© artist / Magnum Photos. All Rights Reserved.",
          rights: { status: "restricted" },
          source_observation: { status: "mutable_external" },
          allowed_ui_affordances: [
            "view",
            "thumbnail",
            "hero",
            "alt_text",
            "open_wave_proposal_context",
          ],
          wave_proposal_context: {
            wave_id: "5f207393-5418-4a75-8738-e40edb44a94d",
            drop_id: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
            publication_record_id: "6529NM-PG-2026-001",
          },
        },
      },
    });

    expect(() => parseMuseumEntityRecord(document, SOURCE_COMMIT)).toThrow(
      "public_entity_graph_media_proposal_contract"
    );
  });

  it("accepts the released rights-limited Magnum and Keys media inventory without image locators", () => {
    const magnumIds = ["0003", "0041", "0042", "0043", "0044"];
    const keysAndGatesIds = Array.from({ length: 16 }, (_, index) =>
      String(index + 20).padStart(4, "0")
    );
    const records = [
      ...magnumIds.map((suffix) => ({
        id: `6529NM-MED-${suffix}`,
        role: "historical_wave_proposal_presentation",
        affordances: [
          "alt_text",
          "copy_citation",
          "open_wave_proposal_context",
        ],
        extra: {
          signed_wave: {
            wave_id: "5f207393-5418-4a75-8738-e40edb44a94d",
            drop_id: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
            publication_record_id: "6529NM-PG-2026-001",
          },
        },
      })),
      ...keysAndGatesIds.map((suffix) => ({
        id: `6529NM-MED-${suffix}`,
        role: "museum_generated_public_derivative",
        affordances: ["alt_text", "copy_citation"],
        extra: {},
      })),
    ];

    for (const record of records) {
      const path = `records/entities/${record.id}.json`;
      const document = documentFor(path, "PUBLIC_ENTITY", {
        ...commonPayload(record.id),
        entity_id: record.id,
        entity_type: "MEDIA_REFERENCE",
        preferred_label: "Rights-limited media record",
        public_slug: null,
        canonical_route: null,
        page_exposure: "relational_only",
        entity_status: "published",
        profile: {
          profile_type: "MEDIA_REFERENCE",
          media: {
            media_role: record.role,
            source_locator: { uri: null },
            media_type: "image/jpeg",
            visual: false,
            accessibility_status: "withheld",
            subject_entity_id: "6529NM-W-0024",
            credit: "© artist / source. All Rights Reserved.",
            rights: { status: "restricted" },
            source_observation: { status: "observed" },
            allowed_ui_affordances: record.affordances,
            ...record.extra,
          },
        },
      });

      const parsed = parseMuseumEntityRecord(document, SOURCE_COMMIT);
      expect(parsed.id).toBe(record.id);
      expect(parsed.profile["media"]).toMatchObject({
        source_locator: { uri: null },
        visual: false,
      });
    }
  });

  it("fails closed when an ontology inventory activates without a complete graph", () => {
    expect(() =>
      parseMuseumPublicEntityGraph(
        new Map(),
        [MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH],
        SOURCE_COMMIT
      )
    ).toThrow("public_entity_graph_inventory_incomplete");
  });

  it("rejects unknown entity profiles before legacy fallback can run", () => {
    const path = "records/entities/unknown.json";
    const unknown = documentFor(path, "PUBLIC_ENTITY", {
      ...commonPayload("6529NM-UNKNOWN-0001"),
      entity_id: "6529NM-UNKNOWN-0001",
      entity_type: "UNKNOWN_ENTITY",
    });
    const documents = new Map([
      [path, unknown],
      [
        "records/relations/6529NM-REL-0001.json",
        relationDocument("UNKNOWN_RELATION"),
      ],
    ]);
    expect(() =>
      parseMuseumPublicEntityGraph(
        documents,
        [...GRAPH_CONTROL_PATHS, ...documents.keys()],
        SOURCE_COMMIT
      )
    ).toThrow("public_entity_graph_unknown_entity_type");
  });

  it("rejects unknown relation profiles", () => {
    const institution = institutionDocument();
    const relation = relationDocument("UNKNOWN_RELATION");
    const documents = new Map([
      [institution.path, institution],
      [relation.path, relation],
    ]);
    expect(() =>
      parseMuseumPublicEntityGraph(
        documents,
        [...GRAPH_CONTROL_PATHS, ...documents.keys()],
        SOURCE_COMMIT
      )
    ).toThrow("public_entity_graph_unknown_relation_type");
  });

  it("rejects the semantically false platform origin predicate", () => {
    const platform: MuseumPublicEntityRecord = {
      id: "6529NM-ORG-0001",
      entityType: "ORGANIZATION",
      label: "Art Blocks",
      slug: "art-blocks",
      canonicalRoute: "/museum/network/organizations/art-blocks",
      pageExposure: "canonical_page",
      entityStatus: "published",
      sourcePath: "records/entities/6529NM-ORG-0001.json",
      sourceRecordIds: ["6529NM.2026.001.01"],
      profile: { organization_kind: "platform" },
    };
    const project: MuseumPublicEntityRecord = {
      id: "6529NM-PRJ-0001",
      entityType: "PROJECT_OR_SERIES",
      label: "CENTURY",
      slug: "century",
      canonicalRoute: "/museum/network/projects/century",
      pageExposure: "canonical_page",
      entityStatus: "published",
      sourcePath: "records/entities/6529NM-PRJ-0001.json",
      sourceRecordIds: ["6529NM.2026.001.01"],
      profile: { work_entity_ids: [] },
    };
    const relation: MuseumPublicRelationRecord = {
      id: "6529NM-REL-0037",
      relationType: "ORGANIZATION_ORIGINATES_PROJECT",
      sourceEntityId: platform.id,
      targetEntityId: project.id,
      assertionStatus: "asserted",
      qualifier: { role: "originator" },
      sourceRecordIds: ["6529NM.2026.001.01"],
      sourcePath: "records/relations/6529NM-REL-0037.json",
    };
    expect(() =>
      assertGraphReferences([platform, project], [relation])
    ).toThrow("public_entity_graph_organization_project_role");
  });

  it("distinguishes a collective project origin from platform publication", () => {
    const platform: MuseumPublicEntityRecord = {
      id: "6529NM-ORG-0001",
      entityType: "ORGANIZATION",
      label: "Art Blocks",
      slug: "art-blocks",
      canonicalRoute: "/museum/network/organizations/art-blocks",
      pageExposure: "canonical_page",
      entityStatus: "published",
      sourcePath: "records/entities/6529NM-ORG-0001.json",
      sourceRecordIds: ["6529NM.2026.001.01"],
      profile: { organization_kind: "platform" },
    };
    const collective: MuseumPublicEntityRecord = {
      ...platform,
      id: "6529NM-ORG-0002",
      label: "Magnum Photos",
      slug: "magnum-photos",
      canonicalRoute: "/museum/network/organizations/magnum-photos",
      sourcePath: "records/entities/6529NM-ORG-0002.json",
      sourceRecordIds: ["6529NM-PG-2026-001"],
      profile: { organization_kind: "collective" },
    };
    const century: MuseumPublicEntityRecord = {
      id: "6529NM-PRJ-0001",
      entityType: "PROJECT_OR_SERIES",
      label: "CENTURY",
      slug: "century",
      canonicalRoute: "/museum/network/projects/century",
      pageExposure: "canonical_page",
      entityStatus: "published",
      sourcePath: "records/entities/6529NM-PRJ-0001.json",
      sourceRecordIds: ["6529NM.2026.001.01"],
      profile: { work_entity_ids: [] },
    };
    const magnum75: MuseumPublicEntityRecord = {
      ...century,
      id: "6529NM-PRJ-0006",
      label: "Magnum Photos 75",
      slug: "magnum-photos-75",
      canonicalRoute: "/museum/network/projects/magnum-photos-75",
      sourcePath: "records/entities/6529NM-PRJ-0006.json",
      sourceRecordIds: ["6529NM-PG-2026-001"],
    };
    const publication: MuseumPublicRelationRecord = {
      id: "6529NM-REL-0037",
      relationType: "ORGANIZATION_PUBLISHES_PROJECT",
      sourceEntityId: platform.id,
      targetEntityId: century.id,
      assertionStatus: "asserted",
      qualifier: { role: "publisher" },
      sourceRecordIds: ["6529NM.2026.001.01"],
      sourcePath: "records/relations/6529NM-REL-0037.json",
    };
    const origin: MuseumPublicRelationRecord = {
      ...publication,
      id: "6529NM-REL-0047",
      relationType: "ORGANIZATION_ORIGINATES_PROJECT",
      sourceEntityId: collective.id,
      targetEntityId: magnum75.id,
      qualifier: { role: "originator" },
      sourceRecordIds: ["6529NM-PG-2026-001"],
      sourcePath: "records/relations/6529NM-REL-0047.json",
    };

    expect(() =>
      assertGraphReferences(
        [platform, collective, century, magnum75],
        [publication, origin]
      )
    ).not.toThrow();
  });

  it("rejects dangling relations atomically", () => {
    const institution = institutionDocument();
    const relation = relationDocument("INSTITUTION_HOLDS_COLLECTION");
    const documents = new Map([
      [institution.path, institution],
      [relation.path, relation],
    ]);
    expect(() =>
      parseMuseumPublicEntityGraph(
        documents,
        [...GRAPH_CONTROL_PATHS, ...documents.keys()],
        SOURCE_COMMIT
      )
    ).toThrow("public_entity_graph_dangling_relation");
  });

  it("rejects old accession/object route identities for typed Works", () => {
    const path = "records/entities/6529NM-W-0001.json";
    const malformed = documentFor(path, "PUBLIC_ENTITY", {
      ...commonPayload("6529NM-W-0001"),
      entity_id: "6529NM-W-0001",
      entity_type: "WORK",
      preferred_label: "The System in Seven States",
      public_slug: "6529NM.2026.001.01",
      canonical_route: "/museum/network/works/6529NM.2026.001.01",
      page_exposure: "canonical_page",
      entity_status: "published",
    });
    expect(() =>
      parseMuseumPublicEntityGraph(
        new Map([
          [path, malformed],
          [
            "records/relations/6529NM-REL-0001.json",
            relationDocument("INSTITUTION_HOLDS_COLLECTION"),
          ],
        ]),
        [
          ...GRAPH_CONTROL_PATHS,
          path,
          "records/relations/6529NM-REL-0001.json",
        ],
        SOURCE_COMMIT
      )
    ).toThrow("public_entity_graph_work_route");
  });

  it("rejects invalid or mixed source commits", () => {
    expect(() =>
      parseMuseumPublicEntityGraph(new Map(), [], "not-a-commit")
    ).toThrow("public_entity_graph_commit");
  });

  it("resolves Casey, Keys and Gates, and Magnum source aliases only through typed joins", () => {
    const publication = {
      works: [
        { id: "6529NM-W-0001" },
        { id: "6529NM-W-0008" },
        { id: "6529NM-W-0024" },
      ],
      workAliases: [
        {
          kind: "work_source_alias",
          sourceObjectId: "6529NM.2026.001.01",
          workId: "6529NM-W-0001",
          sourcePath: "records/entities/6529NM-W-0001.json",
        },
        {
          kind: "work_source_alias",
          sourceObjectId: "6529NM-AP-01-OUT-001",
          workId: "6529NM-W-0008",
          sourcePath: "records/entities/6529NM-W-0008.json",
        },
        {
          kind: "work_source_alias",
          sourceObjectId: "6529NM-PG-2026-001.OBJ-001",
          workId: "6529NM-W-0024",
          sourcePath: "records/entities/6529NM-W-0024.json",
        },
      ],
    } as unknown as MuseumPublication;
    expect(resolveMuseumWorkId(publication, "6529NM.2026.001.01")).toBe(
      "6529NM-W-0001"
    );
    expect(resolveMuseumWorkId(publication, "6529NM-AP-01-OUT-001")).toBe(
      "6529NM-W-0008"
    );
    expect(resolveMuseumWorkId(publication, "6529NM-PG-2026-001.OBJ-001")).toBe(
      "6529NM-W-0024"
    );
    expect(resolveMuseumWorkId(publication, "6529NM-AP-01-OUT-999")).toBeNull();
  });

  it("lets a typed acquisition record win and fails closed instead of inventing a legacy record", () => {
    const typedAcquisition: MuseumCuratedAcquisition = {
      kind: "curated_acquisition",
      id: "6529NM-CA-2026-003",
      slug: "conflict-at-its-edges",
      title: "Conflict at Its Edges",
      thesis: "A photographic proposal.",
      status: "selected_by_museum_wave_acquisition_review_in_progress",
      statusAsOf: "2026-08-08T10:15:02Z",
      acquisitionMethod: "donation",
      programId: null,
      artistIds: [],
      organizationIds: [],
      projectIds: [],
      workIds: ["6529NM-W-0024"],
      accessionLotIds: [],
      sourceDocumentIds: [],
      sourcePaths: ["records/entities/6529NM-CA-2026-003.json"],
    };
    const publication = {
      identity: { commit: SOURCE_COMMIT },
      curatedAcquisitions: [typedAcquisition],
      gifts: [
        {
          institutionalStatus: "accessioned",
          artworkIds: ["legacy"],
          id: "legacy",
        },
      ],
      artworks: [],
      artists: [],
      projects: [],
    } as unknown as MuseumPublication;
    expect(buildMuseumAcquisitionIndex(publication, null)).toHaveLength(1);
    expect(buildMuseumAcquisitionIndex(publication, null)[0]?.status).toBe(
      "accessioned_into_permanent_collection"
    );
    const invalid = {
      ...publication,
      curatedAcquisitions: [{ ...typedAcquisition, status: "unknown" }],
    } as unknown as MuseumPublication;
    expect(buildMuseumAcquisitionIndex(invalid, null)).toEqual([]);
  });

  it("derives Collection membership from both active relations and matching accession facts", () => {
    const work = {
      id: "6529NM-W-0001",
      entityType: "WORK",
      profile: {
        work_lifecycle_status: "accessioned",
        accession_entity_ids: ["6529NM-ACC-ENT-0001"],
        collection_membership: {
          status: "permanent_collection",
          collection_entity_id: "6529NM-C-0001",
          accession_entity_ids: ["6529NM-ACC-ENT-0001"],
        },
      },
    } as unknown as MuseumPublicEntityRecord;
    const relation = (
      id: string,
      relationType: MuseumPublicRelationRecord["relationType"],
      sourceEntityId: string,
      qualifier: Readonly<Record<string, unknown>>,
      assertionStatus: MuseumPublicRelationRecord["assertionStatus"] = "asserted"
    ): MuseumPublicRelationRecord => ({
      id,
      relationType,
      sourceEntityId,
      targetEntityId: work.id,
      assertionStatus,
      qualifier,
      sourceRecordIds: [id],
      sourcePath: `records/relations/${id}.json`,
    });
    const collectionRelation = relation(
      "6529NM-REL-COLLECTION",
      "COLLECTION_CONTAINS_WORK",
      "6529NM-C-0001",
      { collection_membership_status: "permanent_collection" }
    );
    const accessionRelation = relation(
      "6529NM-REL-ACCESSION",
      "ACCESSION_ADMITS_WORK",
      "6529NM-ACC-ENT-0001",
      { accession_object_id: "6529NM.2026.001.01" },
      "observed"
    );

    expect(
      isRelationGatedCollectionMember(work, [
        accessionRelation,
        collectionRelation,
      ])
    ).toBe(true);
    expect(
      isRelationGatedCollectionMember(work, [
        collectionRelation,
        accessionRelation,
      ])
    ).toBe(true);
    expect(
      isRelationGatedCollectionMember(work, [
        relation(
          "6529NM-REL-COLLECTION-SELECTED",
          "COLLECTION_CONTAINS_WORK",
          "6529NM-C-0001",
          { collection_membership_status: "selected" }
        ),
        accessionRelation,
      ])
    ).toBe(false);
    expect(isRelationGatedCollectionMember(work, [collectionRelation])).toBe(
      false
    );
    expect(isRelationGatedCollectionMember(work, [accessionRelation])).toBe(
      false
    );
    expect(
      isRelationGatedCollectionMember(work, [
        {
          ...collectionRelation,
          sourceEntityId: "6529NM-C-0002",
        },
        accessionRelation,
      ])
    ).toBe(false);
    expect(
      isRelationGatedCollectionMember(work, [
        collectionRelation,
        {
          ...accessionRelation,
          sourceEntityId: "6529NM-ACC-ENT-0002",
        },
      ])
    ).toBe(false);
    expect(
      isRelationGatedCollectionMember(work, [
        {
          ...collectionRelation,
          sourceEntityId: work.id,
          targetEntityId: "6529NM-C-0001",
        },
        accessionRelation,
      ])
    ).toBe(false);
    expect(
      isRelationGatedCollectionMember(work, [
        collectionRelation,
        {
          ...collectionRelation,
          id: "6529NM-REL-COLLECTION-DUPLICATE",
        },
        accessionRelation,
      ])
    ).toBe(false);
    expect(
      isRelationGatedCollectionMember(
        {
          ...work,
          profile: {
            work_lifecycle_status: "accessioned",
            accession_entity_ids: ["6529NM-ACC-ENT-0001"],
            collection_membership: {
              status: "not_in_collection",
              collection_entity_id: "6529NM-C-0001",
              accession_entity_ids: ["6529NM-ACC-ENT-0001"],
            },
          },
        },
        [collectionRelation, accessionRelation]
      )
    ).toBe(false);
    expect(
      isRelationGatedCollectionMember(
        {
          ...work,
          id: "6529NM-W-0008",
          profile: {
            work_lifecycle_status: "accessioned",
            accession_entity_ids: [],
            collection_membership: {
              status: "not_in_collection",
              collection_entity_id: "6529NM-C-0001",
              accession_entity_ids: [],
            },
          },
        },
        [
          { ...collectionRelation, targetEntityId: "6529NM-W-0008" },
          { ...accessionRelation, targetEntityId: "6529NM-W-0008" },
        ]
      )
    ).toBe(false);
  });
});
