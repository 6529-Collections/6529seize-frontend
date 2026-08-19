import {
  buildMuseumResearchDetailEntry,
  buildMuseumResearchRelations,
  researchEditorialMediaForEntry,
  researchEditorialMobileMediaForEntry,
} from "@/app/museum/network/research/[slug]/page";
import {
  buildMuseumResearchIndex,
  findMuseumResearchIndexEntry,
  type MuseumResearchIndexEntry,
} from "@/app/museum/network/research/catalog";
import {
  exactWorkMedia,
  exactWorkMediaSrcSet,
  resolveExactWorkMediaById,
} from "@/app/museum/network/research/media";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumMedia,
  MuseumPublicDocument,
  MuseumPublication,
} from "@/lib/museum/publication/types";

const SOURCE_COMMIT = "a".repeat(40);
const WORK_ID = "6529NM-W-0001";
const FALLBACK_WORK_ID = "6529NM-W-0002";
const ARTIST_ID = "6529NM-AGT-0001";
const RESEARCH_ID = "6529NM-RP-0099";
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
  workIds: [WORK_ID],
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
  it.each([
    [
      "generative-system-analysis-standard",
      "/museum/research/editorial/generative-method.svg",
    ],
    [
      "from-public-repository-to-on-chain-museum-record",
      "/museum/research/editorial/repository-to-chain.svg",
    ],
  ])("illustrates the institutional study %s", (slug, expectedUrl) => {
    expect(
      researchEditorialMediaForEntry({
        ...ENTRY,
        slug,
      })
    ).toEqual(
      expect.objectContaining({
        url: expectedUrl,
        mediaType: "image/svg+xml",
        width: 1600,
        height: 1000,
      })
    );
  });

  it.each([
    [
      "generative-system-analysis-standard",
      "/museum/research/editorial/generative-method-mobile.svg",
      640,
      1560,
    ],
    [
      "from-public-repository-to-on-chain-museum-record",
      "/museum/research/editorial/repository-to-chain-mobile.svg",
      640,
      1840,
    ],
  ])(
    "uses a legible portrait diagram for %s on mobile",
    (slug, expectedUrl, width, height) => {
      expect(
        researchEditorialMobileMediaForEntry({
          ...ENTRY,
          slug,
        })
      ).toEqual(
        expect.objectContaining({
          url: expectedUrl,
          mediaType: "image/svg+xml",
          width,
          height,
        })
      );
    }
  );

  it.each([
    [
      "generative-system-analysis-standard",
      "A method for reconstructing a generative work's source, behavior, output space, display, and conservation requirements.",
    ],
    [
      "from-public-repository-to-on-chain-museum-record",
      "The open record, its cryptographic commitment, the future contract, and the website remain separate layers of the Museum's publication system.",
    ],
  ])("uses a distinct hero description for %s", (slug, description) => {
    expect(
      buildMuseumResearchDetailEntry(publication(), {
        ...ENTRY,
        slug,
      })?.description
    ).toBe(description);
  });

  it.each([
    [
      "6529NM-W-0024",
      "Patrolling the border between the Negev Desert and Jordan",
      "6529NM-W-0024-1280.webp",
    ],
    [
      "6529NM-W-0025",
      "Government soldiers in a church, Suchitoto, El Salvador",
      "6529NM-W-0025-1280.webp",
    ],
    [
      "6529NM-W-0026",
      "Demonstration, Western Wall, Jerusalem",
      "6529NM-W-0026-1280.webp",
    ],
    ["6529NM-W-0027", "Tripoli, Libya", "6529NM-W-0027-1280.webp"],
    ["6529NM-W-0028", "Palmyra, Syria", "6529NM-W-0028-1280.webp"],
  ])(
    "uses the retained Research display copy for %s",
    (workId, title, expectedFilename) => {
      const current = publication();
      const withConflictWork = {
        ...current,
        works: current.works?.map((work) => ({ ...work, id: workId, title })),
      } as MuseumPublication;

      expect(exactWorkMedia(withConflictWork, title)?.url).toBe(
        `/museum/research/editorial/magnum/${expectedFilename}`
      );
      expect(exactWorkMediaSrcSet(withConflictWork, title)).toContain(
        expectedFilename.replace("-1280", "-640")
      );
    }
  );

  it("keeps fallback media unpaired when a stable work has no exact media", () => {
    const current = publication();
    const fallbackMedia: MuseumMedia = {
      ...MEDIA,
      id: "6529NM-MED-FALLBACK",
      artworkId: "6529NM-W-0024",
      url: "https://example.com/editorial-fallback.jpg",
    };
    const stableWork = {
      ...current.works![0]!,
      id: "6529NM-W-0024",
      media: [],
    };
    const entry = {
      ...ENTRY,
      id: "6529NM-RP-0099",
      title: "A renamed research study",
      document: {
        ...DOCUMENT,
        id: "6529NM-RP-0099",
        title: "A renamed research study",
        workIds: ["6529NM-W-0024"],
      },
      media: fallbackMedia,
    };
    const withStableWork = {
      ...current,
      works: [stableWork],
    } as MuseumPublication;

    expect(resolveExactWorkMediaById(withStableWork, "6529NM-W-0024")).toEqual(
      {}
    );
    const detail = buildMuseumResearchDetailEntry(withStableWork, entry);
    expect(detail?.media?.url).toBe(fallbackMedia.url);
    expect(detail?.mediaSrcSet).toBeUndefined();
  });

  it("keys acquisition overrides by stable research ID rather than display title", () => {
    const current = publication();
    const assignedWork = {
      ...current.works![0]!,
      id: "6529NM-W-0006",
      title: "Assigned work",
      media: [MEDIA],
    };
    const selectedSections = [
      "Casey Reas in the 6529 Network Museum",
      "I. A collection begins with difference",
      "III. Behavior becomes drawing",
      "IV. The room and the cosmos",
      "VII. Into public study",
    ];
    const acquisitionDocument = {
      ...DOCUMENT,
      id: "typed-source:records/research/system.md",
      title: "Display title changed by an editor",
      workIds: ["6529NM-W-0006"],
      markdown: [
        "# Display title changed by an editor",
        ...selectedSections.map((section) => `## ${section}\n\nParagraph.`),
      ].join("\n\n"),
    };
    const renamedEntry = {
      ...ENTRY,
      id: "6529NM-RP-0001",
      title: "Display title changed by an editor",
      document: acquisitionDocument,
    };
    const withAssignedWork = {
      ...current,
      works: [assignedWork],
    } as MuseumPublication;

    const detail = buildMuseumResearchDetailEntry(
      withAssignedWork,
      renamedEntry
    );

    expect(detail).toEqual(
      expect.objectContaining({
        title: "Display title changed by an editor",
        description: t(
          DEFAULT_LOCALE,
          "museum.network.research.systemDescription"
        ),
        statusLabel: t(
          DEFAULT_LOCALE,
          "museum.network.research.permanentCollection"
        ),
        media: expect.objectContaining({ url: MEDIA.url }),
        selectedMarkdown: expect.stringContaining(
          "III. Behavior becomes drawing"
        ),
      })
    );
  });

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

  it("opens the Conflict essay rather than its publication-administration record", () => {
    const essayPath =
      "records/proposed-gifts/6529NM-PG-2026-001/public/scholarship/essays/conflict-at-its-edges.md";
    const essay = {
      ...DOCUMENT,
      id: `typed-source:${essayPath}`,
      title: "Conflict at Its Edges",
      sourcePath: essayPath,
      markdown:
        "# Conflict at Its Edges\n\nFive photographs approach conflict at a remove from battle.",
    };
    const current = publication();
    const withConflictEssay = {
      ...current,
      documents: [...current.documents, essay],
      researchPublications: current.researchPublications?.map((record) => ({
        ...record,
        title: "Conflict at Its Edges",
        publicationUri: `https://github.com/6529-Collections/6529networkmuseum/blob/${SOURCE_COMMIT}/${essayPath}`,
      })),
    } as MuseumPublication;

    const entry = buildMuseumResearchIndex(withConflictEssay).find(
      (candidate) => candidate.id === RESEARCH_ID
    );

    expect(entry?.document?.sourcePath).toBe(essayPath);
    expect(entry?.publicationUri).toBe(
      `https://github.com/6529-Collections/6529networkmuseum/blob/${SOURCE_COMMIT}/${essayPath}`
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

  it("uses the document's exact work media and carries typed subjects and authors", () => {
    const detail = buildMuseumResearchDetailEntry(publication(), ENTRY);

    expect(detail).not.toBeNull();
    if (detail === null) throw new Error("Research detail must resolve");

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

  it("binds the Conflict display statement to the immutable accession authority", () => {
    const detail = buildMuseumResearchDetailEntry(publication(), {
      ...ENTRY,
      id: "6529NM-RP-0003",
      slug: "conflict-at-its-edges",
      title: "Conflict at Its Edges",
      document: {
        ...DOCUMENT,
        title: "Conflict at Its Edges",
        markdown: [
          "# Conflict at Its Edges",
          "",
          "## Five Photographs of Borders, Access, and Afterlives, 1952–2016",
          "Text.",
          "## A border named from a distance",
          "Text.",
          "## Armed presence in sacred architecture",
          "Text.",
          "## Smoke, access, and the interrupted event",
          "Text.",
          "## The ruin after destruction",
          "Text.",
          "## The case and its limit",
          "Text.",
        ].join("\n\n"),
      },
    });

    expect(detail?.institutionalDisplay).toEqual({
      statement:
        "These All Rights Reserved works are shown as part of the Museum’s permanent Collection. The Museum’s credited institutional display position does not transfer copyright or create a general reproduction licence.",
      href: `https://github.com/6529-Collections/6529networkmuseum/blob/${SOURCE_COMMIT}/records/accessions/6529NM.2026.002/public/web-presentation-authority.md`,
      linkLabel: "Read the display basis",
    });
  });

  it("fails closed when an acquisition essay loses a required reading section", () => {
    const current = publication();
    const incompleteDocument = {
      ...DOCUMENT,
      title: "Conflict at Its Edges",
      markdown: "# Conflict at Its Edges\n\n## An unrelated section\n\nText.",
    };
    const incompleteEntry = {
      ...ENTRY,
      id: "6529NM-RP-0003",
      title: "Conflict at Its Edges",
      document: incompleteDocument,
    };

    expect(buildMuseumResearchDetailEntry(current, incompleteEntry)).toBeNull();
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
