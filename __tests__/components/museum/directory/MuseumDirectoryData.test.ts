import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  MuseumPublication,
  MuseumPublicEntityGraph,
  MuseumPublicRelationRecord,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";
import {
  buildMuseumDirectoryModel,
  museumDirectoryHasPermanentCollectionEdge,
  museumDirectoryStatusText,
} from "@/components/museum/directory/MuseumDirectoryData";

const collectionEntity = {
  id: "6529NM-COL-0001",
  entityType: "COLLECTION" as const,
  label: "6529 Network Museum Collection",
  slug: "permanent-collection",
  canonicalRoute: "/museum/network/collection",
  pageExposure: "canonical_page" as const,
  entityStatus: "published" as const,
  sourcePath: "records/collections/permanent.json",
  sourceRecordIds: [],
  profile: {},
};

function work(
  id: string,
  artistId: string,
  status: MuseumPublicWork["status"],
  options: {
    readonly collectionMembership?: boolean;
    readonly acquisitionIds?: readonly string[];
    readonly programIds?: readonly string[];
  } = {}
): MuseumPublicWork {
  const base = {
    kind: "work",
    id,
    slug: id,
    title: id,
    medium: "Photograph",
    artistId,
    projectId: null,
    status,
    statusAsOf: "2026-08-12",
    acquisitionIds: options.acquisitionIds ?? [],
    programIds: options.programIds ?? [],
    media: [],
    documentIds: [],
    qualifiers: [],
    sourcePaths: [`records/works/${id}.json`],
  } satisfies Omit<MuseumPublicWork, "collectionMembership">;
  return options.collectionMembership === undefined
    ? base
    : { ...base, collectionMembership: options.collectionMembership };
}

function relation(targetEntityId: string): MuseumPublicRelationRecord {
  return {
    id: `relation-${targetEntityId}`,
    relationType: "COLLECTION_CONTAINS_WORK",
    sourceEntityId: collectionEntity.id,
    targetEntityId,
    assertionStatus: "asserted",
    qualifier: { collection_membership_status: "permanent_collection" },
    sourceRecordIds: [],
    sourcePath: "records/relations/collection.json",
  };
}

function publication(works: readonly MuseumPublicWork[]): MuseumPublication {
  const artists = [
    {
      id: "artist-casey",
      slug: "casey-reas",
      preferredName: "Casey Reas",
      projectIds: [],
      artworkIds: [],
      workIds: works
        .filter((item) => item.artistId === "artist-casey")
        .map((item) => item.id),
      documentIds: [],
      sourcePaths: ["records/artists/casey-reas.json"],
    },
    {
      id: "artist-k-and-g",
      slug: "keys-artist",
      preferredName: "Keys and Gates artist",
      projectIds: [],
      artworkIds: [],
      workIds: works
        .filter((item) => item.artistId === "artist-k-and-g")
        .map((item) => item.id),
      documentIds: [],
      sourcePaths: ["records/artists/keys-artist.json"],
    },
  ];
  return {
    identity: {
      repository: "6529-Collections/6529networkmuseum",
      requestedRef: "main",
      commit: "a".repeat(40),
      manifestPath: "release-artifacts/latest/record-manifest.json",
      manifestSha256: null,
      manifestCommitment: null,
      inventoryCount: 0,
      assembledAt: "2026-08-12",
    },
    declaredSourcePaths: [],
    artists,
    projects: [],
    gifts: [],
    artworks: [],
    works,
    curatedAcquisitions: [
      {
        kind: "curated_acquisition",
        id: "6529NM-CA-2026-002",
        slug: "keys-and-gates",
        title: "Keys and Gates",
        thesis: "A photographic group.",
        status: "selected_through_acquisition_program_acquisition_pending",
        statusAsOf: "2026-08-12",
        acquisitionMethod: "purchase",
        programId: "6529NM-AP-ENT-0002",
        artistIds: ["artist-k-and-g"],
        organizationIds: [],
        projectIds: [],
        workIds: ["6529NM-W-0008"],
        accessionLotIds: [],
        sourceDocumentIds: [],
        sourcePaths: ["records/acquisitions/keys-and-gates.json"],
      },
    ],
    acquisitionPrograms: [
      {
        kind: "acquisition_program",
        id: "6529NM-AP-ENT-0002",
        slug: "keys-and-gates",
        title: "Keys and Gates",
        status: "selection_complete",
        statusAsOf: "2026-08-12",
        acquisitionMethod: "purchase",
        acquisitionIds: ["6529NM-CA-2026-002"],
        sourceDocumentIds: [],
        sourcePaths: ["records/programs/keys-and-gates.json"],
      },
    ],
    documents: [],
    institutionalPractice: {} as MuseumPublication["institutionalPractice"],
    dataArchitecture: {} as MuseumPublication["dataArchitecture"],
    rightsHandbook: {} as MuseumPublication["rightsHandbook"],
    entityGraph: {
      sourceCommit: "a".repeat(40),
      entityPaths: [],
      relationPaths: [],
      entities: [collectionEntity],
      relations: works
        .filter((item) => item.collectionMembership === true)
        .map((item) => relation(item.id)),
      identityInventory: {} as MuseumPublicEntityGraph["identityInventory"],
      relationIdentityInventory:
        {} as MuseumPublicEntityGraph["relationIdentityInventory"],
    },
  };
}

describe("Museum directory state and copy", () => {
  it("uses the graph-gated Collection edge and moves a work automatically when it becomes accessioned", () => {
    const selectedMagnum = work(
      "6529NM-W-0024",
      "artist-casey",
      "selected_by_museum_wave_acquisition_review_in_progress",
      { collectionMembership: false, acquisitionIds: ["magnum-acquisition"] }
    );
    const selectedPublication = publication([selectedMagnum]);
    expect(
      museumDirectoryHasPermanentCollectionEdge(
        selectedPublication,
        selectedMagnum
      )
    ).toBe(false);
    expect(
      buildMuseumDirectoryModel(selectedPublication)?.acquisitionWorks
    ).toHaveLength(1);

    const accessionedMagnum = work(
      "6529NM-W-0024",
      "artist-casey",
      "accessioned_into_permanent_collection",
      { collectionMembership: true, acquisitionIds: ["magnum-acquisition"] }
    );
    const accessionedPublication = publication([accessionedMagnum]);
    expect(
      museumDirectoryHasPermanentCollectionEdge(
        accessionedPublication,
        accessionedMagnum
      )
    ).toBe(true);
    const model = buildMuseumDirectoryModel(accessionedPublication);
    expect(model?.permanentWorks).toHaveLength(1);
    expect(model?.acquisitionWorks).toHaveLength(0);
  });

  it("keeps permanent and acquisition-processing counts separate without emitting a zero Collection count", () => {
    const model = buildMuseumDirectoryModel(
      publication([
        work(
          "6529NM-W-0001",
          "artist-casey",
          "accessioned_into_permanent_collection",
          {
            collectionMembership: true,
          }
        ),
        work(
          "6529NM-W-0008",
          "artist-k-and-g",
          "selected_through_acquisition_program_acquisition_pending",
          {
            collectionMembership: false,
            acquisitionIds: ["6529NM-CA-2026-002"],
            programIds: ["6529NM-AP-ENT-0002"],
          }
        ),
      ])
    );
    expect(model?.artists[0]?.relationship).toContain(
      "1 in the permanent Collection"
    );
    expect(model?.artists[0]?.relationship).not.toContain(
      "0 in the permanent Collection"
    );
    expect(model?.artists[1]?.relationship).toContain("Keys and Gates");
    expect(model?.artists[1]?.relationship).not.toContain(
      "0 in the permanent Collection"
    );
  });

  it("credits every artist on a collaborative Collection work", () => {
    const collaborativeWork = {
      ...work(
        "6529NM-W-0029",
        "artist-casey",
        "accessioned_into_permanent_collection",
        { collectionMembership: true }
      ),
      artistIds: ["artist-casey", "artist-martin"],
    };
    const base = publication([collaborativeWork]);
    const model = buildMuseumDirectoryModel({
      ...base,
      artists: [
        ...base.artists,
        {
          id: "artist-martin",
          slug: "martin-grasser",
          preferredName: "Martin Grasser",
          projectIds: [],
          artworkIds: [],
          workIds: [collaborativeWork.id],
          documentIds: [],
          sourcePaths: ["records/artists/martin-grasser.json"],
        },
      ],
    });

    expect(
      model?.artists.find((record) => record.artist.id === "artist-martin")
        ?.relationship
    ).toContain("1 in the permanent Collection");
  });

  it("describes Keys and Gates as selected and unminted rather than in accession processing", () => {
    const selectedWork = work(
      "6529NM-W-0008",
      "artist-k-and-g",
      "selected_through_acquisition_program_acquisition_pending",
      {
        acquisitionIds: ["6529NM-CA-2026-002"],
        programIds: ["6529NM-AP-ENT-0002"],
      }
    );
    const model = buildMuseumDirectoryModel(publication([selectedWork]));
    const record = model?.works[0];

    expect(record).toBeDefined();
    expect(museumDirectoryStatusText(record!)).toContain("unminted");
    expect(museumDirectoryStatusText(record!)).toContain("Keys and Gates");
    expect(museumDirectoryStatusText(record!)).not.toContain(
      "accession processing"
    );
  });

  it("does not contain the database phrase in the directory implementation or generated relationships", () => {
    const sourcePaths = [
      "app/museum/network/artists/page.tsx",
      "app/museum/network/works/page.tsx",
      "components/museum/directory/MuseumDirectoryData.ts",
      "components/museum/directory/MuseumDirectoryMediaCard.tsx",
      "components/museum/directory/MuseumDirectoryPages.tsx",
    ];
    const source = sourcePaths
      .map((path) => readFileSync(resolve(process.cwd(), path), "utf8"))
      .join("\n");
    expect(source.toLocaleLowerCase()).not.toContain("connected work");

    const model = buildMuseumDirectoryModel(
      publication([
        work(
          "6529NM-W-0008",
          "artist-k-and-g",
          "selected_through_acquisition_program_acquisition_pending",
          {
            acquisitionIds: ["6529NM-CA-2026-002"],
            programIds: ["6529NM-AP-ENT-0002"],
          }
        ),
      ])
    );
    expect(JSON.stringify(model)).not.toContain("connected work");
  });
});
