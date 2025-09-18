import type {
  WikimediaArticlePreview,
  WikimediaCommonsPreview,
  WikimediaDisambiguationCandidate,
  WikimediaDisambiguationPreview,
  WikimediaPreview,
  WikimediaUnavailablePreview,
  WikimediaWikidataFact,
  WikimediaWikidataPreview,
} from "@/types/wikimedia";

import {
  normalizeWikimediaTarget,
  resolveWWiki,
  sanitizePlainText,
  type NormalizedTarget,
} from "./normalize";

const USER_AGENT =
  "6529seize-wikimedia-card/1.0 (+https://6529.io; Wikimedia previews)";

const ARTICLE_TTL = 24 * 60 * 60 * 1000;
const WIKIDATA_TTL = 24 * 60 * 60 * 1000;
const COMMONS_TTL = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  readonly expiresAt: number;
  readonly preview: WikimediaPreview;
}

const cache = new Map<string, CacheEntry>();

export class WikimediaUnsupportedError extends Error {}
export class WikimediaNotFoundError extends Error {}

interface FetchOptions {
  readonly signal?: AbortSignal;
  readonly acceptLanguage?: string;
}

const fetchJson = async <T>(url: string, options: FetchOptions): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    signal: options.signal,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new WikimediaNotFoundError(`Resource not found: ${url}`);
    }
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};

const appendSection = (url: string, section: string | null | undefined): string => {
  if (!section) {
    return url;
  }
  const formatted = encodeURI(section.replace(/\s+/g, "_"));
  return `${url}#${formatted}`;
};

const resolveWikipediaTitle = async (
  lang: string,
  target: NormalizedTarget & { kind: "article" },
  options: FetchOptions
): Promise<string | null> => {
  if (target.title) {
    return target.title;
  }

  if (target.curid) {
    const data = await fetchJson<{
      query?: { pages?: Record<string, { title?: string }> };
    }>(
      `https://${lang}.wikipedia.org/w/api.php?action=query&prop=info&pageids=${encodeURIComponent(
        target.curid
      )}&format=json`,
      options
    );

    const page = data.query?.pages && Object.values(data.query.pages)[0];
    if (page?.title) {
      return page.title;
    }
  }

  if (target.oldid) {
    const data = await fetchJson<{
      query?: { pages?: Record<string, { title?: string }> };
    }>(
      `https://${lang}.wikipedia.org/w/api.php?action=query&revids=${encodeURIComponent(
        target.oldid
      )}&prop=info&format=json`,
      options
    );
    const page = data.query?.pages && Object.values(data.query.pages)[0];
    if (page?.title) {
      return page.title;
    }
  }

  return null;
};

const buildArticlePreview = async (
  target: NormalizedTarget & { kind: "article" },
  options: FetchOptions
): Promise<WikimediaPreview> => {
  const lang = target.lang;
  const resolvedTitle = await resolveWikipediaTitle(lang, target, options);

  if (!resolvedTitle) {
    throw new WikimediaUnsupportedError("Unable to resolve Wikipedia title.");
  }

  const titleParam = encodeURI(resolvedTitle.replace(/\s+/g, "_"));
  const summaryUrl = new URL(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${titleParam}`
  );
  summaryUrl.searchParams.set("redirect", "true");
  if (target.oldid) {
    summaryUrl.searchParams.set("oldid", target.oldid);
  }

  const summary = await fetchJson<{
    type?: string;
    title?: string;
    displaytitle?: string;
    description?: string;
    extract?: string;
    lang?: string;
    timestamp?: string;
    content_urls?: {
      desktop?: { page?: string };
      mobile?: { page?: string };
    };
    thumbnail?: { source?: string; width?: number; height?: number };
    coordinates?: { lat?: number; lon?: number };
  }>(summaryUrl.toString(), options);

  const canonicalUrl = appendSection(
    summary.content_urls?.desktop?.page ?? target.canonicalUrl,
    target.section
  );

  const displayTitle =
    sanitizePlainText(summary.displaytitle) ??
    sanitizePlainText(summary.title) ??
    resolvedTitle;

  if (summary.type === "disambiguation") {
    const related = await fetchJson<{
      pages?: Array<{
        titles?: { normalized?: string; display?: string };
        description?: string;
        extract?: string;
        thumbnail?: { source?: string; width?: number; height?: number };
        content_urls?: { desktop?: { page?: string } };
      }>;
    }>(
      `https://${lang}.wikipedia.org/api/rest_v1/page/related/${titleParam}`,
      options
    );
    const items: WikimediaDisambiguationCandidate[] = [];
    for (const page of related.pages ?? []) {
      const url = page.content_urls?.desktop?.page;
      if (!url) {
        continue;
      }
      const candidateTitle =
        sanitizePlainText(page.titles?.display) ??
        sanitizePlainText(page.titles?.normalized);
      if (!candidateTitle) {
        continue;
      }
      const candidateDescription =
        sanitizePlainText(page.description) ?? sanitizePlainText(page.extract);
      const thumbnail = page.thumbnail?.source
        ? {
            url: page.thumbnail.source,
            width: page.thumbnail.width ?? undefined,
            height: page.thumbnail.height ?? undefined,
          }
        : null;
      items.push({
        title: candidateTitle,
        description: candidateDescription ?? undefined,
        url,
        thumbnail: thumbnail ?? undefined,
      });
      if (items.length >= 5) {
        break;
      }
    }

    const preview: WikimediaDisambiguationPreview = {
      kind: "disambiguation",
      source: "wikipedia",
      canonicalUrl,
      originalUrl: target.originalUrl,
      lang: summary.lang ?? lang,
      title: displayTitle,
      description: sanitizePlainText(summary.description),
      extract: sanitizePlainText(summary.extract),
      items,
      section: target.section ?? null,
    };
    return preview;
  }

  const preview: WikimediaArticlePreview = {
    kind: "article",
    source: "wikipedia",
    canonicalUrl,
    originalUrl: target.originalUrl,
    lang: summary.lang ?? lang,
    title: displayTitle,
    description: sanitizePlainText(summary.description),
    extract: sanitizePlainText(summary.extract),
    thumbnail: summary.thumbnail?.source
      ? {
          url: summary.thumbnail.source,
          width: summary.thumbnail.width ?? undefined,
          height: summary.thumbnail.height ?? undefined,
          alt: displayTitle,
        }
      : null,
    coordinates:
      typeof summary.coordinates?.lat === "number" &&
      typeof summary.coordinates?.lon === "number"
        ? { lat: summary.coordinates.lat, lon: summary.coordinates.lon }
        : null,
    section: target.section ?? null,
    lastModified: summary.timestamp ?? null,
  };

  return preview;
};

const buildCommonsPreview = async (
  target: NormalizedTarget & { kind: "commons-file" },
  options: FetchOptions
): Promise<WikimediaCommonsPreview> => {
  if (!target.fileName) {
    throw new WikimediaUnsupportedError("Missing Commons file name.");
  }

  const queryUrl = new URL(
    "https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo"
  );
  queryUrl.searchParams.set("format", "json");
  queryUrl.searchParams.set(
    "titles",
    `File:${encodeURIComponent(target.fileName).replace(/%20/g, "+")}`
  );
  queryUrl.searchParams.set("iiprop", "url|mime|size|extmetadata");
  queryUrl.searchParams.set("iiurlwidth", "640");

  const data = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        {
          missing?: string;
          title?: string;
          imageinfo?: Array<
            {
              url?: string;
              descriptionurl?: string;
              mime?: string;
              size?: number;
              width?: number;
              height?: number;
              thumburl?: string;
              thumbwidth?: number;
              thumbheight?: number;
              extmetadata?: Record<
                string,
                { value?: string; source?: string; hidden?: string }
              >;
            }
          >;
        }
      >;
    };
  }>(queryUrl.toString(), options);

  const page = data.query?.pages && Object.values(data.query.pages)[0];
  if (!page || "missing" in page || !page.imageinfo || page.imageinfo.length === 0) {
    throw new WikimediaNotFoundError("Commons file not found.");
  }

  const info = page.imageinfo[0];
  const extmetadata = info.extmetadata ?? {};
  const description =
    sanitizePlainText(extmetadata.ImageDescription?.value) ??
    sanitizePlainText(extmetadata.Description?.value);
  const credit =
    sanitizePlainText(extmetadata.Credit?.value) ??
    sanitizePlainText(extmetadata.Artist?.value);
  const licenseName =
    sanitizePlainText(extmetadata.LicenseShortName?.value) ??
    sanitizePlainText(extmetadata.UsageTerms?.value);
  const licenseUrl = extmetadata.LicenseUrl?.value
    ? extmetadata.LicenseUrl.value.trim()
    : undefined;

  const displayTitle =
    sanitizePlainText(page.title?.replace(/^File:/i, "")) ?? target.fileName;

  const preview: WikimediaCommonsPreview = {
    kind: "commons-file",
    source: "commons",
    canonicalUrl: info.descriptionurl ?? target.canonicalUrl,
    originalUrl: target.originalUrl,
    title: displayTitle ?? target.fileName,
    description: description ?? undefined,
    credit: credit ?? undefined,
    license: licenseName
      ? {
          name: licenseName,
          url: licenseUrl,
        }
      : licenseUrl
        ? { name: licenseUrl, url: licenseUrl }
        : null,
    thumbnail: info.thumburl
      ? {
          url: info.thumburl,
          width: info.thumbwidth ?? undefined,
          height: info.thumbheight ?? undefined,
          alt: displayTitle ?? target.fileName,
        }
      : null,
    originalFile: info.url
      ? {
          url: info.url,
          width: info.width ?? undefined,
          height: info.height ?? undefined,
        }
      : null,
    mimeType: info.mime ?? undefined,
    attributionRequired: extmetadata.AttributionRequired?.value === "true",
  };

  return preview;
};

const FACT_PROPERTIES: Array<{
  readonly id: string;
  readonly label: string;
}> = [
  { id: "P31", label: "Instance of" },
  { id: "P279", label: "Subclass of" },
  { id: "P17", label: "Country" },
  { id: "P131", label: "Located in" },
  { id: "P27", label: "Nationality" },
  { id: "P571", label: "Inception" },
  { id: "P170", label: "Creator" },
  { id: "P1082", label: "Population" },
  { id: "P625", label: "Coordinates" },
];

const formatWikidataTime = (value: { time?: string }): string | null => {
  const raw = value.time;
  if (!raw) {
    return null;
  }
  const match = raw.match(/[+-]?(\d{1,4})-(\d{2})-(\d{2})/);
  if (!match) {
    return raw;
  }
  const [_, year, month, day] = match;
  return `${year}-${month}-${day}`;
};

const formatQuantity = (value: { amount?: string; unit?: string }): string | null => {
  if (!value.amount) {
    return null;
  }
  const amount = Number.parseFloat(value.amount);
  if (!Number.isFinite(amount)) {
    return value.amount;
  }
  const formatted = Math.abs(amount) >= 1
    ? amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : amount.toPrecision(3);
  if (!value.unit || value.unit === "1") {
    return formatted;
  }
  const unit = value.unit.split("/").pop();
  return unit ? `${formatted} ${unit}` : formatted;
};

const buildWikidataPreview = async (
  target: NormalizedTarget & { kind: "wikidata" },
  options: FetchOptions
): Promise<WikimediaWikidataPreview> => {
  const entityData = await fetchJson<{
    entities?: Record<
      string,
      {
        labels?: Record<string, { value?: string }>;
        descriptions?: Record<string, { value?: string }>;
        claims?: Record<string, Array<{ mainsnak?: any }>>;
        sitelinks?: Record<string, { title?: string; url?: string; site?: string }>;
      }
    >;
  }>(`https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(target.id)}.json`, options);

  const entity = entityData.entities?.[target.id];
  if (!entity) {
    throw new WikimediaNotFoundError("Wikidata entity not found.");
  }

  const preferredLang = options.acceptLanguage?.split(",")[0]?.trim().toLowerCase();
  const pickLabel = (record: Record<string, { value?: string }> | undefined) => {
    if (!record) {
      return undefined;
    }
    const langs = [preferredLang, "en"]
      .filter((lang): lang is string => Boolean(lang))
      .map((lang) => lang.split("-")[0]);
    for (const lang of langs) {
      const entry = record[lang];
      if (entry?.value) {
        const sanitized = sanitizePlainText(entry.value);
        if (sanitized) {
          return sanitized;
        }
      }
    }
    const fallback = Object.values(record)[0]?.value;
    return sanitizePlainText(fallback);
  };

  const label = pickLabel(entity.labels) ?? target.id;
  const description = pickLabel(entity.descriptions);

  const facts: WikimediaWikidataFact[] = [];
  const entityIdsToResolve = new Set<string>();
  let commonsImage: string | null = null;

  for (const property of FACT_PROPERTIES) {
    if (facts.length >= 4) {
      break;
    }
    const statements = entity.claims?.[property.id];
    if (!statements || statements.length === 0) {
      continue;
    }
    const statement = statements[0];
    const snak = statement.mainsnak;
    if (!snak || snak.snaktype !== "value" || !snak.datavalue) {
      continue;
    }
    const datavalue = snak.datavalue as { type: string; value: any };
    let value: string | null = null;
    let url: string | undefined;

    switch (datavalue.type) {
      case "wikibase-entityid": {
        const id = datavalue.value?.id;
        if (typeof id === "string") {
          entityIdsToResolve.add(id);
          value = id;
        }
        break;
      }
      case "monolingualtext":
        value = sanitizePlainText(datavalue.value?.text ?? undefined) ?? null;
        break;
      case "string":
      case "external-id":
        value = sanitizePlainText(datavalue.value ?? undefined) ?? null;
        break;
      case "time":
        value = formatWikidataTime(datavalue.value) ?? null;
        break;
      case "quantity":
        value = formatQuantity(datavalue.value) ?? null;
        break;
      case "globe-coordinate": {
        const lat = datavalue.value?.latitude;
        const lon = datavalue.value?.longitude;
        if (typeof lat === "number" && typeof lon === "number") {
          value = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
        }
        break;
      }
      case "url":
        value = sanitizePlainText(datavalue.value ?? undefined) ?? null;
        url = datavalue.value;
        break;
      case "commonsMedia":
        if (property.id === "P18") {
          commonsImage = datavalue.value ?? null;
        }
        value = sanitizePlainText(datavalue.value ?? undefined) ?? null;
        break;
      default:
        break;
    }

    if (!value) {
      continue;
    }

    facts.push({
      propertyId: property.id,
      label: property.label,
      value,
      url,
    });
  }

  const labelLookup: Record<string, string> = {};
  if (entityIdsToResolve.size > 0) {
    const ids = Array.from(entityIdsToResolve);
    const chunkSize = 40;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const response = await fetchJson<{
        entities?: Record<string, { labels?: Record<string, { value?: string }> }>;
      }>(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${chunk.join("|")}&props=labels&languages=${
          preferredLang ?? "en"
        }|en&format=json`,
        options
      );

      for (const [id, info] of Object.entries(response.entities ?? {})) {
        const label = pickLabel(info.labels);
        if (label) {
          labelLookup[id] = label;
        }
      }
    }
  }

  const resolvedFacts = facts.map((fact) => {
    if (labelLookup[fact.value]) {
      return { ...fact, value: labelLookup[fact.value] };
    }
    return fact;
  });

  let imageThumbnail: WikimediaWikidataPreview["image"] = null;
  let credit: string | null = null;
  let license: WikimediaWikidataPreview["license"] = null;

  if (commonsImage) {
    const commonsPreview = await buildCommonsPreview(
      {
        kind: "commons-file",
        source: "commons",
        fileName: commonsImage,
        canonicalUrl: `https://commons.wikimedia.org/wiki/${encodeURI(
          `File:${commonsImage}`.replace(/ /g, "_")
        )}`,
        originalUrl: target.originalUrl,
      },
      options
    );

    if (commonsPreview.thumbnail) {
      imageThumbnail = {
        url: commonsPreview.thumbnail.url,
        width: commonsPreview.thumbnail.width,
        height: commonsPreview.thumbnail.height,
        alt: commonsPreview.thumbnail.alt ?? commonsPreview.title,
      };
    } else if (commonsPreview.originalFile) {
      imageThumbnail = {
        url: commonsPreview.originalFile.url,
        width: commonsPreview.originalFile.width,
        height: commonsPreview.originalFile.height,
        alt: commonsPreview.title,
      };
    }
    credit = commonsPreview.credit ?? null;
    license = commonsPreview.license;
  }

  const preview: WikimediaWikidataPreview = {
    kind: "wikidata",
    source: "wikidata",
    canonicalUrl: target.canonicalUrl,
    originalUrl: target.originalUrl,
    label,
    description: description ?? undefined,
    facts: resolvedFacts,
    image: imageThumbnail ?? null,
    credit,
    license,
    sitelinks: entity.sitelinks
      ? Object.values(entity.sitelinks)
          .filter((link): link is { title: string; url: string; site: string } =>
            Boolean(link?.title && link?.url && link?.site)
          )
          .slice(0, 5)
      : undefined,
  };

  return preview;
};

const getTtlForPreview = (preview: WikimediaPreview): number => {
  switch (preview.kind) {
    case "commons-file":
      return COMMONS_TTL;
    case "wikidata":
      return WIKIDATA_TTL;
    default:
      return ARTICLE_TTL;
  }
};

const buildUnavailablePreview = (
  target: NormalizedTarget,
  message = "This page is unavailable."
): WikimediaUnavailablePreview => {
  const canonical =
    target.kind === "article"
      ? appendSection(target.canonicalUrl, target.section)
      : target.canonicalUrl;

  return {
    kind: "unavailable",
    source: target.source,
    canonicalUrl: canonical,
    originalUrl: target.originalUrl,
    message,
  };
};

const resolveTarget = async (
  url: string,
  options: FetchOptions
): Promise<NormalizedTarget> => {
  const normalized = normalizeWikimediaTarget(url);
  if (normalized) {
    return normalized;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase() === "w.wiki") {
      const resolved = await resolveWWiki(parsed, options.signal);
      if (!resolved) {
        throw new WikimediaUnsupportedError("Unable to resolve short link.");
      }
      const normalizedResolved = normalizeWikimediaTarget(resolved.toString());
      if (normalizedResolved) {
        return normalizedResolved;
      }
    }
  } catch {
    // ignore parse errors
  }

  throw new WikimediaUnsupportedError("Unsupported Wikimedia URL.");
};

export const getWikimediaPreview = async (
  url: string,
  options: FetchOptions
): Promise<WikimediaPreview> => {
  const target = await resolveTarget(url, options);
  const cacheKey = target.canonicalUrl;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.preview;
  }

  let preview: WikimediaPreview;
  try {
    if (target.kind === "article") {
      preview = await buildArticlePreview(target, options);
    } else if (target.kind === "commons-file") {
      preview = await buildCommonsPreview(target, options);
    } else {
      preview = await buildWikidataPreview(target, options);
    }
  } catch (error) {
    if (error instanceof WikimediaNotFoundError) {
      const unavailable = buildUnavailablePreview(target);
      cache.set(cacheKey, {
        preview: unavailable,
        expiresAt: now + getTtlForPreview(unavailable),
      });
      return unavailable;
    }
    throw error;
  }

  const ttl = getTtlForPreview(preview);
  cache.set(cacheKey, { preview, expiresAt: now + ttl });

  return preview;
};
