export type WikimediaSource = "wikipedia" | "wikimedia-commons" | "wikidata";

export interface WikimediaImage {
  readonly url: string;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly alt?: string | null;
}

interface WikimediaCardBase {
  readonly canonicalUrl: string;
  readonly pageUrl: string;
  readonly source: WikimediaSource;
}

export interface WikimediaArticleCard extends WikimediaCardBase {
  readonly kind: "article";
  readonly title: string;
  readonly description?: string | null;
  readonly extract?: string | null;
  readonly lang: string;
  readonly thumbnail?: WikimediaImage | null;
  readonly coordinates?: { readonly lat: number; readonly lon: number } | null;
  readonly lastModified?: string | null;
  readonly section?: string | null;
}

export interface WikimediaDisambiguationCard extends WikimediaCardBase {
  readonly kind: "disambiguation";
  readonly title: string;
  readonly description?: string | null;
  readonly extract?: string | null;
  readonly lang: string;
  readonly section?: string | null;
  readonly items: ReadonlyArray<{
    readonly title: string;
    readonly url: string;
    readonly description?: string | null;
    readonly thumbnail?: WikimediaImage | null;
  }>;
}

export interface WikimediaCommonsFileCard extends WikimediaCardBase {
  readonly kind: "commons-file";
  readonly title: string;
  readonly description?: string | null;
  readonly credit?: string | null;
  readonly author?: string | null;
  readonly license?: {
    readonly name: string;
    readonly url?: string | null;
    readonly requiresAttribution?: boolean;
  } | null;
  readonly thumbnail?: WikimediaImage | null;
  readonly original?: (WikimediaImage & { readonly mime?: string | null }) | null;
}

export interface WikimediaWikidataCard extends WikimediaCardBase {
  readonly kind: "wikidata";
  readonly title: string;
  readonly lang: string;
  readonly description?: string | null;
  readonly image?: WikimediaImage | null;
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
  readonly reason?: string;
  readonly title?: string | null;
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
    signal,
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

