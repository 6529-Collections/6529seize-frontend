export type WikimediaSource = "wikipedia" | "wikimedia-commons" | "wikidata";

export interface WikimediaImage {
  readonly url: string;
  readonly width?: number | null | undefined;
  readonly height?: number | null | undefined;
  readonly alt?: string | null | undefined;
}

interface WikimediaCardBase {
  readonly canonicalUrl: string;
  readonly pageUrl: string;
  readonly source: WikimediaSource;
}

export interface WikimediaArticleCard extends WikimediaCardBase {
  readonly kind: "article";
  readonly title: string;
  readonly description?: string | null | undefined;
  readonly extract?: string | null | undefined;
  readonly lang: string;
  readonly thumbnail?: WikimediaImage | null | undefined;
  readonly coordinates?: { readonly lat: number; readonly lon: number } | null | undefined;
  readonly lastModified?: string | null | undefined;
  readonly section?: string | null | undefined;
}

export interface WikimediaDisambiguationCard extends WikimediaCardBase {
  readonly kind: "disambiguation";
  readonly title: string;
  readonly description?: string | null | undefined;
  readonly extract?: string | null | undefined;
  readonly lang: string;
  readonly section?: string | null | undefined;
  readonly items: ReadonlyArray<{
    readonly title: string;
    readonly url: string;
    readonly description?: string | null | undefined;
    readonly thumbnail?: WikimediaImage | null | undefined;
  }>;
}

export interface WikimediaCommonsFileCard extends WikimediaCardBase {
  readonly kind: "commons-file";
  readonly title: string;
  readonly description?: string | null | undefined;
  readonly credit?: string | null | undefined;
  readonly author?: string | null | undefined;
  readonly license?: {
    readonly name: string;
    readonly url?: string | null | undefined;
    readonly requiresAttribution?: boolean | undefined;
  } | null | undefined;
  readonly thumbnail?: WikimediaImage | null | undefined;
  readonly original?: (WikimediaImage & { readonly mime?: string | null | undefined }) | null | undefined;
}

export interface WikimediaWikidataCard extends WikimediaCardBase {
  readonly kind: "wikidata";
  readonly title: string;
  readonly lang: string;
  readonly description?: string | null | undefined;
  readonly image?: WikimediaImage | null | undefined;
  readonly facts: ReadonlyArray<{
    readonly propertyId: string;
    readonly propertyLabel: string;
    readonly value: string;
  }>;
  readonly sitelinks: ReadonlyArray<{
    readonly title: string;
    readonly url: string;
    readonly site: string;
  }>;
}

export interface WikimediaUnavailableCard extends WikimediaCardBase {
  readonly kind: "unavailable";
  readonly reason?: string | undefined;
  readonly title?: string | null | undefined;
}

export type WikimediaCardResponse =
  | WikimediaArticleCard
  | WikimediaDisambiguationCard
  | WikimediaCommonsFileCard
  | WikimediaWikidataCard
  | WikimediaUnavailableCard;

const wikimediaCache = new Map<string, Promise<WikimediaCardResponse>>();

const normalizeUrl = (url: string): string => url.trim();

export const fetchWikimediaCard = async (
  url: string,
  signal?: AbortSignal
): Promise<WikimediaCardResponse> => {
  const normalizedUrl = normalizeUrl(url);

  if (!normalizedUrl) {
    throw new Error("A valid URL is required to fetch Wikimedia metadata.");
  }

  const cached = wikimediaCache.get(normalizedUrl);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({ url: normalizedUrl });

  const requestPromise = fetch(`/api/wikimedia-card?${params.toString()}`, {
    headers: { Accept: "application/json" },
    ...(signal !== undefined ? { signal: signal } : {}),
  })
    .then(async (response) => {
      if (!response.ok) {
        let message = "Failed to fetch Wikimedia metadata.";
        try {
          const body = await response.json();
          if (body && typeof body.error === "string" && body.error) {
            message = body.error;
          }
        } catch {
          // ignore JSON parse errors and use default message
        }
        throw new Error(message);
      }
      return response.json() as Promise<WikimediaCardResponse>;
    })
    .catch((error) => {
      wikimediaCache.delete(normalizedUrl);
      throw error;
    });

  wikimediaCache.set(normalizedUrl, requestPromise);

  return requestPromise;
};

