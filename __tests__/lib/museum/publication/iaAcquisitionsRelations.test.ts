import {
  buildMuseumAcquisitionContext,
  buildMuseumArtistRelations,
} from "@/lib/museum/publication/ia";
import { buildMuseumWorkRelations } from "@/lib/museum/publication/iaWorkContext";
import type { MuseumPublication } from "@/lib/museum/publication/types";

const SOURCE_COMMIT = "a".repeat(40);

function relationPublication(): MuseumPublication {
  const source = (id: string) => `records/entities/${id}.json`;
  const artist = (id: string, slug: string, workId: string) => ({
    id,
    slug,
    preferredName: slug,
    projectIds: [],
    artworkIds: [],
    workIds: [workId],
    documentIds: [],
    sourcePaths: [source(id)],
  });
  const work = (
    id: string,
    artistId: string,
    status: NonNullable<MuseumPublication["works"]>[number]["status"],
    acquisitionId: string,
    programIds: readonly string[]
  ) => ({
    kind: "work" as const,
    id,
    slug: id.toLocaleLowerCase(),
    title: id,
    medium: "digital work",
    artistId,
    projectId: null,
    status,
    statusAsOf: "2026-01-01",
    collectionMembership: status === "accessioned_into_permanent_collection",
    acquisitionIds: [acquisitionId],
    programIds,
    media: [],
    documentIds: [],
    qualifiers: [],
    sourcePaths: [source(id)],
  });
  const acquisition = (
    id: string,
    slug: string,
    status: NonNullable<
      MuseumPublication["curatedAcquisitions"]
    >[number]["status"],
    method: "gift" | "program_primary_mint_purchase",
    workId: string,
    artistId: string,
    programId: string | null
  ) => ({
    kind: "curated_acquisition" as const,
    id,
    slug,
    title: slug,
    thesis: `${slug} thesis`,
    status,
    statusAsOf: "2026-01-01",
    acquisitionMethod: method,
    programId,
    artistIds: [artistId],
    organizationIds: slug === "magnum-acquisition" ? ["6529NM-ORG-0002"] : [],
    projectIds: [],
    workIds: [workId],
    accessionLotIds: [],
    sourceDocumentIds: [],
    sourcePaths: [source(id)],
  });

  return {
    identity: {
      repository: "6529-Collections/6529networkmuseum",
      requestedRef: SOURCE_COMMIT,
      commit: SOURCE_COMMIT,
      manifestPath: "release-artifacts/latest/record-manifest.json",
      manifestSha256: null,
      manifestCommitment: null,
      inventoryCount: 0,
      assembledAt: "2026-08-08T00:00:00Z",
    },
    declaredSourcePaths: [],
    artists: [
      artist("6529NM-AGT-0001", "casey-reas", "6529NM-W-0001"),
      artist("6529NM-AGT-0002", "keys-artist", "6529NM-W-0008"),
      artist("6529NM-AGT-0003", "magnum-artist", "6529NM-W-0024"),
    ],
    organizations: [
      {
        kind: "organization",
        id: "6529NM-ORG-0002",
        slug: "magnum-photos",
        preferredName: "Magnum Photos",
        projectIds: [],
        artworkIds: [],
        acquisitionIds: ["6529NM-CA-2026-003"],
        documentIds: [],
        sourcePaths: [source("6529NM-ORG-0002")],
      },
    ],
    projects: [],
    gifts: [],
    artworks: [],
    works: [
      work(
        "6529NM-W-0001",
        "6529NM-AGT-0001",
        "accessioned_into_permanent_collection",
        "6529NM-CA-2026-001",
        []
      ),
      work(
        "6529NM-W-0008",
        "6529NM-AGT-0002",
        "selected_through_acquisition_program_acquisition_pending",
        "6529NM-CA-2026-002",
        ["6529NM-AP-ENT-0002"]
      ),
      work(
        "6529NM-W-0024",
        "6529NM-AGT-0003",
        "accessioned_into_permanent_collection",
        "6529NM-CA-2026-003",
        ["6529NM-AP-ENT-0001"]
      ),
    ],
    curatedAcquisitions: [
      acquisition(
        "6529NM-CA-2026-001",
        "casey-acquisition",
        "accessioned_into_permanent_collection",
        "gift",
        "6529NM-W-0001",
        "6529NM-AGT-0001",
        null
      ),
      acquisition(
        "6529NM-CA-2026-002",
        "keys-acquisition",
        "selected_through_acquisition_program_acquisition_pending",
        "program_primary_mint_purchase",
        "6529NM-W-0008",
        "6529NM-AGT-0002",
        "6529NM-AP-ENT-0002"
      ),
      acquisition(
        "6529NM-CA-2026-003",
        "magnum-acquisition",
        "accessioned_into_permanent_collection",
        "gift",
        "6529NM-W-0024",
        "6529NM-AGT-0003",
        "6529NM-AP-ENT-0001"
      ),
    ],
    acquisitionPrograms: [
      {
        kind: "acquisition_program",
        id: "6529NM-AP-ENT-0001",
        slug: "gift-acquisitions",
        title: "Gift Acquisitions",
        status: "open",
        statusAsOf: "2026-01-01",
        acquisitionMethod: "gift",
        acquisitionIds: [],
        sourceDocumentIds: [],
        sourcePaths: [source("6529NM-AP-ENT-0001")],
      },
      {
        kind: "acquisition_program",
        id: "6529NM-AP-ENT-0002",
        slug: "keys-and-gates",
        title: "Keys and Gates",
        status: "selection_complete",
        statusAsOf: "2026-01-01",
        acquisitionMethod: "program_primary_mint_purchase",
        acquisitionIds: ["6529NM-CA-2026-002"],
        sourceDocumentIds: [],
        sourcePaths: [source("6529NM-AP-ENT-0002")],
      },
    ],
    documents: [],
    institutionalPractice: {} as MuseumPublication["institutionalPractice"],
    dataArchitecture: {} as MuseumPublication["dataArchitecture"],
    rightsHandbook: {} as MuseumPublication["rightsHandbook"],
  } as MuseumPublication;
}

describe("typed acquisition/work relation presentation", () => {
  it("keeps Casey, Keys and Gates, and Magnum relations semantically distinct", () => {
    const publication = relationPublication();
    const casey = buildMuseumWorkRelations(publication, "6529NM-W-0001", null);
    expect(casey.secondaryRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "6529NM-CA-2026-001",
          relation: "Acquired through",
        }),
      ])
    );
    expect(casey.secondaryRelations).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ relation: "Selected through" }),
      ])
    );

    const keys = buildMuseumWorkRelations(publication, "6529NM-W-0008", null);
    expect(keys.secondaryRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "6529NM-CA-2026-002",
          relation: "Part of",
        }),
        expect.objectContaining({
          id: "6529NM-AP-ENT-0002",
          relation: "Selected through",
        }),
      ])
    );

    const magnum = buildMuseumWorkRelations(publication, "6529NM-W-0024", null);
    expect(magnum.secondaryRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "6529NM-CA-2026-003",
          relation: "Acquired through",
        }),
      ])
    );
    expect(magnum.secondaryRelations).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ relation: "Selected through" }),
      ])
    );
    const magnumAcquisition = buildMuseumAcquisitionContext(
      publication,
      "magnum-acquisition",
      null
    );
    expect(magnumAcquisition?.secondaryRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "6529NM-AP-ENT-0001",
          relation: "Gift pathway",
        }),
        expect.objectContaining({
          id: "6529NM-ORG-0002",
          relation: "Project originator",
        }),
      ])
    );
  });

  it("uses a lifecycle-neutral artist relation for peer acquisitions", () => {
    const publication = relationPublication();

    expect(
      buildMuseumArtistRelations(publication, "casey-reas").secondaryRelations
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "6529NM-CA-2026-001",
          relation: "Acquired through",
          status: "accessioned_into_permanent_collection",
          statusAsOf: "2026-01-01",
        }),
      ])
    );

    expect(
      buildMuseumArtistRelations(publication, "keys-artist").secondaryRelations
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "6529NM-CA-2026-002",
          relation: "Included in",
          status: "selected_through_acquisition_program_acquisition_pending",
          statusAsOf: "2026-01-01",
        }),
      ])
    );

    expect(
      buildMuseumArtistRelations(publication, "magnum-artist")
        .secondaryRelations
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "6529NM-CA-2026-003",
          relation: "Acquired through",
          status: "accessioned_into_permanent_collection",
          statusAsOf: "2026-01-01",
        }),
      ])
    );
  });
});
