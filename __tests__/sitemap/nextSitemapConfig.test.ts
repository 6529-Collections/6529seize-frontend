import sitemapConfig, {
  buildAdditionalSitemapPaths,
  fetchCursorPaginatedData,
  getNftSitemapPaths,
  getPublicWavePaths,
  MUSEUM_STATIC_CANONICAL_PATHS,
  STATIC_INDEXABLE_PATHS,
  shouldExcludeSitemapPath,
} from "@/next-sitemap.config";

const makeFetchJson =
  (responses: Record<string, unknown>) =>
  async (url: string): Promise<unknown> => {
    const response = responses[url];
    if (response === undefined) {
      throw new Error(`Unexpected URL: ${url}`);
    }
    return response;
  };

const museumBundle = async () =>
  ({
    publicationState: {
      status: "current",
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
      publication: {
        entityGraph: {
          entities: [
            {
              id: "6529NM-W-0001",
              entityType: "WORK",
              entityStatus: "published",
              pageExposure: "canonical_page",
              canonicalRoute: "/museum/network/works/6529NM-W-0001",
              slug: null,
            },
            {
              id: "6529NM-ART-0001",
              entityType: "ARTIST",
              entityStatus: "published",
              pageExposure: "canonical_page",
              canonicalRoute: "/museum/network/artists/artist-slug",
              slug: "artist-slug",
            },
            {
              id: "6529NM-PROJ-0001",
              entityType: "PROJECT_OR_SERIES",
              entityStatus: "published",
              pageExposure: "canonical_page",
              canonicalRoute: "/museum/network/projects/project-slug",
              slug: "project-slug",
            },
          ],
        },
      },
    },
    view: null,
  }) as never;

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

  it("publishes fixed Museum pages and only governed work and artist entities", async () => {
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

    expect(museumLocations).toEqual(
      expect.arrayContaining(expectedStaticPaths)
    );
    expect(museumLocations).not.toEqual(
      expect.arrayContaining([
        "/museum/network/research/institutional-practice/met",
        "/museum/network/research/data-architecture/unknown-standard",
        "/museum/network/about/governance/6529NM-GOV-1052148",
        "/museum/network/artists/artist-slug",
        "/museum/network/projects/project-slug",
        "/museum/network/organizations/organization-slug",
        "/museum/network/acquisitions/acquisition-slug",
      ])
    );
    expect(museumLocations).toContain("/museum/network/works/6529NM-W-0001");
    expect(museumLocations).toContain("/museum/network/artists/artist-slug");
    expect(museumLocations).not.toContain(
      "/museum/network/projects/project-slug"
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
