import type { IConfig, ISitemapField } from "next-sitemap";

const SITE_URL = "https://6529.io";
const API_BASE_URL = "https://api.6529.io/api";
const API_SITEMAP_BASE_URL = "https://api.6529.io/sitemap";
const SITEMAP_PAGE_GUARD = 1_000;

const ABOUT_SECTIONS = [
  "the-memes",
  "memes-calendar",
  "meme-lab",
  "6529-gradient",
  "faq",
  "mission",
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

const INDEXABLE_NFT_FOCUS_VARIATIONS = [
  "live",
  "the-art",
  "collectors",
  "activity",
  "timeline",
] as const;

const NEXTGEN_COLLECTION_SUBPAGES = [
  "art",
  "mint",
  "distribution-plan",
  "trait-sets",
] as const;

const EXACT_EXCLUDED_PATHS = new Set([
  "/accept-connection-sharing",
  "/access",
  "/cdn-cgi/l/email-protection",
  "/error",
  "/messages",
  "/messages/create",
  "/nextgen/manager",
  "/notifications",
  "/open-mobile",
  "/restricted",
  "/sentry-example-page",
  "/tools/app-wallets",
  "/tools/app-wallets/import-wallet",
  "/waves/create",
]);

type SitemapPathOptions = {
  readonly changefreq: NonNullable<ISitemapField["changefreq"]>;
  readonly priority: number;
  readonly lastmod?: string | undefined;
};

type RouteOverride = Pick<SitemapPathOptions, "changefreq" | "priority">;

const ROUTE_OVERRIDES = new Map<string, RouteOverride>([
  ["/", { changefreq: "daily", priority: 1 }],
  ["/discover", { changefreq: "daily", priority: 0.9 }],
  ["/the-memes", { changefreq: "daily", priority: 0.9 }],
  ["/waves", { changefreq: "hourly", priority: 0.9 }],
  ["/network", { changefreq: "daily", priority: 0.85 }],
  ["/meme-lab", { changefreq: "daily", priority: 0.85 }],
  ["/6529-gradient", { changefreq: "weekly", priority: 0.8 }],
  ["/nextgen", { changefreq: "weekly", priority: 0.8 }],
  ["/museum", { changefreq: "monthly", priority: 0.75 }],
  ["/about/faq", { changefreq: "weekly", priority: 0.75 }],
  ["/about/the-memes", { changefreq: "weekly", priority: 0.7 }],
]);

type FetchJson = (url: string) => Promise<unknown>;

interface CursorPaginatedResponse<T> {
  readonly data: readonly T[];
  readonly next: string | null;
}

interface NumberedPaginatedResponse<T> {
  readonly data: readonly T[];
  readonly next: boolean;
}

interface PublicWave {
  readonly id: string;
  readonly created_at?: number | null;
  readonly last_drop_time?: number | null;
  readonly is_dm_wave?: boolean | null;
  readonly is_private?: boolean | null;
}

const defaultFetchJson: FetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Sitemap request failed: ${response.status} ${url}`);
  }
  return response.json();
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toLastmod = (timestamp: number | null | undefined): string | undefined =>
  typeof timestamp === "number" && Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString()
    : undefined;

const formatNameForUrl = (name: string): string =>
  encodeURIComponent(name.replaceAll(" ", "-").toLowerCase());

const apiSitemapUrl = (apiPath: string): string =>
  `${API_SITEMAP_BASE_URL}/${apiPath}`;

function assertCursorPaginatedResponse<T>(
  value: unknown,
  url: string
): asserts value is CursorPaginatedResponse<T> {
  if (
    !isRecord(value) ||
    !Array.isArray(value["data"]) ||
    !("next" in value) ||
    (typeof value["next"] !== "string" && value["next"] !== null)
  ) {
    throw new Error(`Unexpected sitemap response shape for ${url}`);
  }
}

function assertNumberedPaginatedResponse<T>(
  value: unknown,
  url: string
): asserts value is NumberedPaginatedResponse<T> {
  if (
    !isRecord(value) ||
    !Array.isArray(value["data"]) ||
    typeof value["next"] !== "boolean"
  ) {
    throw new Error(`Unexpected paginated API response shape for ${url}`);
  }
}

export async function fetchCursorPaginatedData<T>(
  url: string,
  fetchJson: FetchJson = defaultFetchJson
): Promise<T[]> {
  const results: T[] = [];
  let nextPage: string | null = url;
  let pages = 0;

  while (nextPage) {
    pages += 1;
    if (pages > SITEMAP_PAGE_GUARD) {
      throw new Error(
        `Sitemap pagination exceeded ${SITEMAP_PAGE_GUARD} pages`
      );
    }

    const response = await fetchJson(nextPage);
    assertCursorPaginatedResponse<T>(response, nextPage);
    results.push(...response.data);
    nextPage = response.next;
  }

  return results;
}

export async function fetchNumberedPaginatedData<T>(
  buildUrl: (page: number) => string,
  fetchJson: FetchJson = defaultFetchJson
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (true) {
    if (page > SITEMAP_PAGE_GUARD) {
      throw new Error(
        `Sitemap pagination exceeded ${SITEMAP_PAGE_GUARD} pages`
      );
    }

    const url = buildUrl(page);
    const response = await fetchJson(url);
    assertNumberedPaginatedResponse<T>(response, url);
    results.push(...response.data);

    if (!response.next) {
      return results;
    }

    page += 1;
  }
}

function createSitemapPath(
  loc: string,
  options: SitemapPathOptions
): ISitemapField {
  return {
    loc,
    changefreq: options.changefreq,
    priority: options.priority,
    ...(options.lastmod ? { lastmod: options.lastmod } : {}),
  };
}

export function getNftSitemapPaths(basePath: string): ISitemapField[] {
  return [
    createSitemapPath(basePath, { changefreq: "daily", priority: 0.8 }),
    ...INDEXABLE_NFT_FOCUS_VARIATIONS.map((focus) =>
      createSitemapPath(`${basePath}?focus=${focus}`, {
        changefreq: "daily",
        priority: 0.55,
      })
    ),
  ];
}

async function getNftCollectionPaths(
  sitePath: string,
  apiPath: string,
  fetchJson: FetchJson
): Promise<ISitemapField[]> {
  const ids = await fetchCursorPaginatedData<string>(
    apiSitemapUrl(apiPath),
    fetchJson
  );

  return ids.flatMap((id) => getNftSitemapPaths(`${sitePath}/${id}`));
}

async function getPlainApiSitemapPaths(
  sitePath: string,
  apiPath: string,
  fetchJson: FetchJson,
  priority = 0.7
): Promise<ISitemapField[]> {
  const ids = await fetchCursorPaginatedData<string | number>(
    apiSitemapUrl(apiPath),
    fetchJson
  );

  return ids.map((id) => {
    const encodedId = encodeURIComponent(String(id));
    return createSitemapPath(`/${sitePath}/${encodedId}`, {
      changefreq: "daily",
      priority,
    });
  });
}

export async function getNextgenCollectionPaths(
  fetchJson: FetchJson = defaultFetchJson
): Promise<ISitemapField[]> {
  const collectionNames = await fetchCursorPaginatedData<string>(
    apiSitemapUrl("nextgen/collections"),
    fetchJson
  );

  return collectionNames.flatMap((collectionName) => {
    const basePath = `/nextgen/collection/${formatNameForUrl(collectionName)}`;
    return [
      createSitemapPath(basePath, { changefreq: "weekly", priority: 0.75 }),
      ...NEXTGEN_COLLECTION_SUBPAGES.map((subpage) =>
        createSitemapPath(`${basePath}/${subpage}`, {
          changefreq: "weekly",
          priority: 0.65,
        })
      ),
    ];
  });
}

export async function getPublicWavePaths(
  fetchJson: FetchJson = defaultFetchJson
): Promise<ISitemapField[]> {
  const waves = await fetchNumberedPaginatedData<PublicWave>((page) => {
    const params = new URLSearchParams({
      view: "SEARCH",
      page: `${page}`,
      page_size: "50",
      direct_message: "false",
    });
    return `${API_BASE_URL}/v2/waves?${params.toString()}`;
  }, fetchJson);

  return waves
    .filter((wave) => wave.id && !wave.is_private && !wave.is_dm_wave)
    .map((wave) =>
      createSitemapPath(`/waves/${encodeURIComponent(wave.id)}`, {
        changefreq: "hourly",
        priority: 0.75,
        lastmod: toLastmod(wave.last_drop_time ?? wave.created_at),
      })
    );
}

function getAboutPaths(): ISitemapField[] {
  return ABOUT_SECTIONS.map((section) =>
    createSitemapPath(`/about/${section}`, {
      changefreq: section === "faq" ? "weekly" : "monthly",
      priority: section === "faq" ? 0.75 : 0.55,
    })
  );
}

function dedupeSitemapFields(paths: readonly ISitemapField[]): ISitemapField[] {
  const pathsByLocation = new Map<string, ISitemapField>();
  for (const path of paths) {
    if (!pathsByLocation.has(path.loc)) {
      pathsByLocation.set(path.loc, path);
      continue;
    }

    const existingPath = pathsByLocation.get(path.loc);
    if (
      existingPath &&
      (existingPath.changefreq !== path.changefreq ||
        existingPath.priority !== path.priority ||
        existingPath.lastmod !== path.lastmod)
    ) {
      console.warn(
        `dedupeSitemapFields discarded duplicate sitemap path with different metadata: ${path.loc}`
      );
    }
  }
  return Array.from(pathsByLocation.values());
}

function getSettledSitemapPaths(
  result: PromiseSettledResult<ISitemapField[]>,
  label: string
): ISitemapField[] {
  if (result.status === "fulfilled") {
    return result.value;
  }

  console.error(`Sitemap generation failed for ${label}:`, result.reason);
  return [];
}

export async function buildAdditionalSitemapPaths(
  fetchJson: FetchJson = defaultFetchJson
): Promise<ISitemapField[]> {
  const sitemapFeeds = [
    {
      label: "memes",
      promise: getNftCollectionPaths("/the-memes", "memes", fetchJson),
    },
    {
      label: "gradient",
      promise: getPlainApiSitemapPaths(
        "6529-gradient",
        "gradient",
        fetchJson,
        0.7
      ),
    },
    {
      label: "meme-lab",
      promise: getNftCollectionPaths("/meme-lab", "meme-lab", fetchJson),
    },
    {
      label: "nextgen-tokens",
      promise: getPlainApiSitemapPaths(
        "nextgen/token",
        "nextgen/tokens",
        fetchJson,
        0.7
      ),
    },
    {
      label: "nextgen-collections",
      promise: getNextgenCollectionPaths(fetchJson),
    },
    {
      label: "public-waves",
      promise: getPublicWavePaths(fetchJson),
    },
  ] as const;

  const settledFeeds = await Promise.allSettled(
    sitemapFeeds.map((feed) => feed.promise)
  );
  const pathGroups = settledFeeds.map((result, index) =>
    getSettledSitemapPaths(
      result,
      sitemapFeeds[index]?.label ?? `feed-${index}`
    )
  );

  const [
    memesPaths,
    gradientPaths,
    memeLabPaths,
    nextgenTokensPaths,
    nextgenCollectionPaths,
    publicWavePaths,
  ] = pathGroups;

  return dedupeSitemapFields([
    ...getAboutPaths(),
    ...(memesPaths ?? []),
    ...(gradientPaths ?? []),
    ...(memeLabPaths ?? []),
    ...(nextgenTokensPaths ?? []),
    ...(nextgenCollectionPaths ?? []),
    ...(publicWavePaths ?? []),
  ]);
}

export function shouldExcludeSitemapPath(path: string): boolean {
  const [pathname = path] = path.split(/[?#]/);
  return EXACT_EXCLUDED_PATHS.has(pathname);
}

function getRouteOverride(path: string): RouteOverride {
  const [pathname = path] = path.split(/[?#]/);
  const exactOverride = ROUTE_OVERRIDES.get(pathname);
  if (exactOverride) {
    return exactOverride;
  }

  if (pathname.startsWith("/about/")) {
    return { changefreq: "monthly", priority: 0.55 };
  }

  if (pathname.startsWith("/blog/") || pathname.startsWith("/news/")) {
    return { changefreq: "monthly", priority: 0.6 };
  }

  if (pathname.startsWith("/museum/")) {
    return { changefreq: "monthly", priority: 0.6 };
  }

  if (pathname.startsWith("/tools/")) {
    return { changefreq: "monthly", priority: 0.45 };
  }

  return { changefreq: "weekly", priority: 0.65 };
}

const config: IConfig = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  sitemapSize: 50_000,
  changefreq: "weekly",
  priority: 0.65,
  exclude: Array.from(EXACT_EXCLUDED_PATHS),
  additionalPaths: async () => buildAdditionalSitemapPaths(),
  transform: async (_config, path): Promise<ISitemapField | undefined> => {
    if (shouldExcludeSitemapPath(path)) {
      return undefined;
    }

    const override = getRouteOverride(path);
    return {
      loc: path,
      changefreq: override.changefreq,
      priority: override.priority,
    };
  },
};

export default config;
