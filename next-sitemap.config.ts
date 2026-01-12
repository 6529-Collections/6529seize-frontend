import type { IConfig, ISitemapField } from "next-sitemap";

// Constants
const ABOUT_SECTIONS = [
  "the-memes",
  "memes-calendar",
  "meme-lab",
  "6529-gradient",
  "faq",
  "mission",
  "release-notes",
  "contact-us",
  "terms-of-service",
  "privacy-policy",
  "cookie-policy",
  "license",
  "minting",
  "apply",
  "data-decentralization",
  "gdrc1",
  "nft-delegation",
  "primary-address",
  "ens",
  "subscriptions",
  "nakamoto-threshold",
  "copyright",
] as const;

const QUERY_VARIATIONS = [
  "live",
  "your-cards",
  "the-art",
  "collectors",
  "activity",
  "timeline",
] as const;

// Interfaces
interface PaginatedResponse<T> {
  data: T[];
  next: string | null;
}

interface SitemapPath {
  loc: string;
  changefreq:
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "always"
    | "hourly"
    | "never";
  priority: number;
}

// Helper functions
async function fetchPaginatedData<T>(url: string): Promise<T[]> {
  let results: T[] = [];
  let nextPage: string | null = url;

  while (nextPage) {
    const response = await fetch(nextPage);
    try {
      const result: PaginatedResponse<T> = await response.json();
      results = [...results, ...result.data];
      nextPage = result.next;
    } catch (error) {
      console.error(`error for ${nextPage}`);
      throw error;
    }
  }

  return results;
}

function getNftVariations(basePath: string): SitemapPath[] {
  return [
    { loc: basePath, changefreq: "daily", priority: 0.7 },
    ...QUERY_VARIATIONS.map((focus) => ({
      loc: `${basePath}?focus=${focus}`,
      changefreq: "daily" as const,
      priority: 0.7,
    })),
  ];
}

async function getVariationsPaths(
  sitePath: string,
  apiPath: string
): Promise<SitemapPath[]> {
  const ids = await fetchPaginatedData<string>(
    `https://api.6529.io/sitemap/${apiPath}`
  );
  return ids.flatMap((id) => {
    const basePath = `${sitePath}/${id}`;
    return getNftVariations(basePath);
  });
}

async function getPlainPaths(
  sitePath: string,
  apiPath: string
): Promise<SitemapPath[]> {
  const ids = await fetchPaginatedData<string>(
    `https://api.6529.io/sitemap/${apiPath}`
  );
  return ids.map((id) => ({
    loc: `/${sitePath}/${id}`,
    changefreq: "daily" as const,
    priority: 0.7,
  }));
}

// Config
const config: IConfig = {
  siteUrl: "https://6529.io",
  generateRobotsTxt: true,
  changefreq: "daily",
  exclude: ["/access", "/restricted", "/nextgen/manager"],
  additionalPaths: async () => {
    const aboutPaths: SitemapPath[] = ABOUT_SECTIONS.map((section) => ({
      loc: `/about/${section}`,
      changefreq: "daily",
      priority: 0.7,
    }));

    const [memesPaths, gradientPaths, memeLabPaths, nextgenTokensPaths] =
      await Promise.all([
        getVariationsPaths("/the-memes", "memes"),
        getPlainPaths("6529-gradient", "gradient"),
        getVariationsPaths("/meme-lab", "meme-lab"),
        getPlainPaths("nextgen/token", "nextgen/tokens"),
      ]);

    return [
      ...aboutPaths,
      ...memesPaths,
      ...gradientPaths,
      ...memeLabPaths,
      ...nextgenTokensPaths,
    ];
  },
  transform: async (_config, path): Promise<ISitemapField> => {
    return {
      loc: path,
      changefreq: "daily",
      priority: path === "/" ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
    };
  },
};

export default config;
