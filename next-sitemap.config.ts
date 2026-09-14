import type { IConfig, ISitemapField } from "next-sitemap";
import {
  getNftSitemapFocuses,
  type NftCollectionRoute,
} from "@/helpers/seo/nft-route-policy";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import type {
  MuseumPublicationLoadState,
  MuseumPublicEntityRecord,
} from "@/lib/museum/publication/types";

const SITE_URL = "https://6529.io";
const API_BASE_URL = "https://api.6529.io/api";
const API_SITEMAP_BASE_URL = "https://api.6529.io/sitemap";
const SITEMAP_PAGE_GUARD = 1_000;
const SITEMAP_REQUEST_TIMEOUT_MS = 15_000;

export const STATIC_INDEXABLE_PATHS = [
  "/",
  "/discover",
  "/the-memes",
  "/meme-lab",
  "/6529-gradient",
  "/nextgen",
  "/waves",
  "/education",
  "/education/tweetstorms",
  "/education/podcasts",
  "/education/education-collaboration-form",
  "/join-6529",
  "/network",
  "/network/tdh",
  "/network/xtdh",
  "/about",
  "/about/6529-apps",
  "/museum",
  "/blog/from-fibonacci-to-fidenza",
  "/blog/disney-deekay-their-secret-to-animation",
  "/blog/a-tale-of-two-artists",
  "/news/introducing-om",
] as const;

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

const NEXTGEN_COLLECTION_SUBPAGES = [
  "art",
  "distribution-plan",
  "trait-sets",
] as const;

const EXACT_EXCLUDED_PATHS = new Set([
  "/accept-connection-sharing",
  "/access",
  "/artwork-documentation",
  "/buidl",
  "/cdn-cgi/l/email-protection",
  "/content-preferences",
  "/error",
  "/messages",
  "/messages/create",
  "/nextgen/manager",
  "/notifications",
  "/open-mobile",
  "/preferences",
  "/restricted",
  "/stream",
  "/sentry-example-page",
  "/tools/app-wallets",
  "/tools/app-wallets/import-wallet",
  "/waves/create",
]);

const PREFIX_EXCLUDED_PATHS = [
  "/reviews/",
  "/artwork-documentation/",
  "/messages/",
  "/notifications/",
  "/auth/",
  "/setup/",
  "/builders/",
  "/managers/",
] as const;
const LEGACY_MUSEUM_PREFIXES = [
  "/museum/network/accessions",
  "/museum/network/collection/",
  "/museum/network/collections",
  "/museum/network/gifts",
  "/museum/network/methodology",
  "/museum/network/objects",
  "/museum/network/programs",
  "/museum/network/stories",
  "/museum/network/governance",
  "/museum/network/rights",
] as const;

const MUSEUM_FIXED_DATA_ARCHITECTURE_PATHS = [
  "spectrum",
  "cidoc-crm",
  "lido",
  "premis",
  "prov-o",
  "getty-aat-ulan",
  "iiif",
  "c2pa",
  "bagit",
  "ocfl",
  "caip-19",
] as const;

export const MUSEUM_STATIC_CANONICAL_PATHS = [
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
  ...MUSEUM_FIXED_DATA_ARCHITECTURE_PATHS.map(
    (slug) => `/museum/network/research/data-architecture/${slug}`
  ),
  "/museum/network/research/data-architecture/casey-reas-implementation",
  "/museum/network/research/rights",
  "/museum/network/research/rights/artists",
  "/museum/network/research/rights/collectors",
  "/museum/network/about/governance",
] as const;

const STATIC_PATH_SET = new Set<string>([
  ...STATIC_INDEXABLE_PATHS,
  ...ABOUT_SECTIONS.map((section) => `/about/${section}`),
  ...MUSEUM_STATIC_CANONICAL_PATHS,
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
type MuseumBundleLoader = typeof getMuseumPublicationBundle;
type SitemapBuildOptions = {
  readonly minimumItems?: Partial<Record<SitemapFeedName, number>>;
};
type SitemapFeedName =
  | "memes"
  | "meme-lab"
  | "gradient"
  | "nextgen-tokens"
  | "nextgen-collections"
  | "public-waves";
const MINIMUM_SOURCE_ITEMS: Readonly<Record<SitemapFeedName, number>> = {
  memes: 500,
  "meme-lab": 60,
  gradient: 100,
  "nextgen-tokens": 900,
  "nextgen-collections": 1,
  "public-waves": 800,
};

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
  readonly is_dm_wave: boolean;
  readonly is_private: boolean;
}

const defaultFetchJson: FetchJson = async (url) => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(SITEMAP_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Sitemap request failed: ${response.status} ${url}`);
  }
  return response.json();
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isBoundedString = (value: unknown, max = 200): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

const toLastmod = (timestamp: number | null | undefined): string | undefined =>
  typeof timestamp === "number" && Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString()
    : undefined;

const formatNameForUrl = (name: string): string =>
  encodeURIComponent(name.replaceAll(" ", "-").toLowerCase());

const apiSitemapUrl = (apiPath: string): string =>
  `${API_SITEMAP_BASE_URL}/${apiPath}`;

function withTimeout<T>(promise: Promise<T>, url: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const expiration = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`Sitemap request timed out: ${url}`)),
      SITEMAP_REQUEST_TIMEOUT_MS
    );
  });
  return Promise.race([promise, expiration]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

function assertCursorContinuation(
  next: string,
  expectedPathname: string
): void {
  let parsed: URL;
  try {
    parsed = new URL(next);
  } catch {
    throw new Error(`Invalid sitemap continuation URL: ${next}`);
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.origin !== "https://api.6529.io" ||
    parsed.pathname !== expectedPathname
  ) {
    throw new Error(`Unexpected sitemap continuation URL: ${next}`);
  }
}

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
  const visited = new Set<string>();
  const expectedPathname = new URL(url).pathname;

  while (nextPage) {
    pages += 1;
    if (pages > SITEMAP_PAGE_GUARD) {
      throw new Error(
        `Sitemap pagination exceeded ${SITEMAP_PAGE_GUARD} pages`
      );
    }

    if (visited.has(nextPage)) {
      throw new Error(`Sitemap pagination cycle detected: ${nextPage}`);
    }
    visited.add(nextPage);

    const response: unknown = await withTimeout(fetchJson(nextPage), nextPage);
    assertCursorPaginatedResponse<T>(response, nextPage);
    results.push(...response.data);
    if (response.next !== null) {
      assertCursorContinuation(response.next, expectedPathname);
    }
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
    const response = await withTimeout(fetchJson(url), url);
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

export function getNftSitemapPaths(
  basePath: string,
  collection: NftCollectionRoute = "the-memes"
): ISitemapField[] {
  return [
    createSitemapPath(basePath, { changefreq: "daily", priority: 0.8 }),
    ...getNftSitemapFocuses(collection).map((focus) =>
      createSitemapPath(`${basePath}?focus=${focus}`, {
        changefreq: "daily",
        priority: 0.55,
      })
    ),
  ];
}

async function getNftCollectionPaths(
  sitePath: NftCollectionRoute,
  apiPath: string,
  fetchJson: FetchJson
): Promise<ISitemapField[]> {
  const ids = await fetchCursorPaginatedData<unknown>(
    apiSitemapUrl(apiPath),
    fetchJson
  );

  return ids.flatMap((id) => {
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 1) {
      throw new Error(`Invalid ${apiPath} sitemap item`);
    }
    return getNftSitemapPaths(`${sitePath}/${id}`, sitePath);
  });
}

async function getPlainApiSitemapPaths(
  sitePath: string,
  apiPath: string,
  fetchJson: FetchJson,
  priority = 0.7
): Promise<ISitemapField[]> {
  const ids = await fetchCursorPaginatedData<unknown>(
    apiSitemapUrl(apiPath),
    fetchJson
  );

  return ids.map((id) => {
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 0) {
      throw new Error(`Invalid ${apiPath} sitemap item`);
    }
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
  const collectionNames = await fetchCursorPaginatedData<unknown>(
    apiSitemapUrl("nextgen/collections"),
    fetchJson
  );

  return collectionNames.flatMap((collectionName) => {
    if (!isBoundedString(collectionName, 160)) {
      throw new Error("Invalid nextgen collection sitemap item");
    }
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

  return waves.flatMap((wave) => {
    if (
      !isRecord(wave) ||
      !isBoundedString(wave.id) ||
      typeof wave.is_private !== "boolean" ||
      typeof wave.is_dm_wave !== "boolean"
    ) {
      throw new Error("Invalid public wave sitemap item");
    }
    const publicWave = wave as PublicWave;
    return publicWave.is_private || publicWave.is_dm_wave
      ? []
      : [
          createSitemapPath(`/waves/${encodeURIComponent(publicWave.id)}`, {
            changefreq: "hourly",
            priority: 0.75,
            lastmod: toLastmod(
              publicWave.last_drop_time ?? publicWave.created_at
            ),
          }),
        ];
  });
}

function getAboutPaths(): ISitemapField[] {
  return ABOUT_SECTIONS.map((section) =>
    createSitemapPath(`/about/${section}`, {
      changefreq: section === "faq" ? "weekly" : "monthly",
      priority: section === "faq" ? 0.75 : 0.55,
    })
  );
}

function getMuseumCanonicalPaths(): ISitemapField[] {
  return MUSEUM_STATIC_CANONICAL_PATHS.map((path) =>
    createSitemapPath(path, { changefreq: "monthly", priority: 0.6 })
  );
}

function getStrategicStaticPaths(): ISitemapField[] {
  return STATIC_INDEXABLE_PATHS.map((loc) =>
    createSitemapPath(loc, getRouteOverride(loc))
  );
}

function assertSourceFloor(
  name: SitemapFeedName,
  emittedCount: number,
  multiplier: number,
  options: SitemapBuildOptions
): void {
  const minimum = options.minimumItems?.[name] ?? MINIMUM_SOURCE_ITEMS[name];
  if (emittedCount / multiplier < minimum) {
    throw new Error(`Sitemap ${name} inventory fell below its required floor`);
  }
}

export function validateSitemapFields(
  paths: readonly ISitemapField[]
): ISitemapField[] {
  const pathsByLocation = new Map<string, ISitemapField>();
  for (const path of paths) {
    const url = new URL(path.loc, SITE_URL);
    if (
      url.origin !== SITE_URL ||
      url.hash ||
      shouldExcludeSitemapPath(`${url.pathname}${url.search}`)
    ) {
      throw new Error(`Invalid sitemap location: ${path.loc}`);
    }
    for (const key of url.searchParams.keys()) {
      if (
        key !== "focus" ||
        !["activity", "collectors", "timeline", "references"].includes(
          url.searchParams.get(key) ?? ""
        )
      ) {
        throw new Error(`Unreviewed sitemap query parameter: ${path.loc}`);
      }
    }
    const normalized = `${url.pathname}${url.search}`;
    if (!pathsByLocation.has(normalized)) {
      pathsByLocation.set(normalized, { ...path, loc: normalized });
      continue;
    }

    const existingPath = pathsByLocation.get(normalized);
    if (
      existingPath &&
      (existingPath.changefreq !== path.changefreq ||
        existingPath.priority !== path.priority ||
        existingPath.lastmod !== path.lastmod)
    ) {
      throw new Error(
        `Duplicate sitemap location with conflicting metadata: ${normalized}`
      );
    }
  }
  return Array.from(pathsByLocation.values());
}

function getMuseumEntityPaths(
  state: MuseumPublicationLoadState
): ISitemapField[] {
  if (state.status === "unavailable") {
    throw new Error(
      `Museum sitemap publication unavailable: ${state.errorCode}`
    );
  }
  const graph = state.publication.entityGraph;
  if (graph === undefined) {
    throw new Error(
      "Museum sitemap requires an accepted publication entity graph"
    );
  }
  return graph.entities.flatMap((entity: MuseumPublicEntityRecord) => {
    if (
      entity.entityStatus !== "published" ||
      entity.pageExposure !== "canonical_page" ||
      !entity.canonicalRoute
    ) {
      return [];
    }

    let canonicalRoute: string | null = null;
    if (
      entity.entityType === "WORK" &&
      /^6529NM-W-[0-9]{4}$/u.test(entity.id)
    ) {
      canonicalRoute = `/museum/network/works/${entity.id}`;
    } else if (entity.entityType === "ARTIST" && entity.slug) {
      canonicalRoute = `/museum/network/artists/${entity.slug}`;
    }

    if (canonicalRoute === null || entity.canonicalRoute !== canonicalRoute) {
      return [];
    }

    return [
      createSitemapPath(canonicalRoute, {
        changefreq: "monthly",
        priority: 0.6,
      }),
    ];
  });
}

export async function buildAdditionalSitemapPaths(
  fetchJson: FetchJson = defaultFetchJson,
  getMuseumBundle: MuseumBundleLoader = getMuseumPublicationBundle,
  options: SitemapBuildOptions = {}
): Promise<ISitemapField[]> {
  const [
    memesPaths,
    gradientPaths,
    memeLabPaths,
    nextgenTokensPaths,
    nextgenCollectionPaths,
    publicWavePaths,
    museumBundle,
  ] = await Promise.all([
    getNftCollectionPaths("the-memes", "memes", fetchJson),
    getPlainApiSitemapPaths("6529-gradient", "gradient", fetchJson, 0.7),
    getNftCollectionPaths("meme-lab", "meme-lab", fetchJson),
    getPlainApiSitemapPaths("nextgen/token", "nextgen/tokens", fetchJson, 0.7),
    getNextgenCollectionPaths(fetchJson),
    getPublicWavePaths(fetchJson),
    getMuseumBundle(),
  ]);
  assertSourceFloor(
    "memes",
    memesPaths.length,
    1 + getNftSitemapFocuses("the-memes").length,
    options
  );
  assertSourceFloor(
    "meme-lab",
    memeLabPaths.length,
    1 + getNftSitemapFocuses("meme-lab").length,
    options
  );
  assertSourceFloor("gradient", gradientPaths.length, 1, options);
  assertSourceFloor("nextgen-tokens", nextgenTokensPaths.length, 1, options);
  assertSourceFloor(
    "nextgen-collections",
    nextgenCollectionPaths.length,
    1 + NEXTGEN_COLLECTION_SUBPAGES.length,
    options
  );
  assertSourceFloor("public-waves", publicWavePaths.length, 1, options);

  return validateSitemapFields([
    ...getStrategicStaticPaths(),
    ...getAboutPaths(),
    ...getMuseumCanonicalPaths(),
    ...getMuseumEntityPaths(museumBundle.publicationState),
    ...memesPaths,
    ...gradientPaths,
    ...memeLabPaths,
    ...nextgenTokensPaths,
    ...nextgenCollectionPaths,
    ...publicWavePaths,
  ]);
}

export function shouldExcludeSitemapPath(path: string): boolean {
  const [pathname = path] = path.split(/[?#]/);
  return (
    EXACT_EXCLUDED_PATHS.has(pathname) ||
    PREFIX_EXCLUDED_PATHS.some((prefix) => pathname.startsWith(prefix)) ||
    LEGACY_MUSEUM_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    /^\/(?!about\/)[^/]+\/(subscriptions|brain|cms(?:\/|$)|builder(?:\/|$))/u.test(
      pathname
    )
  );
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

// Appended to the generated robots.txt so crawlers and agent frameworks that
// only read robots.txt can discover the agent-readable files. /llms.txt is the
// canonical entry point; these lines are comments, not directives.
export const AGENT_DISCOVERY_ROBOTS_BLOCK = [
  "# Agent-readable files (start at /llms.txt)",
  `# llms.txt: ${SITE_URL}/llms.txt`,
  `# glossary.json: ${SITE_URL}/glossary.json`,
  `# help-index.json: ${SITE_URL}/help-index.json`,
].join("\n");

export function appendAgentDiscoveryBlock(robotsTxt: string): string {
  return `${robotsTxt.trimEnd()}\n\n${AGENT_DISCOVERY_ROBOTS_BLOCK}\n`;
}

const config: IConfig = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  robotsTxtOptions: {
    transformRobotsTxt: async (_config, robotsTxt) =>
      appendAgentDiscoveryBlock(robotsTxt),
  },
  sitemapSize: 50_000,
  changefreq: "weekly",
  priority: 0.65,
  exclude: [
    ...EXACT_EXCLUDED_PATHS,
    "/reviews/*",
    ...LEGACY_MUSEUM_PREFIXES.map((prefix) => `${prefix}*`),
  ],
  additionalPaths: async () => buildAdditionalSitemapPaths(),
  transform: async (_config, path): Promise<ISitemapField | undefined> => {
    const pathname = path.split(/[?#]/)[0] ?? path;
    if (shouldExcludeSitemapPath(path) || !STATIC_PATH_SET.has(pathname)) {
      return undefined;
    }

    const override = getRouteOverride(path);
    return {
      loc: pathname,
      changefreq: override.changefreq,
      priority: override.priority,
    };
  },
};

export default config;
