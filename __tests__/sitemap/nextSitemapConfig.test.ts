import sitemapConfig, {
  buildAdditionalSitemapPaths,
  fetchCursorPaginatedData,
  getNftSitemapPaths,
  getPublicWavePaths,
  MUSEUM_STATIC_CANONICAL_PATHS,
  STATIC_INDEXABLE_PATHS,
  shouldExcludeSitemapPath,
} from "@/next-sitemap.config";
import type {
  MuseumPublication,
  MuseumPublicationLoadState,
  MuseumPublicEntityGraph,
  MuseumPublicEntityRecord,
  MuseumPublicEntityType,
} from "@/lib/museum/publication/types";

const makeFetchJson =
  (responses: Record<string, unknown>) =>
  async (url: string): Promise<unknown> => {
    const response = responses[url];
    if (response === undefined) {
      throw new Error(`Unexpected URL: ${url}`);
    }
    return response;
  };

const SOURCE_COMMIT = "92966f2836ebf2af06edfe0fe2cff25041307c92";

function museumEntity({
  id,
  entityType,
  slug,
  canonicalRoute,
  entityStatus = "published",
  pageExposure = "canonical_page",
  sourceRecordIds = [id],
}: {
  readonly id: string;
  readonly entityType: MuseumPublicEntityType;
  readonly slug: string | null;
  readonly canonicalRoute: string | null;
  readonly entityStatus?: MuseumPublicEntityRecord["entityStatus"];
  readonly pageExposure?: MuseumPublicEntityRecord["pageExposure"];
  readonly sourceRecordIds?: readonly string[];
}): MuseumPublicEntityRecord {
  return {
    id,
    entityType,
    label: `${entityType} ${id}`,
    slug,
    canonicalRoute,
    pageExposure,
    entityStatus,
    statusAsOf: "2026-09-15T00:00:00.000Z",
    sourcePath: `records/entities/${id}.json`,
    sourceRecordIds,
    profile: { profile_type: entityType },
  };
}

const governedWorks = Array.from({ length: 29 }, (_, index) => {
  const id = `6529NM-W-${String(index + 1).padStart(4, "0")}`;
  return museumEntity({
    id,
    entityType: "WORK",
    slug: id,
    canonicalRoute: `/museum/network/works/${id}`,
  });
});

const GOVERNED_ARTIST_SLUGS = [
  "casey-reas",
  "gulyildiz",
  "hugofaz",
  "nasimghanizadeh",
  "intrepid",
  "ikertje",
  "giant",
  "priyanka",
  "rakesh",
  "pandelic",
  "minalisa",
  "teyhu",
  "arsonic",
  "zoku",
  "shamspranto",
  "veerendra",
  "david-seymour",
  "larry-towell",
  "micha-bar-am",
  "moises-saman",
  "lorenzo-meloni",
  "vera-molnar",
  "martin-grasser",
] as const;

const governedArtists = GOVERNED_ARTIST_SLUGS.map((slug, index) => {
  const sequence = String(index + 1).padStart(4, "0");
  return museumEntity({
    id: `6529NM-ART-${sequence}`,
    entityType: "ARTIST",
    slug,
    canonicalRoute: `/museum/network/artists/${slug}`,
  });
});

const canonicalMuseumFamilies = [
  museumEntity({
    id: "6529NM-PROJ-0001",
    entityType: "PROJECT_OR_SERIES",
    slug: "century",
    canonicalRoute: "/museum/network/projects/century",
  }),
  museumEntity({
    id: "6529NM-ORG-0001",
    entityType: "ORGANIZATION",
    slug: "art-blocks",
    canonicalRoute: "/museum/network/organizations/art-blocks",
  }),
  museumEntity({
    id: "6529NM-ORG-0002",
    entityType: "ORGANIZATION",
    slug: "magnum-photos",
    canonicalRoute: "/museum/network/organizations/magnum-photos",
  }),
  museumEntity({
    id: "6529NM-PROJ-9998",
    entityType: "PROJECT_OR_SERIES",
    slug: "pre-process",
    canonicalRoute: "/museum/network/projects/pre-process",
  }),
  museumEntity({
    id: "6529NM-PROJ-9999",
    entityType: "PROJECT_OR_SERIES",
    slug: "phototaxis",
    canonicalRoute: "/museum/network/projects/phototaxis",
  }),
  museumEntity({
    id: "6529NM-PROJ-0004",
    entityType: "PROJECT_OR_SERIES",
    slug: "923-empty-rooms",
    canonicalRoute: "/museum/network/projects/923-empty-rooms",
  }),
  museumEntity({
    id: "6529NM-PROJ-0005",
    entityType: "PROJECT_OR_SERIES",
    slug: "ex-nihilo-cosmos",
    canonicalRoute: "/museum/network/projects/ex-nihilo-cosmos",
  }),
  museumEntity({
    id: "6529NM-PROJ-0006",
    entityType: "PROJECT_OR_SERIES",
    slug: "magnum-photos-75",
    canonicalRoute: "/museum/network/projects/magnum-photos-75",
  }),
  museumEntity({
    id: "6529NM-PROJ-0007",
    entityType: "PROJECT_OR_SERIES",
    slug: "themes-and-variations",
    canonicalRoute: "/museum/network/projects/themes-and-variations",
  }),
  museumEntity({
    id: "6529NM-CA-2026-001",
    entityType: "CURATED_ACQUISITION",
    slug: "the-system-in-seven-states",
    canonicalRoute: "/museum/network/acquisitions/the-system-in-seven-states",
    sourceRecordIds: ["6529NM.2026.001.01"],
  }),
  museumEntity({
    id: "6529NM-CA-2026-002",
    entityType: "CURATED_ACQUISITION",
    slug: "keys-and-gates",
    canonicalRoute: "/museum/network/acquisitions/keys-and-gates",
    sourceRecordIds: ["6529NM-AP-01"],
  }),
  museumEntity({
    id: "6529NM-CA-2026-003",
    entityType: "CURATED_ACQUISITION",
    slug: "conflict-at-its-edges",
    canonicalRoute: "/museum/network/acquisitions/conflict-at-its-edges",
    sourceRecordIds: ["6529NM-PG-2026-001"],
  }),
  museumEntity({
    id: "6529NM-CA-2026-004",
    entityType: "CURATED_ACQUISITION",
    slug: "a-gift-of-themes-and-variations-210",
    canonicalRoute:
      "/museum/network/acquisitions/a-gift-of-themes-and-variations-210",
    sourceRecordIds: ["6529NM-PG-2026-002"],
  }),
  museumEntity({
    id: "6529NM-AP-ENT-0001",
    entityType: "ACQUISITION_PROGRAM",
    slug: "gift-acquisitions",
    canonicalRoute: "/museum/network/acquisition-programs/gift-acquisitions",
  }),
  museumEntity({
    id: "6529NM-AP-ENT-0002",
    entityType: "ACQUISITION_PROGRAM",
    slug: "keys-and-gates",
    canonicalRoute: "/museum/network/acquisition-programs/keys-and-gates",
  }),
  museumEntity({
    id: "6529NM-RP-0001",
    entityType: "RESEARCH_PUBLICATION",
    slug: "the-system-in-seven-states",
    canonicalRoute: "/museum/network/research/the-system-in-seven-states",
  }),
  museumEntity({
    id: "6529NM-RP-0002",
    entityType: "RESEARCH_PUBLICATION",
    slug: "access-control-and-exit",
    canonicalRoute: "/museum/network/research/access-control-and-exit",
  }),
  museumEntity({
    id: "6529NM-RP-0003",
    entityType: "RESEARCH_PUBLICATION",
    slug: "conflict-at-its-edges",
    canonicalRoute: "/museum/network/research/conflict-at-its-edges",
  }),
] as const;

const excludedMuseumEntities = [
  museumEntity({
    id: "6529NM-PROJ-0002",
    entityType: "PROJECT_OR_SERIES",
    slug: "archived-project",
    canonicalRoute: "/museum/network/projects/archived-project",
    entityStatus: "archived",
  }),
  museumEntity({
    id: "6529NM-PROJ-0003",
    entityType: "PROJECT_OR_SERIES",
    slug: "canonical-project",
    canonicalRoute: "/museum/network/projects/noncanonical-project",
  }),
  museumEntity({
    id: "6529NM-AG-0001",
    entityType: "AGENT",
    slug: null,
    canonicalRoute: null,
    pageExposure: "relational_only",
  }),
  museumEntity({
    id: "6529NM-MED-0001",
    entityType: "MEDIA_REFERENCE",
    slug: null,
    canonicalRoute: null,
    pageExposure: "reserved_no_instance",
  }),
  museumEntity({
    id: "6529NM-W-0030",
    entityType: "WORK",
    slug: null,
    canonicalRoute: "/museum/network/works/6529NM-W-0030",
  }),
  museumEntity({
    id: "WORK-WITHOUT-CANONICAL-IDENTITY",
    entityType: "WORK",
    slug: "WORK-WITHOUT-CANONICAL-IDENTITY",
    canonicalRoute: "/museum/network/works/WORK-WITHOUT-CANONICAL-IDENTITY",
  }),
] as const;

const museumEntities = [
  ...governedWorks,
  ...governedArtists,
  ...canonicalMuseumFamilies,
  ...excludedMuseumEntities,
];

const museumGraph = {
  sourceCommit: SOURCE_COMMIT,
  entityPaths: museumEntities.map((entity) => entity.sourcePath),
  relationPaths: [],
  entities: museumEntities,
  relations: [],
  identityInventory: {
    sourcePath: "schemas/public-entity-identity-inventory.json",
    inventoryVersion: "1.7.0",
    curatedAcquisitionIds: [
      "6529NM-CA-2026-001",
      "6529NM-CA-2026-002",
      "6529NM-CA-2026-003",
      "6529NM-CA-2026-004",
    ],
    workAliases: [
      {
        kind: "work_source_alias",
        sourceObjectId: "6529NM.2026.001.01",
        workId: "6529NM-W-0001",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
    ],
    acquisitionAliases: [
      {
        kind: "acquisition_source_alias",
        alias: "6529NM.2026.001",
        acquisitionId: "6529NM-CA-2026-001",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
    ],
    programAliases: [
      {
        kind: "program_source_alias",
        alias: "6529NM-AP-01",
        programId: "6529NM-AP-ENT-0002",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
    ],
    routeAliases: [
      {
        legacyRoute: "/museum/network/works/6529NM.2026.001.01",
        canonicalRoute: "/museum/network/works/6529NM-W-0001",
        canonicalEntityId: "6529NM-W-0001",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
      {
        legacyRoute: "/museum/network/acquisition-programs/6529NM-AP-01",
        canonicalRoute: "/museum/network/acquisition-programs/keys-and-gates",
        canonicalEntityId: "6529NM-AP-ENT-0002",
        sourcePath: "schemas/public-entity-identity-inventory.json",
      },
    ],
    typedReferenceRegistry: [],
  },
  relationIdentityInventory: {
    sourcePath: "schemas/public-relation-identity-inventory.json",
    schemaPath: "schemas/public-relation-identity-inventory.schema.json",
    inventoryVersion: "1.5.0",
    activeRelationIds: [],
    retiredRelationIds: [],
  },
} satisfies MuseumPublicEntityGraph;

const museumPublication = {
  identity: {
    repository: "6529-Collections/6529networkmuseum",
    requestedRef: SOURCE_COMMIT,
    commit: SOURCE_COMMIT,
    manifestPath: "release-artifacts/latest/record-manifest.json",
    manifestSha256: null,
    manifestCommitment: null,
    inventoryCount: museumGraph.entityPaths.length,
    assembledAt: "2026-09-15T00:00:00.000Z",
  },
  declaredSourcePaths: museumGraph.entityPaths,
  artists: [],
  projects: [],
  gifts: [],
  artworks: [],
  documents: [],
  institutionalPractice: {} as MuseumPublication["institutionalPractice"],
  dataArchitecture: {} as MuseumPublication["dataArchitecture"],
  rightsHandbook: {} as MuseumPublication["rightsHandbook"],
  entityGraph: museumGraph,
} satisfies MuseumPublication;

const museumPublicationState = {
  status: "current",
  errorCode: null,
  failedAt: null,
  lastValidAcceptedAt: null,
  publication: museumPublication,
} satisfies MuseumPublicationLoadState;

const museumBundle = async () => ({
  publicationState: museumPublicationState,
  view: null,
});

const buildFixturePaths = (responses: Record<string, unknown>) =>
  buildAdditionalSitemapPaths(makeFetchJson(responses), museumBundle, {
    minimumItems: {
      memes: 0,
      "meme-lab": 0,
      gradient: 0,
      "nextgen-tokens": 0,
      "nextgen-collections": 0,
      "public-waves": 0,
    },
  });

describe("next-sitemap config", () => {
  it.each([
    "/artwork-documentation",
    "/artwork-documentation?sourceDropId=example",
    "/artwork-documentation/programs/example",
    "/artwork-documentation/works/work/contexts/context/revisions/revision",
  ])("excludes private artwork documentation from sitemaps: %s", (path) => {
    expect(shouldExcludeSitemapPath(path)).toBe(true);
  });

  it("uses the shared collection-specific NFT focus policy", () => {
    const paths = getNftSitemapPaths("/the-memes/1").map((path) => path.loc);

    expect(paths).toContain("/the-memes/1");
    expect(paths).not.toContain("/the-memes/1?focus=the-art");
    expect(paths).toContain("/the-memes/1?focus=collectors");
    expect(paths).not.toContain("/the-memes/1?focus=your-cards");
    expect(
      getNftSitemapPaths("/meme-lab/1", "meme-lab").map((path) => path.loc)
    ).toContain("/meme-lab/1?focus=references");
  });

  it("registers audited public reference routes, including the indexable web mint destination", () => {
    expect(STATIC_INDEXABLE_PATHS).toEqual(
      expect.arrayContaining([
        "/about/open-metaverse",
        "/open-data",
        "/the-memes/mint",
        "/tools/api",
      ])
    );
    expect(shouldExcludeSitemapPath("/the-memes/mint")).toBe(false);
  });

  it("filters public wave sitemap entries to non-private non-DM waves", async () => {
    const fetchJson = makeFetchJson({
      "https://api.6529.io/api/v2/waves?view=SEARCH&page=1&page_size=50&direct_message=false":
        {
          data: [
            {
              id: "public-wave",
              is_private: false,
              is_dm_wave: false,
              last_drop_time: 1781133491826,
            },
            {
              id: "private-wave",
              is_private: true,
              is_dm_wave: false,
            },
            {
              id: "dm-wave",
              is_private: false,
              is_dm_wave: true,
            },
          ],
          next: false,
        },
    });

    const paths = await getPublicWavePaths(fetchJson);

    expect(paths).toEqual([
      expect.objectContaining({
        loc: "/waves/public-wave",
        changefreq: "hourly",
        priority: 0.75,
        lastmod: "2026-06-10T23:18:11.826Z",
      }),
    ]);
  });

  it("builds expanded dynamic paths from current API sitemap feeds", async () => {
    const fetchJson = makeFetchJson({
      "https://api.6529.io/sitemap/memes": {
        data: [1],
        next: "https://api.6529.io/sitemap/memes?page=2",
      },
      "https://api.6529.io/sitemap/memes?page=2": {
        data: [2],
        next: null,
      },
      "https://api.6529.io/sitemap/gradient": {
        data: [0],
        next: null,
      },
      "https://api.6529.io/sitemap/meme-lab": {
        data: [10],
        next: null,
      },
      "https://api.6529.io/sitemap/nextgen/tokens": {
        data: [10000000000],
        next: null,
      },
      "https://api.6529.io/sitemap/nextgen/collections": {
        data: ["Pebbles"],
        next: null,
      },
      "https://api.6529.io/api/v2/waves?view=SEARCH&page=1&page_size=50&direct_message=false":
        {
          data: [
            {
              id: "5f207393-5418-4a75-8738-e40edb44a94d",
              is_private: false,
              is_dm_wave: false,
              created_at: 1779906304544,
            },
          ],
          next: false,
        },
    });

    const paths = await buildAdditionalSitemapPaths(fetchJson, museumBundle, {
      minimumItems: {
        memes: 0,
        "meme-lab": 0,
        gradient: 0,
        "nextgen-tokens": 0,
        "nextgen-collections": 0,
        "public-waves": 0,
      },
    });
    const locations = paths.map((path) => path.loc);

    expect(locations).toContain("/the-memes/1");
    expect(locations).toContain("/the-memes/2?focus=timeline");
    expect(locations).toContain("/6529-gradient/0");
    expect(locations).toContain("/meme-lab/10");
    expect(locations).toContain("/nextgen/token/10000000000");
    expect(locations).toContain("/nextgen/collection/pebbles");
    expect(locations).toContain("/nextgen/collection/pebbles/art");
    expect(locations).toContain("/waves/5f207393-5418-4a75-8738-e40edb44a94d");
    expect(locations).toContain("/museum/network/acquisitions");
    expect(locations).toContain("/museum/network/research");
    expect(locations).toContain(
      "/museum/network/research/institutional-practice"
    );
    expect(locations).toContain("/museum/network/research/data-architecture");
    expect(locations).toContain("/museum/network/research/rights");
    expect(locations).toContain("/museum/network/about/governance");
    expect(locations).toContain("/museum/network/works");
    expect(locations).toContain("/museum/network/artists");
    expect(locations).toContain("/museum/network/organizations");
    expect(locations).toContain("/education/education-collaboration-form");
    expect(locations).not.toContain("/about/release-notes");
    expect(locations).toEqual(expect.arrayContaining(STATIC_INDEXABLE_PATHS));
  });

  it("publishes fixed Museum pages and only governed canonical Museum entities", async () => {
    const expectedStaticPaths = [
      "/museum/network",
      "/museum/network/collection",
      "/museum/network/artists",
      "/museum/network/acquisitions",
      "/museum/network/research",
      "/museum/network/about",
      "/museum/network/works",
      "/museum/network/projects",
      "/museum/network/organizations",
      "/museum/network/acquisition-programs",
      "/museum/network/research/institutional-practice",
      "/museum/network/research/institutional-practice/adjacent-practice",
      "/museum/network/research/institutional-practice/sources",
      "/museum/network/research/scholarship-and-writing",
      "/museum/network/research/sources-and-chronology",
      "/museum/network/research/data-architecture",
      "/museum/network/research/data-architecture/spectrum",
      "/museum/network/research/data-architecture/cidoc-crm",
      "/museum/network/research/data-architecture/lido",
      "/museum/network/research/data-architecture/premis",
      "/museum/network/research/data-architecture/prov-o",
      "/museum/network/research/data-architecture/getty-aat-ulan",
      "/museum/network/research/data-architecture/iiif",
      "/museum/network/research/data-architecture/c2pa",
      "/museum/network/research/data-architecture/bagit",
      "/museum/network/research/data-architecture/ocfl",
      "/museum/network/research/data-architecture/caip-19",
      "/museum/network/research/data-architecture/casey-reas-implementation",
      "/museum/network/research/rights",
      "/museum/network/research/rights/artists",
      "/museum/network/research/rights/collectors",
      "/museum/network/about/governance",
    ] as const;

    expect(MUSEUM_STATIC_CANONICAL_PATHS).toEqual(expectedStaticPaths);

    const paths = await buildFixturePaths({
      "https://api.6529.io/sitemap/memes": { data: [], next: null },
      "https://api.6529.io/sitemap/gradient": { data: [], next: null },
      "https://api.6529.io/sitemap/meme-lab": { data: [], next: null },
      "https://api.6529.io/sitemap/nextgen/tokens": {
        data: [],
        next: null,
      },
      "https://api.6529.io/sitemap/nextgen/collections": {
        data: [],
        next: null,
      },
      "https://api.6529.io/api/v2/waves?view=SEARCH&page=1&page_size=50&direct_message=false":
        {
          data: [],
          next: false,
        },
    });
    const museumLocations = paths
      .map((path) => path.loc)
      .filter((path) => path.startsWith("/museum/network"));
    const expectedWorkPaths = governedWorks.map(
      (entity) => entity.canonicalRoute
    );
    const expectedArtistPaths = governedArtists.map(
      (entity) => entity.canonicalRoute
    );
    const expectedEntityFamilyPaths = canonicalMuseumFamilies.map(
      (entity) => entity.canonicalRoute
    );

    expect(new Set(museumLocations)).toEqual(
      new Set([
        ...expectedStaticPaths,
        ...expectedWorkPaths,
        ...expectedArtistPaths,
        ...expectedEntityFamilyPaths,
      ])
    );
    expect(
      museumLocations.filter((path) =>
        path.startsWith("/museum/network/works/")
      )
    ).toHaveLength(29);
    expect(
      museumLocations.filter((path) =>
        path.startsWith("/museum/network/artists/")
      )
    ).toHaveLength(23);
    expect(museumLocations).toEqual(
      expect.arrayContaining([
        "/museum/network/projects/century",
        "/museum/network/organizations/art-blocks",
        "/museum/network/acquisitions/the-system-in-seven-states",
        "/museum/network/acquisition-programs/keys-and-gates",
        "/museum/network/research/the-system-in-seven-states",
      ])
    );
    const acquisitionEntities = canonicalMuseumFamilies.filter(
      (entity) => entity.entityType === "CURATED_ACQUISITION"
    );
    expect(acquisitionEntities).toHaveLength(4);
    for (const acquisition of acquisitionEntities) {
      expect(acquisition.sourceRecordIds).not.toContain(acquisition.id);
    }
    for (const excludedPath of [
      "/museum/network/research/institutional-practice/met",
      "/museum/network/research/data-architecture/unknown-standard",
      "/museum/network/about/governance/6529NM-GOV-1052148",
      ...excludedMuseumEntities.flatMap((entity) =>
        entity.canonicalRoute === null ? [] : [entity.canonicalRoute]
      ),
      ...museumGraph.identityInventory.routeAliases.map(
        (alias) => alias.legacyRoute
      ),
    ]) {
      expect(museumLocations).not.toContain(excludedPath);
    }
  });

  it("preserves the governed Museum route inventory from an accepted stale publication", async () => {
    const paths = await buildAdditionalSitemapPaths(
      makeFetchJson({
        "https://api.6529.io/sitemap/memes": { data: [], next: null },
        "https://api.6529.io/sitemap/gradient": { data: [], next: null },
        "https://api.6529.io/sitemap/meme-lab": { data: [], next: null },
        "https://api.6529.io/sitemap/nextgen/tokens": {
          data: [],
          next: null,
        },
        "https://api.6529.io/sitemap/nextgen/collections": {
          data: [],
          next: null,
        },
        "https://api.6529.io/api/v2/waves?view=SEARCH&page=1&page_size=50&direct_message=false":
          { data: [], next: false },
      }),
      async () => ({
        publicationState: {
          status: "stale",
          publication: museumPublication,
          errorCode: "source_unavailable",
          failedAt: "2026-09-16T00:00:00.000Z",
          lastValidAcceptedAt: "2026-09-15T00:00:00.000Z",
        },
        view: null,
      }),
      {
        minimumItems: {
          memes: 0,
          "meme-lab": 0,
          gradient: 0,
          "nextgen-tokens": 0,
          "nextgen-collections": 0,
          "public-waves": 0,
        },
      }
    );
    const museumLocations = paths.map((path) => path.loc);

    expect(
      museumLocations.filter((path) =>
        path.startsWith("/museum/network/works/")
      )
    ).toHaveLength(29);
    expect(
      museumLocations.filter((path) =>
        path.startsWith("/museum/network/artists/")
      )
    ).toHaveLength(23);
    expect(museumLocations).toContain(
      "/museum/network/acquisitions/the-system-in-seven-states"
    );
  });

  it("fails atomically when a required API feed fails", async () => {
    const fetchJson = makeFetchJson({
      "https://api.6529.io/sitemap/memes": {
        data: [1],
        next: null,
      },
      "https://api.6529.io/sitemap/gradient": new Error("gradient failed"),
      "https://api.6529.io/sitemap/meme-lab": {
        data: [10],
        next: null,
      },
      "https://api.6529.io/sitemap/nextgen/tokens": {
        data: [10000000000],
        next: null,
      },
      "https://api.6529.io/sitemap/nextgen/collections": {
        data: ["Pebbles"],
        next: null,
      },
      "https://api.6529.io/api/v2/waves?view=SEARCH&page=1&page_size=50&direct_message=false":
        {
          data: [],
          next: false,
        },
    });

    const throwingFetchJson = async (url: string): Promise<unknown> => {
      const response = await fetchJson(url);
      if (response instanceof Error) {
        throw response;
      }
      return response;
    };

    await expect(
      buildAdditionalSitemapPaths(throwingFetchJson, museumBundle, {
        minimumItems: {
          memes: 0,
          "meme-lab": 0,
          gradient: 0,
          "nextgen-tokens": 0,
          "nextgen-collections": 0,
          "public-waves": 0,
        },
      })
    ).rejects.toThrow("gradient failed");
  });

  it("rejects malformed feed items and cyclic cursor continuations", async () => {
    await expect(
      buildFixturePaths({
        "https://api.6529.io/sitemap/memes": {
          data: ["not-an-integer"],
          next: null,
        },
        "https://api.6529.io/sitemap/gradient": { data: [], next: null },
        "https://api.6529.io/sitemap/meme-lab": { data: [], next: null },
        "https://api.6529.io/sitemap/nextgen/tokens": { data: [], next: null },
        "https://api.6529.io/sitemap/nextgen/collections": {
          data: [],
          next: null,
        },
        "https://api.6529.io/api/v2/waves?view=SEARCH&page=1&page_size=50&direct_message=false":
          { data: [], next: false },
      })
    ).rejects.toThrow("Invalid memes sitemap item");

    await expect(
      fetchCursorPaginatedData(
        "https://api.6529.io/sitemap/memes",
        makeFetchJson({
          "https://api.6529.io/sitemap/memes": {
            data: [1],
            next: "https://api.6529.io/sitemap/memes",
          },
        })
      )
    ).rejects.toThrow("cycle detected");
  });

  it("enforces NFT source floors using unique feed identifiers", async () => {
    await expect(
      buildAdditionalSitemapPaths(
        makeFetchJson({
          "https://api.6529.io/sitemap/memes": {
            data: [1, 1],
            next: null,
          },
          "https://api.6529.io/sitemap/gradient": { data: [], next: null },
          "https://api.6529.io/sitemap/meme-lab": { data: [], next: null },
          "https://api.6529.io/sitemap/nextgen/tokens": {
            data: [],
            next: null,
          },
          "https://api.6529.io/sitemap/nextgen/collections": {
            data: [],
            next: null,
          },
          "https://api.6529.io/api/v2/waves?view=SEARCH&page=1&page_size=50&direct_message=false":
            { data: [], next: false },
        }),
        museumBundle,
        {
          minimumItems: {
            memes: 2,
            "meme-lab": 0,
            gradient: 0,
            "nextgen-tokens": 0,
            "nextgen-collections": 0,
            "public-waves": 0,
          },
        }
      )
    ).rejects.toThrow("Sitemap memes inventory fell below its required floor");
  });

  it("requires an accepted Museum publication graph", async () => {
    await expect(
      buildAdditionalSitemapPaths(
        makeFetchJson({
          "https://api.6529.io/sitemap/memes": { data: [], next: null },
          "https://api.6529.io/sitemap/gradient": { data: [], next: null },
          "https://api.6529.io/sitemap/meme-lab": { data: [], next: null },
          "https://api.6529.io/sitemap/nextgen/tokens": {
            data: [],
            next: null,
          },
          "https://api.6529.io/sitemap/nextgen/collections": {
            data: [],
            next: null,
          },
          "https://api.6529.io/api/v2/waves?view=SEARCH&page=1&page_size=50&direct_message=false":
            {
              data: [],
              next: false,
            },
        }),
        async () =>
          ({
            publicationState: {
              status: "unavailable",
              publication: null,
              errorCode: "source_unavailable",
              failedAt: "2026-09-14T00:00:00.000Z",
              lastValidAcceptedAt: null,
            },
            view: null,
          }) as never,
        {
          minimumItems: {
            memes: 0,
            "meme-lab": 0,
            gradient: 0,
            "nextgen-tokens": 0,
            "nextgen-collections": 0,
            "public-waves": 0,
          },
        }
      )
    ).rejects.toThrow("Museum sitemap publication unavailable");
  });

  it("excludes app-only and restricted routes from generated sitemap output", () => {
    expect(shouldExcludeSitemapPath("/access")).toBe(true);
    expect(shouldExcludeSitemapPath("/preferences")).toBe(true);
    expect(shouldExcludeSitemapPath("/content-preferences")).toBe(true);
    expect(shouldExcludeSitemapPath("/buidl")).toBe(true);
    expect(shouldExcludeSitemapPath("/punk6529/subscriptions")).toBe(true);
    expect(shouldExcludeSitemapPath("/messages/create?wave=abc")).toBe(true);
    expect(shouldExcludeSitemapPath("/tools/app-wallets")).toBe(true);
    expect(shouldExcludeSitemapPath("/stream")).toBe(true);
    expect(shouldExcludeSitemapPath("/museum/network/collections")).toBe(true);
    expect(shouldExcludeSitemapPath("/museum/network/objects/OUT-001")).toBe(
      true
    );
    expect(
      shouldExcludeSitemapPath("/museum/network/gifts/6529NM.2026.001")
    ).toBe(true);
    expect(
      shouldExcludeSitemapPath("/museum/network/programs/6529NM-AP-01")
    ).toBe(true);
    expect(shouldExcludeSitemapPath("/museum/network/stories")).toBe(true);
    expect(shouldExcludeSitemapPath("/museum/network/methodology")).toBe(true);
    expect(shouldExcludeSitemapPath("/museum/network/governance")).toBe(true);
    expect(shouldExcludeSitemapPath("/museum/network/rights/cc-by-4.0")).toBe(
      true
    );
    expect(shouldExcludeSitemapPath("/museum/network/about/governance")).toBe(
      false
    );
    expect(shouldExcludeSitemapPath("/museum/network/research/rights")).toBe(
      false
    );
    expect(
      shouldExcludeSitemapPath("/museum/network/acquisitions/keys-and-gates")
    ).toBe(false);
    expect(shouldExcludeSitemapPath("/reviews/6529-stream")).toBe(true);
    expect(
      shouldExcludeSitemapPath("/reviews/6529-stream/for-artists?ref=nav")
    ).toBe(true);
    expect(shouldExcludeSitemapPath("/waves")).toBe(false);
  });

  it("does not stamp transformed static routes with synthetic lastmod values", async () => {
    await expect(
      sitemapConfig.transform!(sitemapConfig, "/waves")
    ).resolves.toEqual({
      loc: "/waves",
      changefreq: "hourly",
      priority: 0.9,
    });
  });
});
