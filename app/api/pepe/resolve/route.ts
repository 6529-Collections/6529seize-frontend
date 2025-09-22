import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";

import LruTtlCache from "@/lib/cache/lruTtl";

const TOKENSCAN_BASE = "https://tokenscan.io/api";

export type PepeKind = "asset" | "collection" | "artist" | "set";

type Market = {
  bestAskSats?: number;
  lastSaleSats?: number;
  bestAskXcp?: number;
  lastSaleXcp?: number;
  approxEthPerBtc?: number;
  approxEthPerXcp?: number;
  updatedISO?: string;
};

type BasePreview = {
  readonly kind: PepeKind;
  readonly href: string;
  readonly slug: string;
};

type AssetPreview = BasePreview & {
  readonly kind: "asset";
  readonly asset?: string;
  readonly name?: string;
  readonly collection?: string;
  readonly artist?: string;
  readonly series?: number | null;
  readonly card?: number | null;
  readonly supply?: number | null;
  readonly holders?: number | null;
  readonly image?: string | null;
  readonly links?: {
    readonly horizon?: string;
    readonly xchain?: string;
    readonly wiki?: string;
  } | null;
  readonly market?: Market | null;
};

type CollectionPreview = BasePreview & {
  readonly kind: "collection";
  readonly name?: string;
  readonly image?: string | null;
  readonly stats?: {
    readonly items?: number | null;
    readonly floorSats?: number | null;
  } | null;
};

type ArtistPreview = BasePreview & {
  readonly kind: "artist";
  readonly name?: string;
  readonly image?: string | null;
  readonly stats?: {
    readonly uniqueCards?: number | null;
    readonly collections?: string[] | null;
  } | null;
};

type SetPreview = BasePreview & {
  readonly kind: "set";
  readonly name?: string;
  readonly image?: string | null;
  readonly stats?: {
    readonly items?: number | null;
    readonly fullSetFloorSats?: number | null;
    readonly lastSaleValuationSats?: number | null;
  } | null;
  readonly links?: {
    readonly wiki?: string;
  } | null;
};

type Preview = AssetPreview | CollectionPreview | ArtistPreview | SetPreview;

const readNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const ttlMinutes = readNumber(process.env.PEPE_CACHE_TTL_MINUTES, 10);
const cacheMaxItems = readNumber(process.env.PEPE_CACHE_MAX_ITEMS, 500);
const cache = new LruTtlCache<string, Preview>({
  max: cacheMaxItems,
  ttlMs: ttlMinutes * 60 * 1000,
});

const trimSlashes = (s: string): string => {
  let start = 0;
  let end = s.length;

  // '/' === charCode 47
  while (start < end && s.codePointAt(start) === 47) start++;
  while (end > start && s.codePointAt(end - 1) === 47) end--;

  return s.slice(start, end);
};

const USER_AGENT =
  "6529seize-pepe-card/1.0 (+https://6529.io; fetching pepe.wtf previews)";
const IPFS_GATEWAY = trimSlashes(
  process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs/"
);

function isCounterpartyAssetCode(value: string): boolean {
  const upper = value.toUpperCase();
  return /^[A-Z0-9]{3,}$/.test(upper) || /^A\d{6,}$/.test(upper);
}

type FetchOptions = RequestInit & { timeoutMs?: number };

async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response | null> {
  const { timeoutMs = 4000, ...rest } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        ...rest.headers,
      },
    });
    return response;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(
  url: string,
  timeoutMs = 4000
): Promise<string | null> {
  const response = await fetchWithTimeout(url, {
    timeoutMs,
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response?.ok) {
    return null;
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

async function fetchJson<T>(url: string, timeoutMs = 4000): Promise<T | null> {
  const response = await fetchWithTimeout(url, {
    timeoutMs,
    headers: { accept: "application/json" },
  });

  if (!response?.ok) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function ipfsToHttp(url: string): string {
  // Early exit for non-ipfs URLs
  if (!/^ipfs:\/\//i.test(url)) return url;

  // Drop the scheme
  const rest = url.slice(7); // after "ipfs://"
  // Handle optional "ipfs/" prefix
  const path = rest.toLowerCase().startsWith("ipfs/") ? rest.slice(5) : rest;

  // Normalize leading slashes without regex backtracking
  let clean = path;
  while (clean.startsWith("/")) clean = clean.slice(1);

  return `${IPFS_GATEWAY}/${clean}`;
}

function absolutizeRelativeUrl(candidate: string, base: string): string {
  try {
    return new URL(candidate, base).toString();
  } catch {
    return candidate;
  }
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replaceAll("&", "and")
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .trim()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-");
}

function deepFindAll(
  value: unknown,
  keys: string[],
  results: unknown[] = []
): unknown[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      deepFindAll(item, keys, results);
    }
    return results;
  }

  if (!value || typeof value !== "object") {
    return results;
  }

  for (const [key, val] of Object.entries(value)) {
    if (keys.includes(key)) {
      results.push(val);
    }
    if (val && typeof val === "object") {
      deepFindAll(val, keys, results);
    }
  }

  return results;
}

// JSON value type for parsed Next.js __NEXT_DATA__
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

async function scrapeNextData(url: string): Promise<Json> {
  const html = await fetchText(url, 5000);
  if (!html) {
    return null;
  }

  const $ = cheerio.load(html);
  const raw = $("script#__NEXT_DATA__").first().text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Json;
  } catch {
    return null;
  }
}

function parseMaybeNumber(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function extractFirstString(values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
}

type ScrapedAsset = {
  asset?: string;
  name?: string;
  artist?: string;
  collection?: string;
  image?: string | null;
  series?: number | null;
  card?: number | null;
};

async function tryExtractImageFromDescription(
  description: string,
  pageUrl: string
): Promise<string | null> {
  const urls = Array.from(
    new Set(description.match(/https?:\/\/[^\s"'<>]+/g) ?? [])
  );
  for (const rawUrl of urls) {
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("ipfs://")) {
      return ipfsToHttp(trimmed);
    }

    if (/\.(json|js)(?:\?.*)?$/i.test(trimmed) || /json/i.test(trimmed)) {
      const metadata = await fetchJson<Record<string, unknown>>(trimmed, 2500);
      if (metadata) {
        const candidate = extractFirstString(
          [
            metadata.image,
            metadata.image_url,
            metadata.imageUrl,
            metadata.imageLarge,
            metadata.card_image,
            metadata.thumb,
            metadata.thumbnail,
            metadata.large_image,
          ].filter((value) => typeof value === "string") as string[]
        );

        if (candidate) {
          const normalized = candidate.startsWith("ipfs://")
            ? ipfsToHttp(candidate)
            : absolutizeRelativeUrl(candidate, trimmed);
          return normalized;
        }
      }
    }

    if (/\.(?:png|jpe?g|gif|webp|avif|svg)(?:\?.*)?$/i.test(trimmed)) {
      return absolutizeRelativeUrl(trimmed, pageUrl);
    }
  }

  if (/ipfs:\/\//i.test(description)) {
    const ipfsMatch = description.match(/ipfs:\/\/[^\s"'<>]+/i);
    if (ipfsMatch) {
      return ipfsToHttp(ipfsMatch[0]);
    }
  }

  return null;
}

async function scrapePepeAssetPage(slug: string): Promise<ScrapedAsset> {
  const href = `https://pepe.wtf/asset/${encodeURIComponent(slug)}`;
  const nextData = await scrapeNextData(href);
  const scraped: ScrapedAsset = {};

  if (nextData) {
    const names = deepFindAll(nextData, ["name", "title"]);
    const artists = deepFindAll(nextData, ["artist", "creator"]);
    const collections = deepFindAll(nextData, ["collection", "family"]);
    const images = deepFindAll(nextData, [
      "image",
      "thumbnail_url",
      "imageUrl",
      "imageURL",
    ]);
    const descriptions = deepFindAll(nextData, ["description", "body"]);
    const assetCandidates = deepFindAll(nextData, [
      "asset",
      "assetName",
      "token_name",
      "symbol",
      "token",
    ])
      .map((value) => (typeof value === "string" ? value : null))
      .filter(Boolean) as string[];

    scraped.name = extractFirstString(names) ?? undefined;
    scraped.artist = extractFirstString(artists) ?? undefined;
    scraped.collection = extractFirstString(collections) ?? undefined;
    scraped.image = extractFirstString(images) ?? null;

    const assetCode = assetCandidates.find((candidate) =>
      isCounterpartyAssetCode(candidate)
    );
    if (assetCode) {
      scraped.asset = assetCode.toUpperCase();
    }

    const description = extractFirstString(descriptions);
    if (description) {
      const enriched = await tryExtractImageFromDescription(description, href);
      if (enriched && !scraped.image) {
        scraped.image = enriched;
      }
    }

    const seriesValues = deepFindAll(nextData, [
      "series",
      "seriesNumber",
      "series_number",
    ]);
    const cardValues = deepFindAll(nextData, [
      "card",
      "cardNumber",
      "card_number",
    ]);
    const seriesCandidate =
      parseMaybeNumber(extractFirstString(seriesValues)) ??
      parseMaybeNumber(seriesValues[0]) ??
      null;
    const cardCandidate =
      parseMaybeNumber(extractFirstString(cardValues)) ??
      parseMaybeNumber(cardValues[0]) ??
      null;
    scraped.series = seriesCandidate;
    scraped.card = cardCandidate;
  }

  if (!scraped.asset) {
    const normalized = slug.replaceAll("-", "").toUpperCase();
    if (isCounterpartyAssetCode(normalized)) {
      scraped.asset = normalized;
    }
  }

  return scraped;
}

async function tokenscanJson<T>(path: string): Promise<T | null> {
  return fetchJson<T>(`${TOKENSCAN_BASE}${path}`, 5000);
}

async function getApproxRates(): Promise<{
  ethPerBtc: number;
  ethPerXcp: number;
}> {
  const response = await fetchJson<any>(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,counterparty,ethereum&vs_currencies=eth",
    4000
  );

  const ethPerBtc = Number(response?.bitcoin?.eth ?? 0) || 0;
  const ethPerXcp = Number(response?.counterparty?.eth ?? 0) || 0;
  return { ethPerBtc, ethPerXcp };
}

async function probeWikiUrl(url: string): Promise<string | null> {
  const response = await fetchWithTimeout(url, {
    method: "HEAD",
    timeoutMs: 2000,
  });
  if (response?.ok) {
    return url;
  }
  return null;
}

async function findWikiLink(
  name?: string,
  series?: number | null
): Promise<string | null> {
  if (!name) {
    return null;
  }

  const slug = slugifyName(name);

  const candidates = [
    ...(series && Number.isFinite(series)
      ? [
          `https://wiki.pepe.wtf/rare-pepes/series-${series}/${slug}`,
          `https://wiki.pepe.wtf/book-of-kek/series-${series}/${slug}`,
        ]
      : []),
    `https://wiki.pepe.wtf/rare-pepes/${slug}`,
    `https://wiki.pepe.wtf/${slug}`,
  ];

  for (const candidate of candidates) {
    const match = await probeWikiUrl(candidate);
    if (match) {
      return match;
    }
  }

  return null;
}

function buildCacheHeaders(hit: boolean): Headers {
  const headers = new Headers();
  headers.set(
    "Cache-Control",
    `s-maxage=${ttlMinutes * 60}, stale-while-revalidate=60`
  );
  headers.set("X-Cache", hit ? "HIT" : "MISS");
  return headers;
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeSlug(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  // Slug must only be letters, numbers, hyphens, and 2-64 chars long.
  if (!/^[a-zA-Z0-9-]{2,64}$/.test(trimmed)) {
    return null;
  }
  return trimmed ? trimmed : null;
}

async function resolveCollection(slug: string): Promise<CollectionPreview> {
  const href = `https://pepe.wtf/collection/${encodeURIComponent(slug)}`;
  const nextData = await scrapeNextData(href);
  const name =
    extractFirstString(deepFindAll(nextData, ["name", "title"])) ??
    slug.replaceAll("-", " ").replaceAll(/\b\w/g, (c) => c.toUpperCase());
  const image =
    extractFirstString(
      deepFindAll(nextData, ["image", "thumbnail_url", "imageUrl", "imageURL"])
    ) ?? null;

  return {
    kind: "collection",
    href,
    slug,
    name,
    image,
    stats: { items: null, floorSats: null },
  };
}

async function resolveArtist(slug: string): Promise<ArtistPreview> {
  const href = `https://pepe.wtf/artists/${encodeURIComponent(slug)}`;
  const nextData = await scrapeNextData(href);
  const name =
    extractFirstString(deepFindAll(nextData, ["name", "title"])) ??
    slug.replaceAll("-", " ");
  const image =
    extractFirstString(
      deepFindAll(nextData, ["image", "thumbnail_url", "imageUrl", "imageURL"])
    ) ?? null;
  const collections = Array.from(
    new Set(
      deepFindAll(nextData, ["collection", "family"]).filter(
        (value): value is string => typeof value === "string"
      )
    )
  );

  return {
    kind: "artist",
    href,
    slug,
    name,
    image,
    stats: { uniqueCards: null, collections: collections.slice(0, 4) },
  };
}

async function resolveSet(slug: string): Promise<SetPreview> {
  const href = `https://pepe.wtf/sets/${encodeURIComponent(slug)}`;
  const nextData = await scrapeNextData(href);
  const name =
    extractFirstString(deepFindAll(nextData, ["name", "title"])) ??
    slug.replaceAll("-", " ");
  const image =
    extractFirstString(
      deepFindAll(nextData, ["image", "thumbnail_url", "imageUrl", "imageURL"])
    ) ?? null;

  let wiki: string | null = null;
  const seriesMatch = name.match(/series\s*(\d+)/i);
  if (seriesMatch) {
    const seriesNo = Number(seriesMatch[1]);
    if (Number.isFinite(seriesNo)) {
      wiki = await probeWikiUrl(
        `https://wiki.pepe.wtf/rare-pepes/series-${seriesNo}`
      );
    }
  }

  return {
    kind: "set",
    href,
    slug,
    name,
    image,
    stats: { items: null, fullSetFloorSats: null, lastSaleValuationSats: null },
    links: wiki ? { wiki } : null,
  };
}

async function resolveAsset(slug: string): Promise<AssetPreview> {
  const href = `https://pepe.wtf/asset/${encodeURIComponent(slug)}`;
  const scraped = await scrapePepeAssetPage(slug);
  const assetCode = scraped.asset;

  if (!assetCode) {
    return {
      kind: "asset",
      href,
      slug,
      name: scraped.name ?? slug,
      collection: scraped.collection,
      artist: scraped.artist,
      series: scraped.series ?? null,
      card: scraped.card ?? null,
      supply: null,
      holders: null,
      image: scraped.image ?? null,
      links: null,
      market: null,
    };
  }

  const [
    assetInfo,
    holdersList,
    dispensersOpen,
    marketHistBtc,
    marketHistXcp,
    rates,
  ] = await Promise.all([
    tokenscanJson<any>(`/api/asset/${encodeURIComponent(assetCode)}`),
    tokenscanJson<any>(`/api/holders/${encodeURIComponent(assetCode)}`),
    tokenscanJson<any>(
      `/api/dispensers/${encodeURIComponent(assetCode)}?status=open`
    ),
    tokenscanJson<any>(
      `/api/market/${encodeURIComponent(assetCode)}/BTC/history`
    ),
    tokenscanJson<any>(
      `/api/market/${encodeURIComponent(assetCode)}/XCP/history`
    ),
    getApproxRates(),
  ]);

  const holders = Array.isArray(holdersList?.data)
    ? holdersList.data.length
    : null;

  let bestAskSats: number | undefined;
  if (Array.isArray(dispensersOpen?.data)) {
    const satsValues = dispensersOpen.data
      .map((entry: any) =>
        Number(entry?.satoshi_price ?? entry?.satoshirate ?? 0)
      )
      .filter((value: number) => Number.isFinite(value) && value > 0);
    if (satsValues.length) {
      bestAskSats = Math.min(...satsValues);
    }
  }

  const lastBtc =
    Array.isArray(marketHistBtc?.data) && marketHistBtc.data.length
      ? marketHistBtc.data[0]
      : null;
  const lastXcp =
    Array.isArray(marketHistXcp?.data) && marketHistXcp.data.length
      ? marketHistXcp.data[0]
      : null;

  const lastSaleSats = Number(lastBtc?.price_sats);
  const lastSaleXcp = Number(lastXcp?.price);

  if (
    !scraped.image &&
    typeof assetInfo?.description === "string" &&
    assetInfo.description
  ) {
    const enriched = await tryExtractImageFromDescription(
      assetInfo.description,
      href
    );
    if (enriched) {
      scraped.image = enriched;
    }
  }

  const wikiLink = await findWikiLink(
    scraped.name ?? assetCode,
    scraped.series ?? null
  );

  return {
    kind: "asset",
    href,
    slug,
    asset: assetCode,
    name: scraped.name ?? assetCode,
    collection: scraped.collection,
    artist: scraped.artist,
    series: scraped.series ?? null,
    card: scraped.card ?? null,
    supply: assetInfo?.supply ? Number(assetInfo.supply) : null,
    holders,
    image: scraped.image ?? null,
    links: {
      horizon: `https://horizon.market/explorer/assets/${encodeURIComponent(
        assetCode
      )}`,
      xchain: `https://xchain.io/asset/${encodeURIComponent(assetCode)}`,
      wiki: wikiLink ?? undefined,
    },
    market: {
      bestAskSats,
      lastSaleSats: Number.isFinite(lastSaleSats) ? lastSaleSats : undefined,
      lastSaleXcp: Number.isFinite(lastSaleXcp) ? lastSaleXcp : undefined,
      approxEthPerBtc: rates.ethPerBtc || undefined,
      approxEthPerXcp: rates.ethPerXcp || undefined,
      updatedISO: new Date().toISOString(),
    },
  };
}

export async function GET(request: NextRequest) {
  const kind =
    (request.nextUrl.searchParams.get("kind") as PepeKind | null) ?? null;
  const slug = normalizeSlug(request.nextUrl.searchParams.get("slug"));

  if (
    !kind ||
    !slug ||
    !["asset", "collection", "artist", "set"].includes(kind)
  ) {
    return errorResponse("invalid params", 400);
  }
  // additional SSRF prevention: ensure slug does not contain dangerous substrings
  // (redundant due to normalizeSlug, but extra defense in depth)
  if (
    slug.includes("../") ||
    slug.includes("/") ||
    slug.includes("\\") ||
    slug.startsWith("-") ||
    slug.length > 64
  ) {
    return errorResponse("invalid slug", 400);
  }
  // additional SSRF prevention: ensure slug does not contain dangerous substrings
  // (redundant due to normalizeSlug, but extra defense in depth)
  if (
    slug.includes("../") ||
    slug.includes("/") ||
    slug.includes("\\") ||
    slug.startsWith("-") ||
    slug.length > 64
  ) {
    return errorResponse("invalid slug", 400);
  }

  // additional SSRF prevention: ensure slug does not contain dangerous substrings
  // (redundant due to normalizeSlug, but extra defense in depth)
  if (
    slug.includes("../") ||
    slug.includes("/") ||
    slug.includes("\\") ||
    slug.startsWith("-") ||
    slug.length > 64
  ) {
    return errorResponse("invalid slug", 400);
  }

  const cacheKey = `${kind}:${slug.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: buildCacheHeaders(true) });
  }

  try {
    let preview: Preview;

    switch (kind) {
      case "collection":
        preview = await resolveCollection(slug);
        break;
      case "artist":
        preview = await resolveArtist(slug);
        break;
      case "set":
        preview = await resolveSet(slug);
        break;
      case "asset":
      default:
        preview = await resolveAsset(slug);
        break;
    }

    cache.set(cacheKey, preview);
    return NextResponse.json(preview, { headers: buildCacheHeaders(false) });
  } catch (error) {
    console.error("Failed to resolve pepe preview", error);
    return NextResponse.json(
      { error: "resolve_failed" },
      { headers: buildCacheHeaders(false) }
    );
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
