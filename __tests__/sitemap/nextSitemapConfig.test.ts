import sitemapConfig, {
  buildAdditionalSitemapPaths,
  fetchCursorPaginatedData,
  getNftSitemapPaths,
  getProfileSample,
  getPublicWavePaths,
  MUSEUM_STATIC_CANONICAL_PATHS,
  STATIC_INDEXABLE_PATHS,
  shouldExcludeSitemapPath,
} from "@/next-sitemap.config";
import { getVisibleToolsNavGroups } from "@/components/tools/tools.routes";
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

const PROFILES_PAGE_1_URL =
  "https://api.6529.io/api/community-members/top?sort=level&sort_direction=DESC&page_size=100&page=1";

const ZERO_FLOORS = {
  memes: 0,
  "meme-lab": 0,
  gradient: 0,
  "nextgen-tokens": 0,
  "nextgen-collections": 0,
  "public-waves": 0,
  profiles: 0,
} as const;

type BuildOptions = NonNullable<
  Parameters<typeof buildAdditionalSitemapPaths>[2]
>;

// Tests never sleep between retries and never print to the build log.
const testOptions = (overrides: BuildOptions = {}): BuildOptions => ({
  minimumItems: ZERO_FLOORS,
  failurePolicy: "fail",
  retry: { sleep: async () => undefined },
  log: () => undefined,
  warn: () => undefined,
  ...overrides,
});

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
  buildAdditionalSitemapPaths(
    makeFetchJson(responses),
    museumBundle,
    testOptions()
  );

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
        "/safe-collecting",
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
      [PROFILES_PAGE_1_URL]: {
        data: [
          {
            detail_view_key: "punk6529",
            level: 100,
            last_activity: 1791966707000,
          },
        ],
        next: false,
      },
    });

    const paths = await buildAdditionalSitemapPaths(
      fetchJson,
      museumBundle,
      testOptions()
    );
    const locations = paths.map((path) => path.loc);

    expect(locations).toContain("/the-memes/1");
    expect(locations).toContain("/the-memes/2?focus=timeline");
    expect(locations).toContain("/6529-gradient/0");
    expect(locations).toContain("/meme-lab/10");
    expect(locations).toContain("/nextgen/token/10000000000");
    expect(locations).toContain("/nextgen/collection/pebbles");
    expect(locations).toContain("/nextgen/collection/pebbles/art");
    expect(locations).toContain("/waves/5f207393-5418-4a75-8738-e40edb44a94d");
    expect(locations).toContain("/punk6529");
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
      testOptions()
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
      buildAdditionalSitemapPaths(
        throwingFetchJson,
        museumBundle,
        testOptions()
      )
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
        testOptions({ minimumItems: { ...ZERO_FLOORS, memes: 2 } })
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
        testOptions()
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

const FEED_URLS = {
  memes: "https://api.6529.io/sitemap/memes",
  gradient: "https://api.6529.io/sitemap/gradient",
  memeLab: "https://api.6529.io/sitemap/meme-lab",
  nextgenTokens: "https://api.6529.io/sitemap/nextgen/tokens",
  nextgenCollections: "https://api.6529.io/sitemap/nextgen/collections",
  waves:
    "https://api.6529.io/api/v2/waves?view=SEARCH&page=1&page_size=50&direct_message=false",
} as const;

const healthyFeedResponses = (): Record<string, unknown> => ({
  [FEED_URLS.memes]: { data: [1], next: null },
  [FEED_URLS.gradient]: { data: [0], next: null },
  [FEED_URLS.memeLab]: { data: [10], next: null },
  [FEED_URLS.nextgenTokens]: { data: [10000000000], next: null },
  [FEED_URLS.nextgenCollections]: { data: ["Pebbles"], next: null },
  [FEED_URLS.waves]: { data: [], next: false },
  [PROFILES_PAGE_1_URL]: {
    data: [{ detail_view_key: "punk6529", level: 100, last_activity: null }],
    next: false,
  },
});

// Fails each listed URL for its first N requests, like a flaky API.
function createFlakyFetchJson(
  responses: Record<string, unknown>,
  failures: Record<string, number>
) {
  const calls = new Map<string, number>();
  const fetchJson = async (url: string): Promise<unknown> => {
    const count = (calls.get(url) ?? 0) + 1;
    calls.set(url, count);
    if (count <= (failures[url] ?? 0)) {
      throw new Error(`HTTP 503 ${url}`);
    }
    return makeFetchJson(responses)(url);
  };
  return { fetchJson, calls };
}

describe("next-sitemap resilience", () => {
  it("retries a transient feed failure and keeps the section", async () => {
    const { fetchJson, calls } = createFlakyFetchJson(healthyFeedResponses(), {
      [FEED_URLS.gradient]: 2,
    });
    const log = jest.fn();

    const paths = await buildAdditionalSitemapPaths(
      fetchJson,
      museumBundle,
      testOptions({ log })
    );

    expect(paths.map((path) => path.loc)).toContain("/6529-gradient/0");
    expect(calls.get(FEED_URLS.gradient)).toBe(3);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("attempt 1/3"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("attempt 2/3"));
  });

  it("fails after the retry budget when the policy is fail", async () => {
    const { fetchJson, calls } = createFlakyFetchJson(healthyFeedResponses(), {
      [FEED_URLS.gradient]: 99,
    });

    await expect(
      buildAdditionalSitemapPaths(fetchJson, museumBundle, testOptions())
    ).rejects.toThrow("Sitemap gradient failed after 3 attempts");
    expect(calls.get(FEED_URLS.gradient)).toBe(3);
  });

  it("skips only the unavailable section with a loud warning under the fallback policy", async () => {
    const { fetchJson } = createFlakyFetchJson(healthyFeedResponses(), {
      [FEED_URLS.gradient]: 99,
    });
    const warn = jest.fn();
    const log = jest.fn();

    const paths = await buildAdditionalSitemapPaths(
      fetchJson,
      museumBundle,
      testOptions({ failurePolicy: "fallback", warn, log })
    );
    const locations = paths.map((path) => path.loc);

    expect(locations).not.toContain("/6529-gradient/0");
    expect(locations).toContain("/the-memes/1");
    expect(locations).toContain("/meme-lab/10");
    expect(locations).toContain("/nextgen/token/10000000000");
    expect(locations).toContain("/tools/block-finder");
    expect(locations).toContain("/museum/network/works/6529NM-W-0001");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("gradient section skipped")
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("INCOMPLETE sitemap without: gradient")
    );
    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(/memes=\d+, gradient=SKIPPED, meme-lab=\d+/u)
    );
  });

  it("resolves the failure policy from the supplied build environment", async () => {
    const responses = healthyFeedResponses();
    const failingGradient = { [FEED_URLS.gradient]: 99 };
    const options = (env: Record<string, string>) =>
      testOptions({ failurePolicy: undefined, env });

    await expect(
      buildAdditionalSitemapPaths(
        createFlakyFetchJson(responses, failingGradient).fetchJson,
        museumBundle,
        options({ GITHUB_ACTIONS: "true", VERSION: SOURCE_COMMIT })
      )
    ).rejects.toThrow("Sitemap gradient failed after 3 attempts");
    await expect(
      buildAdditionalSitemapPaths(
        createFlakyFetchJson(responses, failingGradient).fetchJson,
        museumBundle,
        options({ GITHUB_ACTIONS: "true" })
      )
    ).resolves.toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ loc: "/6529-gradient/0" }),
      ])
    );
  });

  it("treats a floor violation like an unavailable feed under the fallback policy", async () => {
    const minimumItems = { ...ZERO_FLOORS, memes: 5 };
    const warn = jest.fn();

    const paths = await buildAdditionalSitemapPaths(
      makeFetchJson(healthyFeedResponses()),
      museumBundle,
      testOptions({ minimumItems, failurePolicy: "fallback", warn })
    );

    expect(paths.map((path) => path.loc)).not.toContain("/the-memes/1");
    expect(paths.map((path) => path.loc)).toContain("/6529-gradient/0");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("memes inventory fell below its required floor")
    );
    await expect(
      buildAdditionalSitemapPaths(
        makeFetchJson(healthyFeedResponses()),
        museumBundle,
        testOptions({ minimumItems })
      )
    ).rejects.toThrow("Sitemap memes inventory fell below its required floor");
  });

  it("never fails a build because the optional profile feed is unavailable", async () => {
    const { fetchJson } = createFlakyFetchJson(healthyFeedResponses(), {
      [PROFILES_PAGE_1_URL]: 99,
    });
    const warn = jest.fn();

    const paths = await buildAdditionalSitemapPaths(
      fetchJson,
      museumBundle,
      testOptions({ failurePolicy: "fail", warn })
    );

    expect(paths.map((path) => path.loc)).toContain("/the-memes/1");
    expect(paths.map((path) => path.loc)).not.toContain("/punk6529");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("profiles section skipped")
    );
  });

  it("keeps the in-repo Museum publication a hard requirement under the fallback policy", async () => {
    await expect(
      buildAdditionalSitemapPaths(
        makeFetchJson(healthyFeedResponses()),
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
        testOptions({ failurePolicy: "fallback" })
      )
    ).rejects.toThrow("Museum sitemap publication unavailable");
  });
});

describe("next-sitemap profile pages", () => {
  const member = (
    detailViewKey: string,
    lastActivity?: number | null
  ): Record<string, unknown> => ({
    detail_view_key: detailViewKey,
    level: 50,
    ...(lastActivity === undefined ? {} : { last_activity: lastActivity }),
  });

  it("lists user-chosen handles and skips wallet-only and conflicting identities", async () => {
    const fetchJson = makeFetchJson({
      [PROFILES_PAGE_1_URL]: {
        data: [
          member("punk6529", 1791966707000),
          member("6529Museum", null),
          member("id-0x7c741ed01ee259feba4b7f9cac114f48bcafacf3"),
          member("0x7c741ed01ee259feba4b7f9cac114f48bcafacf3"),
          member("PUNK6529"),
          member("waves"),
          member("museum"),
          member("bad/handle"),
          member("has space"),
          member("a.html"),
          member("___"),
        ],
        next: false,
      },
    });

    const sample = await getProfileSample(fetchJson);

    expect(sample.sourceItems).toBe(11);
    expect(sample.paths).toEqual([
      {
        loc: "/punk6529",
        changefreq: "weekly",
        priority: 0.5,
        lastmod: "2026-10-14T08:31:47.000Z",
      },
      { loc: "/6529Museum", changefreq: "weekly", priority: 0.5 },
      { loc: "/___", changefreq: "weekly", priority: 0.5 },
    ]);
  });

  it("counts the members the feed returned, not the listed handles, against the floor", async () => {
    const walletOnly = Array.from({ length: 550 }, (_, index) =>
      member(`id-0x${index.toString(16).padStart(40, "0")}`)
    );
    const handles = Array.from({ length: 50 }, (_, index) =>
      member(`handle${index}`)
    );
    const warn = jest.fn();
    const log = jest.fn();

    const paths = await buildAdditionalSitemapPaths(
      makeFetchJson({
        ...healthyFeedResponses(),
        [PROFILES_PAGE_1_URL]: {
          data: [...walletOnly, ...handles],
          next: false,
        },
      }),
      museumBundle,
      testOptions({
        minimumItems: { ...ZERO_FLOORS, profiles: 500 },
        failurePolicy: "fallback",
        warn,
        log,
      })
    );

    const profileLocations = paths
      .map((path) => path.loc)
      .filter((loc) => loc.startsWith("/handle"));
    expect(profileLocations).toHaveLength(50);
    expect(warn).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("profiles: listing 50 of 600 top members")
    );
    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(/profiles=50(?:,|$)/u)
    );
  });

  it("still skips the optional profile section when the feed returns too few members", async () => {
    const warn = jest.fn();

    const paths = await buildAdditionalSitemapPaths(
      makeFetchJson(healthyFeedResponses()),
      museumBundle,
      testOptions({
        minimumItems: { ...ZERO_FLOORS, profiles: 500 },
        failurePolicy: "fail",
        warn,
      })
    );

    expect(paths.map((path) => path.loc)).not.toContain("/punk6529");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("profiles section skipped")
    );
  });

  it("requests the public level-ranked feed and stops at the page cap", async () => {
    const requested: string[] = [];
    const fetchJson = async (url: string): Promise<unknown> => {
      requested.push(url);
      const page = Number(new URL(url).searchParams.get("page"));
      return { data: [member(`member${page}`)], next: true };
    };

    const sample = await getProfileSample(fetchJson);

    expect(requested).toHaveLength(10);
    expect(requested[0]).toBe(PROFILES_PAGE_1_URL);
    expect(sample.sourceItems).toBe(10);
    expect(sample.paths.map((path) => path.loc)).toEqual(
      Array.from({ length: 10 }, (_, index) => `/member${index + 1}`)
    );
  });

  it("rejects garbled feed items", async () => {
    await expect(
      getProfileSample(
        makeFetchJson({
          [PROFILES_PAGE_1_URL]: { data: [{ level: 5 }], next: false },
        })
      )
    ).rejects.toThrow("Invalid profile sitemap item");
  });
});

describe("next-sitemap tool pages", () => {
  const LISTED_TOOL_PAGES = [
    "/tools",
    "/tools/api",
    "/tools/api/authentication",
    "/tools/block-finder",
    "/tools/time-zones",
    "/meme-accounting",
    "/meme-gas",
    "/open-data",
    "/open-data/network-metrics",
    "/open-data/6529bot",
    "/open-data/rememes",
    "/open-data/team",
    "/open-data/royalties",
  ] as const;

  // Reviewed tool routes that are intentionally not listed: wallet-gated,
  // subscription-gated, or noindex surfaces.
  const GATED_OR_NOINDEX_TOOL_PAGES = [
    "/tools/app-wallets",
    "/tools/agent-login",
    "/tools/subscriptions-report",
    "/open-data/meme-subscriptions",
    "/emma",
  ] as const;

  it("lists the stable public tool pages", () => {
    expect(STATIC_INDEXABLE_PATHS).toEqual(
      expect.arrayContaining([...LISTED_TOOL_PAGES])
    );
    for (const path of LISTED_TOOL_PAGES) {
      expect(shouldExcludeSitemapPath(path)).toBe(false);
    }
  });

  it("keeps gated and noindex tool pages out of the sitemap", () => {
    for (const path of GATED_OR_NOINDEX_TOOL_PAGES) {
      expect(STATIC_INDEXABLE_PATHS).not.toContain(path);
    }
  });

  it("requires a sitemap decision for every page in the tools registry", () => {
    const reviewed = new Set<string>([
      ...LISTED_TOOL_PAGES,
      ...GATED_OR_NOINDEX_TOOL_PAGES,
      // Safe Collecting tools are listed through their own route family.
      ...STATIC_INDEXABLE_PATHS.filter((path) =>
        path.startsWith("/safe-collecting")
      ),
    ]);
    const registeredHrefs = getVisibleToolsNavGroups({
      appWalletsSupported: true,
      hideSubscriptions: false,
    }).flatMap((group) => group.items.map((item) => item.href));

    expect(registeredHrefs.length).toBeGreaterThan(0);
    for (const href of registeredHrefs) {
      expect(reviewed.has(href)).toBe(true);
    }
  });

  it.each([
    "/tools",
    "/tools/block-finder",
    "/tools/api",
    "/meme-gas",
    "/open-data/team",
  ] as const)("gives %s utility-page sitemap metadata", async (path) => {
    await expect(
      sitemapConfig.transform!(sitemapConfig, path)
    ).resolves.toEqual({ loc: path, changefreq: "monthly", priority: 0.45 });
  });
});
