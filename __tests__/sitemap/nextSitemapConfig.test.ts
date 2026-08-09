import sitemapConfig, {
  buildAdditionalSitemapPaths,
  getNftSitemapPaths,
  getPublicWavePaths,
  MUSEUM_STATIC_CANONICAL_PATHS,
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

describe("next-sitemap config", () => {
  it("builds canonical NFT detail paths without wallet-specific focus URLs", () => {
    const paths = getNftSitemapPaths("/the-memes/1").map((path) => path.loc);

    expect(paths).toContain("/the-memes/1");
    expect(paths).toContain("/the-memes/1?focus=the-art");
    expect(paths).toContain("/the-memes/1?focus=collectors");
    expect(paths).not.toContain("/the-memes/1?focus=your-cards");
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

    const paths = await buildAdditionalSitemapPaths(fetchJson);
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
    expect(locations).toContain("/museum/network/organizations");
    expect(locations).not.toContain("/about/release-notes");
  });

  it("publishes fixed Research/About pages without inventing catalog entity instances", async () => {
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
        "https://api.6529.io/api/v2/waves?view=SEARCH&page=1&page_size=50&direct_message=false": {
          data: [],
          next: false,
        },
      })
    );
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
        "/museum/network/works/6529NM-W-0001",
        "/museum/network/projects/project-slug",
        "/museum/network/organizations/organization-slug",
        "/museum/network/acquisitions/acquisition-slug",
      ])
    );
    expect(
      museumLocations.some((path) =>
        /^\/museum\/network\/(artists|works|projects|organizations|acquisitions|acquisition-programs)\/[^/]+$/u.test(
          path
        )
      )
    ).toBe(false);
  });

  it("continues building sitemap paths when one API feed fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
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

    try {
      const paths = await buildAdditionalSitemapPaths(throwingFetchJson);
      const locations = paths.map((path) => path.loc);

      expect(locations).toContain("/the-memes/1");
      expect(locations).not.toContain("/6529-gradient/0");
      expect(consoleError).toHaveBeenCalledWith(
        "Sitemap generation failed for gradient:",
        expect.any(Error)
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("excludes app-only and restricted routes from generated sitemap output", () => {
    expect(shouldExcludeSitemapPath("/access")).toBe(true);
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
