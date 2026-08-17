import {
  buildMuseumResearchDetailEntry,
  buildMuseumResearchRelations,
} from "@/app/museum/network/research/[slug]/page";
import {
  buildMuseumResearchIndex,
  findMuseumResearchIndexEntry,
  type MuseumResearchIndexEntry,
} from "@/app/museum/network/research/page";
import type {
  MuseumMedia,
  MuseumPublicDocument,
  MuseumPublication,
} from "@/lib/museum/publication/types";

const SOURCE_COMMIT = "a".repeat(40);
const WORK_ID = "6529NM-W-0001";
const FALLBACK_WORK_ID = "6529NM-W-0002";
const ARTIST_ID = "6529NM-AGT-0001";
const RESEARCH_ID = "6529NM-RP-0001";
const ACQUISITION_ID = "6529NM-AP-0001";
const PROGRAM_ID = "6529NM-PRG-0001";

const MEDIA: MuseumMedia = {
  id: "6529NM-MED-0001",
  artworkId: WORK_ID,
  kind: "still",
  role: "source",
  mediaType: "image/jpeg",
  width: 1200,
  height: 900,
  altText: "A governed work image.",
  credit: {
    creditLine: "Museum publication record",
    licenseLabel: "CC BY-NC 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
    rightsExpressionId: "cc-by-nc-4.0",
    sourcePath: "records/media/6529NM-MED-0001.json",
  },
  sourcePath: "records/media/6529NM-MED-0001.json",
  custody: "retained",
  url: "https://example.com/governed-work.jpg",
  preservationStatus: "retained_verified",
  sha256: `sha256:${"a".repeat(64)}`,
  upstreamProvider: null,
};

const DOCUMENT = {
  id: RESEARCH_ID,
  kind: "project_essay" as const,
  title: "A study of a work",
  markdown:
    "# A study of a work\n\nThe work remains the subject of this study.",
  sha256: null,
  sourcePath: "records/research/a-study.md",
  artistIds: [],
  projectIds: [],
  giftIds: [],
  artworkIds: [],
  workIds: [],
};

const ENTRY: MuseumResearchIndexEntry = {
  id: RESEARCH_ID,
  slug: "a-study-of-a-work",
  title: DOCUMENT.title,
  group: "art",
  sourcePath: "records/entities/6529NM-RP-0001.json",
  typed: true,
  document: DOCUMENT,
  publicationUri:
    "https://github.com/6529-Collections/6529networkmuseum/blob/" +
    SOURCE_COMMIT +
    "/" +
    DOCUMENT.sourcePath,
  media: {
    ...MEDIA,
    url: "https://example.com/fallback-from-index.jpg",
  },
};

function publication(): MuseumPublication {
  return {
    identity: {
      repository: "6529-Collections/6529networkmuseum",
      requestedRef: SOURCE_COMMIT,
      commit: SOURCE_COMMIT,
      manifestPath: "release-artifacts/latest/record-manifest.json",
      manifestSha256: null,
      manifestCommitment: null,
      inventoryCount: 0,
      assembledAt: "2026-08-12T00:00:00Z",
    },
    declaredSourcePaths: [],
    artists: [
      {
        id: ARTIST_ID,
        slug: "the-artist",
        preferredName: "The Artist",
        projectIds: [],
        artworkIds: [],
        workIds: [WORK_ID],
        documentIds: [],
        sourcePaths: ["records/entities/6529NM-AGT-0001.json"],
      },
    ],
    projects: [],
    gifts: [],
    artworks: [],
    works: [
      {
        kind: "work",
        id: WORK_ID,
        slug: "the-work",
        title: "The Work",
        medium: "digital work",
        artistId: ARTIST_ID,
        projectId: null,
        status: "accessioned_into_permanent_collection",
        statusAsOf: "2026-08-01T00:00:00Z",
        collectionMembership: true,
        acquisitionIds: [],
        programIds: [],
        media: [MEDIA],
        documentIds: [],
        qualifiers: [],
        sourcePaths: ["records/entities/6529NM-W-0001.json"],
      },
    ],
    documents: [DOCUMENT],
    researchPublications: [
      {
        kind: "research",
        id: RESEARCH_ID,
        slug: ENTRY.slug,
        title: ENTRY.title,
        publicationKind: "project_study",
        publicationUri: ENTRY.publicationUri!,
        authorIds: [ARTIST_ID],
        subjectIds: [WORK_ID],
        sourcePath: ENTRY.sourcePath,
      },
    ],
    relations: [
      {
        id: "6529NM-REL-0001",
        relation: "publication_interprets_entity",
        from: { id: RESEARCH_ID, kind: "research" },
        to: { id: WORK_ID, kind: "work" },
        sourcePath: "records/relations/6529NM-REL-0001.json",
      },
    ],
    institutionalPractice: {} as MuseumPublication["institutionalPractice"],
    dataArchitecture: {} as MuseumPublication["dataArchitecture"],
    rightsHandbook: {} as MuseumPublication["rightsHandbook"],
  } as MuseumPublication;
}

describe("Museum research detail enrichment", () => {
  it("generates unique URL-safe document slugs and resolves each detail entry", () => {
    const generatedDocuments: readonly MuseumPublicDocument[] = [
      {
        ...DOCUMENT,
        id: "typed-source:records/research/a-study.md",
        sourcePath: "records/research/a-study.md",
      },
      {
        ...DOCUMENT,
        id: "typed-source:records/research/a:study.md",
        sourcePath: "records/research/a:study.md",
      },
      {
        ...DOCUMENT,
        id: "typed-source:records/research/a/study.md",
        sourcePath: "records/research/a/study.md",
      },
    ];
    const current = publication();
    const withUnrepresentedDocuments = {
      ...current,
      documents: [...current.documents, ...generatedDocuments],
    };

    const entries = buildMuseumResearchIndex(withUnrepresentedDocuments);
    const generatedEntries = entries.filter((entry) =>
      generatedDocuments.some((document) => document.id === entry.id)
    );

    expect(entries.find((entry) => entry.id === RESEARCH_ID)?.slug).toBe(
      ENTRY.slug
    );
    expect(new Set(entries.map((entry) => entry.slug)).size).toBe(
      entries.length
    );
    expect(generatedEntries).toHaveLength(generatedDocuments.length);
    expect(generatedEntries[0]?.slug).toMatch(/^a-study-of-a-work-/u);
    for (const entry of generatedEntries) {
      expect(entry.slug).not.toMatch(/[:%/\\]/u);
      expect(
        findMuseumResearchIndexEntry(withUnrepresentedDocuments, entry.slug)
      ).toEqual(expect.objectContaining({ id: entry.id, slug: entry.slug }));
    }
  });

  it("joins a typed publication to its exact current manuscript before record IDs", () => {
    const manuscript = {
      ...DOCUMENT,
      id: `typed-source:${DOCUMENT.sourcePath}`,
      markdown:
        "# A study of a work\n\nThe governed manuscript is the visitor-facing publication.",
    };
    const machineRecord: MuseumPublicDocument = {
      ...DOCUMENT,
      id: RESEARCH_ID,
      kind: "source_record",
      title: "Research publication record",
      markdown: '{"recordType":"RESEARCH_PUBLICATION"}',
      sourcePath: "records/entities/6529NM-RP-0001.json",
    };
    const current = {
      ...publication(),
      documents: [machineRecord, manuscript],
    };

    const entry = findMuseumResearchIndexEntry(current, ENTRY.slug);

    expect(entry).toEqual(
      expect.objectContaining({
        id: RESEARCH_ID,
        typed: true,
        publicationUri: ENTRY.publicationUri,
        document: expect.objectContaining({
          id: manuscript.id,
          sourcePath: manuscript.sourcePath,
          markdown: manuscript.markdown,
        }),
      })
    );
  });

  it("fails closed when a typed publication has no exact manuscript source", () => {
    const current = {
      ...publication(),
      researchPublications: [
        {
          ...publication().researchPublications![0]!,
          publicationUri: ENTRY.publicationUri!.replace(
            DOCUMENT.sourcePath,
            "records/research/not-the-manuscript.md"
          ),
        },
      ],
    };

    expect(
      buildMuseumResearchIndex(current).some(
        (entry) => entry.id === RESEARCH_ID && entry.typed
      )
    ).toBe(false);
  });

  it("prefers typed subject media and carries typed subjects and authors", () => {
    const detail = buildMuseumResearchDetailEntry(publication(), ENTRY);

    expect(detail.media?.url).toBe(MEDIA.url);
    expect(detail.categoryLabel).toBe("Art and artists");
    expect(detail.kindLabel).toBe("Project study");
    expect(detail.primaryRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "work",
          id: WORK_ID,
          href: "/museum/network/works/" + WORK_ID,
          relation: "Interprets",
        }),
      ])
    );
    expect(detail.secondaryRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "artist",
          id: ARTIST_ID,
          href: "/museum/network/artists/the-artist",
          relation: "Author",
        }),
      ])
    );
  });

  it("prefers a document's directly associated work over broader program media", () => {
    const fallbackMedia: MuseumMedia = {
      ...MEDIA,
      id: "6529NM-MED-0002",
      artworkId: FALLBACK_WORK_ID,
      url: "https://example.com/broad-program-fallback.jpg",
      sourcePath: "records/media/6529NM-MED-0002.json",
      credit: {
        ...MEDIA.credit,
        sourcePath: "records/media/6529NM-MED-0002.json",
      },
    };
    const current = publication();
    const directDocument = {
      ...DOCUMENT,
      workIds: [WORK_ID],
    };
    const currentWorks = current.works ?? [];
    const withProgramContext = {
      ...current,
      documents: [directDocument],
      works: [
        ...currentWorks,
        {
          ...currentWorks[0]!,
          id: FALLBACK_WORK_ID,
          slug: "the-broad-program-work",
          title: "The Broad Program Work",
          media: [fallbackMedia],
        },
      ],
      curatedAcquisitions: [
        {
          kind: "curated_acquisition" as const,
          id: ACQUISITION_ID,
          slug: "the-program-acquisition",
          title: "The Program Acquisition",
          thesis: "A broad acquisition used only as research context.",
          status: "accessioned_into_permanent_collection" as const,
          statusAsOf: "2026-08-01T00:00:00Z",
          acquisitionMethod: "gift" as const,
          programId: PROGRAM_ID,
          artistIds: [],
          organizationIds: [],
          projectIds: [],
          workIds: [FALLBACK_WORK_ID],
          accessionLotIds: [],
          sourceDocumentIds: [],
          sourcePaths: ["records/entities/6529NM-AP-0001.json"],
        },
      ],
      acquisitionPrograms: [
        {
          kind: "acquisition_program" as const,
          id: PROGRAM_ID,
          slug: "the-broad-program",
          title: "The Broad Program",
          status: "open" as const,
          statusAsOf: "2026-08-01T00:00:00Z",
          acquisitionMethod: "gift" as const,
          acquisitionIds: [ACQUISITION_ID],
          sourceDocumentIds: [],
          sourcePaths: ["records/entities/6529NM-PRG-0001.json"],
        },
      ],
      researchPublications: [
        {
          ...current.researchPublications![0]!,
          subjectIds: [PROGRAM_ID],
        },
      ],
    } as MuseumPublication;

    const entry = findMuseumResearchIndexEntry(withProgramContext, ENTRY.slug);

    expect(entry?.media?.url).toBe(MEDIA.url);
  });

  it("includes explicit interpretation relations without inventing unresolved entities", () => {
    const current = publication();
    const { media: _media, ...entry } = ENTRY;
    const relations = buildMuseumResearchRelations(current, entry);

    expect(relations.primaryRelations).toHaveLength(1);
    expect(relations.primaryRelations[0]?.id).toBe(WORK_ID);
    expect(
      relations.primaryRelations.some(
        (relation) => relation.id === "unpublished-entity"
      )
    ).toBe(false);
  });
});
