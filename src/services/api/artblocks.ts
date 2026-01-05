import { buildTokenApiUrl, type ArtBlocksTokenIdentifier } from "../artblocks/url";

export type ArtBlocksMeta = {
  projectName?: string | undefined;
  artistName?: string | undefined;
  tokenNumber?: string | undefined;
  features?: Record<string, string> | undefined;
  series?: string | undefined;
  aspectRatio?: number | undefined;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 50;

interface CacheEntry {
  value: ArtBlocksMeta | null;
  expiry: number;
  promise?: Promise<ArtBlocksMeta | null> | undefined;
}

const cache = new Map<string, CacheEntry>();

const toCacheKey = ({ contract, tokenId }: ArtBlocksTokenIdentifier): string => {
  const normalizedContract = contract?.toLowerCase() ?? "flagship";
  return `${normalizedContract}:${tokenId}`;
};

const trimCache = () => {
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey === undefined) {
      break;
    }
    cache.delete(oldestKey);
  }
};

const readString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

const readNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const normalizeSeries = (value: string | number | undefined): ArtBlocksMeta["series"] | undefined => {
  if (typeof value === "number") {
    switch (value) {
      case 1:
        return "Curated";
      case 2:
        return "Presents";
      case 3:
        return "Engine";
      default:
        return value.toString();
    }
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes("curated")) {
    return "Curated";
  }
  if (lower.includes("presents")) {
    return "Presents";
  }
  if (lower.includes("engine")) {
    return "Engine";
  }

  return trimmed;
};

const extractTokenNumber = (data: Record<string, unknown>): string | undefined => {
  const directTokenId =
    readString(data["tokenNumber"]) ||
    readString(data["token_number"]) ||
    readString(data["tokenID"]) ||
    readString(data["tokenId"]) ||
    readString(data["token_id"]);

  if (directTokenId) {
    return directTokenId;
  }

  const name = readString(data["name"]);
  if (!name) {
    return undefined;
  }

  const match = name.match(/#(\d+)/);
  return match ? match[1] : undefined;
};

const extractProjectName = (data: Record<string, unknown>): string | undefined => {
  return (
    readString(data["projectName"]) ||
    readString(data["project_name"]) ||
    readString(data["collection_name"]) ||
    readString(data["collectionName"]) ||
    readString(data["name"])
  );
};

const extractArtistName = (data: Record<string, unknown>): string | undefined => {
  return readString(data["artist"]) || readString(data["artistName"]);
};

const extractSeries = (data: Record<string, unknown>): ArtBlocksMeta["series"] | undefined => {
  return (
    normalizeSeries(data["series"] as string | number | undefined) ||
    normalizeSeries(readString(data["platform"])) ||
    normalizeSeries(readString(data["curation_status"])) ||
    normalizeSeries(readString(data["heritage_curation_status"]))
  );
};

const extractFeatures = (data: Record<string, unknown>): Record<string, string> | undefined => {
  const rawFeatures = data["features"];
  if (!rawFeatures || typeof rawFeatures !== "object") {
    return undefined;
  }

  const entries = Object.entries(rawFeatures as Record<string, unknown>)
    .filter(([key, value]) => typeof key === "string" && value !== undefined && value !== null)
    .map(([key, value]) => [key, typeof value === "string" ? value : String(value)] as const);

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
};

const parseTokenMetadata = (json: unknown): ArtBlocksMeta | null => {
  if (!json || typeof json !== "object") {
    return null;
  }

  const data = json as Record<string, unknown>;

  const projectName = extractProjectName(data);
  const artistName = extractArtistName(data);
  const tokenNumber = extractTokenNumber(data);
  const features = extractFeatures(data);
  const series = extractSeries(data);
  const aspectRatio = readNumber(data["aspect_ratio"]);

  const meta: ArtBlocksMeta = {};

  if (projectName) {
    meta.projectName = projectName;
  }
  if (artistName) {
    meta.artistName = artistName;
  }
  if (tokenNumber) {
    meta.tokenNumber = tokenNumber;
  }
  if (features) {
    meta.features = features;
  }
  if (series) {
    meta.series = series;
  }
  if (aspectRatio !== undefined) {
    meta.aspectRatio = aspectRatio;
  }

  return Object.keys(meta).length > 0 ? meta : {};
};

const requestMetadata = async (
  id: ArtBlocksTokenIdentifier,
  signal?: AbortSignal
): Promise<ArtBlocksMeta | null> => {
  const endpoints = buildTokenApiUrl(id);

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        ...(signal !== undefined ? { signal: signal } : {}),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        if (response.status >= 400 && response.status < 600) {
          return null;
        }
        continue;
      }

      const payload = await response.json();
      return parseTokenMetadata(payload);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      return null;
    }
  }

  return null;
};

const startFetch = (
  key: string,
  id: ArtBlocksTokenIdentifier,
  signal: AbortSignal | undefined,
  isBackground: boolean
): Promise<ArtBlocksMeta | null> => {
  const request = requestMetadata(id, signal)
    .then((meta) => {
      const entry: CacheEntry = {
        value: meta,
        expiry: Date.now() + CACHE_TTL_MS,
      };
      cache.set(key, entry);
      trimCache();
      return meta;
    })
    .catch((error) => {
      if (error instanceof Error && error.name === "AbortError") {
        cache.delete(key);
        throw error;
      }

      if (!isBackground) {
        cache.set(key, {
          value: null,
          expiry: Date.now() + CACHE_TTL_MS,
        });
      }

      return null;
    })
    .finally(() => {
      const entry = cache.get(key);
      if (entry) {
        delete entry.promise;
      }
    });

  const existing = cache.get(key);
  cache.set(key, {
    value: existing?.value ?? null,
    expiry: existing?.expiry ?? Date.now() + CACHE_TTL_MS,
    promise: request,
  });

  return request;
};

export const fetchArtBlocksMeta = async (
  id: ArtBlocksTokenIdentifier,
  signal?: AbortSignal
): Promise<ArtBlocksMeta | null> => {
  const key = toCacheKey(id);
  const now = Date.now();
  const cached = cache.get(key);

  if (cached) {
    if (cached.promise) {
      return cached.promise;
    }

    if (cached.expiry > now) {
      cache.delete(key);
      cache.set(key, cached);
      return cached.value;
    }

    // Stale entry: trigger background revalidation
    startFetch(key, id, undefined, true).catch(() => {
      // errors handled in startFetch
    });
    cache.delete(key);
    cache.set(key, { ...cached, expiry: now + CACHE_TTL_MS });
    return cached.value;
  }

  try {
    const result = await startFetch(key, id, signal, false);
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    return null;
  }
};

export const inferSeries = (
  contract?: string
): ArtBlocksMeta["series"] => {
  if (contract) {
    return "Engine";
  }
  return "Curated";
};
