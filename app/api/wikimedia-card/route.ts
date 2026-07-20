import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type {
  WikimediaCardResponse,
  WikimediaImage,
} from "@/services/api/wikimedia-card";

import { assertPublicUrl, parsePublicUrl } from "@/lib/security/urlGuard";
import {
  WIKIMEDIA_HOST_POLICY,
  ensureWikimediaUrl,
  fetchJson,
  normalizeTarget,
  parseAcceptLanguage,
  respondWithGuardError,
  sanitizeCacheKey,
  type CommonsFileTarget,
  type NormalizedTarget,
  type SummaryTarget,
  type WikidataTarget,
} from "./target";
import { sanitizeHtmlToText } from "@/lib/text/html";
import LruTtlCache from "@/lib/cache/lruTtl";

const USER_AGENT = "6529seize-wikimedia-preview/1.0 (+https://6529.io)";
const REQUEST_TIMEOUT_MS = 8000;
const SHORT_LINK_MAX_REDIRECTS = 5;
const CACHE_MAX_ITEMS = 1000;

const TTL_BY_KIND: Record<WikimediaCardResponse["kind"], number> = {
  article: 24 * 60 * 60 * 1000,
  disambiguation: 24 * 60 * 60 * 1000,
  "commons-file": 7 * 24 * 60 * 60 * 1000,
  wikidata: 24 * 60 * 60 * 1000,
  unavailable: 60 * 60 * 1000,
};

const cache = new LruTtlCache<string, WikimediaCardResponse>({
  max: CACHE_MAX_ITEMS,
  ttlMs: TTL_BY_KIND.unavailable,
});

const sanitizeHtml = (value: string): string => {
  return sanitizeHtmlToText(value, { preserveTagSpacing: true })
    .replaceAll(/\s+/g, " ")
    .trim();
};

const buildSummaryCard = async (
  target: SummaryTarget,
  languages: readonly string[]
): Promise<WikimediaCardResponse> => {
  try {
    const summary = await fetchJson<{
      readonly title?: string | undefined;
      readonly description?: string | undefined;
      readonly extract?: string | undefined;
      readonly lang?: string | undefined;
      readonly thumbnail?:
        | {
            readonly source?: string | undefined;
            readonly width?: number | undefined;
            readonly height?: number | undefined;
          }
        | undefined;
      readonly content_urls?:
        | {
            readonly desktop?:
              | { readonly page?: string | undefined }
              | undefined;
          }
        | undefined;
      readonly timestamp?: string | undefined;
      readonly type?: string | undefined;
      readonly coordinates?:
        | {
            readonly lat?: number | undefined;
            readonly lon?: number | undefined;
          }
        | undefined;
    }>(
      `https://${target.host}/api/rest_v1/page/summary/${encodeURIComponent(
        target.title
      )}?redirect=true`,
      { language: languages[0] }
    );

    const canonicalUrl =
      summary.content_urls?.desktop?.page ?? target.canonicalFallback;
    const pageUrl = target.fragment
      ? `${canonicalUrl}#${target.fragment.raw}`
      : canonicalUrl;

    const thumbnail: WikimediaImage | null = summary.thumbnail?.source
      ? {
          url: summary.thumbnail.source,
          width: summary.thumbnail.width,
          height: summary.thumbnail.height,
          alt: summary.title ?? target.title,
        }
      : null;

    const description = summary.description
      ? sanitizeHtml(summary.description)
      : null;
    const extract = summary.extract ? sanitizeHtml(summary.extract) : null;

    if (summary.type === "disambiguation") {
      let items:
        | Array<{
            readonly title: string;
            readonly description?: string | null | undefined;
            readonly url: string;
            readonly thumbnail?: WikimediaImage | null | undefined;
          }>
        | undefined;
      try {
        const related = await fetchJson<{
          readonly pages?:
            | ReadonlyArray<{
                readonly title?: string | undefined;
                readonly description?: string | undefined;
                readonly extract?: string | undefined;
                readonly thumbnail?:
                  | {
                      readonly source?: string | undefined;
                      readonly width?: number | undefined;
                      readonly height?: number | undefined;
                    }
                  | undefined;
                readonly content_urls?:
                  | {
                      readonly desktop?:
                        | { readonly page?: string | undefined }
                        | undefined;
                    }
                  | undefined;
              }>
            | undefined;
        }>(
          `https://${target.host}/api/rest_v1/page/related/${encodeURIComponent(
            target.title
          )}`,
          { language: languages[0] }
        );

        items = related.pages?.slice(0, 5).map((page) => ({
          title: page.title ?? "",
          description: page.description
            ? sanitizeHtml(page.description)
            : page.extract
              ? sanitizeHtml(page.extract)
              : null,
          url: page.content_urls?.desktop?.page ?? "",
          thumbnail: page.thumbnail?.source
            ? {
                url: page.thumbnail.source,
                width: page.thumbnail.width,
                height: page.thumbnail.height,
                alt: page.title ?? "",
              }
            : null,
        }));
      } catch {
        items = undefined;
      }

      return {
        kind: "disambiguation",
        source: target.source,
        canonicalUrl,
        pageUrl,
        title: summary.title ?? target.title,
        description,
        extract,
        lang: summary.lang ?? languages[0] ?? "en",
        section: target.fragment?.display ?? null,
        items: items?.filter((item) => Boolean(item.title && item.url)) ?? [],
      };
    }

    return {
      kind: "article",
      source: target.source,
      canonicalUrl,
      pageUrl,
      title: summary.title ?? target.title,
      description,
      extract,
      lang: summary.lang ?? languages[0] ?? "en",
      thumbnail,
      coordinates:
        summary.coordinates?.lat !== undefined &&
        summary.coordinates?.lon !== undefined
          ? { lat: summary.coordinates.lat, lon: summary.coordinates.lon }
          : null,
      lastModified: summary.timestamp ?? null,
      section: target.fragment?.display ?? null,
    };
  } catch {
    const canonicalUrl = target.canonicalFallback;
    const pageUrl = target.fragment
      ? `${canonicalUrl}#${target.fragment.raw}`
      : canonicalUrl;
    return {
      kind: "unavailable",
      source: target.source,
      canonicalUrl,
      pageUrl,
      title: null,
    };
  }
};

const buildCommonsCard = async (
  target: CommonsFileTarget
): Promise<WikimediaCardResponse> => {
  const fileTitle = target.fileName.startsWith("File:")
    ? target.fileName
    : `File:${target.fileName}`;
  const canonicalUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(
    fileTitle
  )}`;
  const pageUrl = target.fragment
    ? `${canonicalUrl}#${target.fragment.raw}`
    : canonicalUrl;

  try {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "imageinfo",
      titles: fileTitle,
      iiprop: "url|mime|size|extmetadata",
      iiurlwidth: "1200",
    });
    const response = await fetchJson<{
      readonly query?:
        | {
            readonly pages?:
              | Record<
                  string,
                  {
                    readonly title?: string | undefined;
                    readonly missing?: string | undefined;
                    readonly imageinfo?:
                      | ReadonlyArray<{
                          readonly url?: string | undefined;
                          readonly mime?: string | undefined;
                          readonly size?: number | undefined;
                          readonly width?: number | undefined;
                          readonly height?: number | undefined;
                          readonly thumburl?: string | undefined;
                          readonly thumbwidth?: number | undefined;
                          readonly thumbheight?: number | undefined;
                          readonly descriptionurl?: string | undefined;
                          readonly extmetadata?:
                            | Record<
                                string,
                                { readonly value?: string | undefined }
                              >
                            | undefined;
                        }>
                      | undefined;
                  }
                >
              | undefined;
          }
        | undefined;
    }>(`https://commons.wikimedia.org/w/api.php?${params.toString()}`);

    const pages = response.query?.pages;
    const page = pages ? Object.values(pages)[0] : undefined;
    if (!page || page.missing === "") {
      throw new Error("missing");
    }
    const info = page.imageinfo?.[0];
    if (!info) {
      throw new Error("missing");
    }

    const metadata = info.extmetadata ?? {};
    const getMeta = (key: string) => {
      const raw = metadata[key]?.value;
      if (!raw) {
        return undefined;
      }
      return sanitizeHtml(raw);
    };

    const description = getMeta("ImageDescription");
    const credit = getMeta("Credit");
    const artist = getMeta("Artist");
    const licenseName = getMeta("LicenseShortName") ?? getMeta("UsageTerms");
    const licenseUrl = metadata["LicenseUrl"]?.value ?? null;
    const requiresAttribution =
      (metadata["AttributionRequired"]?.value ?? "").toLowerCase() === "true";

    const thumbnail: WikimediaImage | null = info.thumburl
      ? {
          url: info.thumburl,
          width: info.thumbwidth,
          height: info.thumbheight,
          alt: description ?? page.title ?? fileTitle,
        }
      : info.url
        ? {
            url: info.url,
            width: info.width,
            height: info.height,
            alt: description ?? page.title ?? fileTitle,
          }
        : null;

    const original:
      | (WikimediaImage & { readonly mime?: string | null | undefined })
      | null = info.url
      ? {
          url: info.url,
          width: info.width,
          height: info.height,
          alt: description ?? page.title ?? fileTitle,
          mime: info.mime ?? null,
        }
      : null;

    return {
      kind: "commons-file",
      source: "wikimedia-commons",
      canonicalUrl,
      pageUrl,
      title: page.title ?? fileTitle,
      description: description ?? null,
      credit: credit ?? null,
      author: artist ?? null,
      license: licenseName
        ? { name: licenseName, url: licenseUrl, requiresAttribution }
        : null,
      thumbnail,
      original,
    };
  } catch {
    return {
      kind: "unavailable",
      source: "wikimedia-commons",
      canonicalUrl,
      pageUrl,
      title: null,
    };
  }
};

const selectLabel = (
  entries: Record<string, { readonly value?: string | undefined }> | undefined,
  languages: readonly string[]
): string | undefined => {
  if (!entries) {
    return undefined;
  }
  for (const lang of languages) {
    const entry = entries[lang];
    if (entry?.value) {
      return entry.value;
    }
  }
  return undefined;
};

const fetchEntityLabels = async (
  ids: readonly string[],
  languages: readonly string[]
): Promise<Record<string, string>> => {
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) {
    return {};
  }

  const labels: Record<string, string> = {};
  const languageParam = languages.join("|");

  for (let i = 0; i < unique.length; i += 50) {
    const slice = unique.slice(i, i + 50);
    const params = new URLSearchParams({
      action: "wbgetentities",
      format: "json",
      props: "labels",
      ids: slice.join("|"),
      languages: languageParam,
    });

    try {
      const response = await fetchJson<{
        readonly entities?:
          | Record<
              string,
              {
                readonly labels?:
                  | Record<string, { readonly value?: string | undefined }>
                  | undefined;
              }
            >
          | undefined;
      }>(`https://www.wikidata.org/w/api.php?${params.toString()}`);

      const entities = response.entities ?? {};
      for (const id of slice) {
        const entity = entities[id];
        const label = selectLabel(entity?.labels, languages);
        if (label) {
          labels[id] = label;
        }
      }
    } catch {
      // ignore chunk errors
    }
  }

  return labels;
};

const formatTimeValue = (value: {
  readonly time?: string | undefined;
  readonly precision?: number | undefined;
}): string | null => {
  if (!value.time) {
    return null;
  }
  const precision = value.precision ?? 11;
  const time = value.time.replace(/^\+/, "");
  const [datePart] = time.split("T");
  if (!datePart) {
    return null;
  }
  const [year, month = "", day = ""] = datePart.split("-");

  if (precision >= 11 && day) {
    return `${year}-${month}-${day}`;
  }
  if (precision >= 10 && month) {
    return `${year}-${month}`;
  }
  if (precision >= 9) {
    return year || null;
  }
  return year || null;
};

const FACT_PROPERTIES = ["P31", "P17", "P27", "P495", "P571", "P170"] as const;

const buildWikidataCard = async (
  target: WikidataTarget,
  languages: readonly string[]
): Promise<WikimediaCardResponse> => {
  const canonicalUrl = `https://www.wikidata.org/wiki/${encodeURIComponent(
    target.id
  )}`;
  const pageUrl = target.fragment
    ? `${canonicalUrl}#${target.fragment.raw}`
    : canonicalUrl;

  try {
    const response = await fetchJson<{
      readonly entities?:
        | Record<
            string,
            {
              readonly labels?:
                | Record<string, { readonly value?: string | undefined }>
                | undefined;
              readonly descriptions?:
                | Record<string, { readonly value?: string | undefined }>
                | undefined;
              readonly claims?:
                | Record<
                    string,
                    ReadonlyArray<{
                      readonly mainsnak?:
                        | {
                            readonly datavalue?:
                              | {
                                  readonly type?: string | undefined;
                                  readonly value?: unknown | undefined;
                                }
                              | undefined;
                          }
                        | undefined;
                    }>
                  >
                | undefined;
              readonly sitelinks?:
                | Record<
                    string,
                    {
                      readonly title?: string | undefined;
                      readonly url?: string | undefined;
                    }
                  >
                | undefined;
            }
          >
        | undefined;
    }>(
      `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(
        target.id
      )}.json`
    );

    const entity = response.entities?.[target.id];
    if (!entity) {
      throw new Error("missing");
    }

    const label = selectLabel(entity.labels, languages) ?? target.id;
    const description = selectLabel(entity.descriptions, languages) ?? null;

    const claims = entity.claims ?? {};
    const referencedIds: string[] = [];
    const propertyIds: string[] = [];
    const facts: Array<{
      propertyId: string;
      propertyLabel: string;
      value: string;
    }> = [];

    for (const propertyId of FACT_PROPERTIES) {
      const claim = claims[propertyId]?.[0]?.mainsnak;
      if (!claim?.datavalue) {
        continue;
      }
      propertyIds.push(propertyId);
      const { type, value } = claim.datavalue as {
        type?: string | undefined;
        value?: unknown | undefined;
      };
      let formatted: string | null = null;

      if (
        type === "wikibase-entityid" &&
        value &&
        typeof value === "object" &&
        "id" in value
      ) {
        const entityId = (value as { readonly id?: string | undefined }).id;
        if (entityId) {
          referencedIds.push(entityId);
          formatted = entityId;
        }
      } else if (type === "time" && value && typeof value === "object") {
        formatted = formatTimeValue(
          value as {
            readonly time?: string | undefined;
            readonly precision?: number | undefined;
          }
        );
      } else if (
        type === "monolingualtext" &&
        value &&
        typeof value === "object" &&
        "text" in value
      ) {
        formatted = String(
          (value as { readonly text?: string | undefined }).text
        );
      } else if (type === "string" && typeof value === "string") {
        formatted = value;
      } else if (
        type === "globecoordinate" &&
        value &&
        typeof value === "object"
      ) {
        const coord = value as {
          readonly latitude?: number | undefined;
          readonly longitude?: number | undefined;
        };
        if (
          typeof coord.latitude === "number" &&
          typeof coord.longitude === "number"
        ) {
          formatted = `${coord.latitude.toFixed(2)}, ${coord.longitude.toFixed(
            2
          )}`;
        }
      }

      if (!formatted) {
        continue;
      }

      facts.push({ propertyId, propertyLabel: propertyId, value: formatted });
      if (facts.length >= 4) {
        break;
      }
    }

    const labelLookup = await fetchEntityLabels(
      [...referencedIds, ...propertyIds],
      languages
    );

    const resolvedFacts = facts.map((fact) => {
      const propertyLabel = labelLookup[fact.propertyId] ?? fact.propertyId;
      const value = labelLookup[fact.value] ?? fact.value;
      return { propertyId: fact.propertyId, propertyLabel, value };
    });

    let image: WikimediaImage | null = null;
    const imageClaim = claims["P18"]?.[0]?.mainsnak?.datavalue;
    if (
      imageClaim &&
      imageClaim.type === "string" &&
      typeof imageClaim.value === "string"
    ) {
      const fileName = imageClaim.value.startsWith("File:")
        ? imageClaim.value
        : `File:${imageClaim.value}`;
      const commonsData = await buildCommonsCard({
        type: "commons-file",
        fileName,
      });
      if (commonsData.kind === "commons-file" && commonsData.thumbnail) {
        image = commonsData.thumbnail;
      }
    }

    const sitelinks: Array<{ title: string; url: string; site: string }> = [];
    if (entity.sitelinks) {
      const preferredSites = languages.map(
        (lang) => `${lang.split("-")[0]}wiki`
      );
      preferredSites.push("enwiki");
      const added = new Set<string>();
      for (const siteKey of preferredSites) {
        const link = entity.sitelinks[siteKey];
        if (link?.url && !added.has(link.url)) {
          sitelinks.push({
            title: link.title ?? siteKey,
            url: link.url,
            site: siteKey,
          });
          added.add(link.url);
        }
        if (sitelinks.length >= 3) {
          break;
        }
      }
    }

    return {
      kind: "wikidata",
      source: "wikidata",
      canonicalUrl,
      pageUrl,
      title: label,
      description: description ? sanitizeHtml(description) : null,
      lang: languages[0] ?? "en",
      image,
      facts: resolvedFacts,
      sitelinks,
    };
  } catch {
    return {
      kind: "unavailable",
      source: "wikidata",
      canonicalUrl,
      pageUrl,
      title: null,
    };
  }
};

const buildCard = async (
  target: NormalizedTarget,
  languages: readonly string[]
): Promise<WikimediaCardResponse> => {
  switch (target.type) {
    case "summary":
      return buildSummaryCard(target, languages);
    case "commons-file":
      return buildCommonsCard(target);
    case "wikidata":
      return buildWikidataCard(target, languages);
  }
};

export async function GET(request: NextRequest) {
  let targetUrl: URL;

  try {
    targetUrl = parsePublicUrl(request.nextUrl.searchParams.get("url"));
    ensureWikimediaUrl(targetUrl);
  } catch (error) {
    return respondWithGuardError(error, "Invalid Wikimedia URL.");
  }

  try {
    await assertPublicUrl(targetUrl, { policy: WIKIMEDIA_HOST_POLICY });
  } catch (error) {
    return respondWithGuardError(error, "The provided URL is not allowed.");
  }

  const cacheKey = sanitizeCacheKey(targetUrl);
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const languages = parseAcceptLanguage(request.headers.get("accept-language"));

  let target: NormalizedTarget;
  try {
    target = await normalizeTarget(targetUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unsupported Wikimedia URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const card = await buildCard(target, languages);
  const ttl = TTL_BY_KIND[card.kind] ?? TTL_BY_KIND.unavailable;

  cache.set(cacheKey, card, ttl);
  cache.set(card.canonicalUrl, card, ttl);

  return NextResponse.json(card);
}

export const dynamic = "force-dynamic";
