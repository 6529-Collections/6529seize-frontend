export type WikimediaSource = "wikipedia" | "commons" | "wikidata";

export interface WikimediaThumbnail {
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
  readonly alt?: string;
}

export interface WikimediaArticlePreview {
  readonly kind: "article";
  readonly source: "wikipedia";
  readonly canonicalUrl: string;
  readonly originalUrl: string;
  readonly lang: string;
  readonly title: string;
  readonly description?: string;
  readonly extract?: string;
  readonly thumbnail?: WikimediaThumbnail | null;
  readonly coordinates?: { readonly lat: number; readonly lon: number } | null;
  readonly section?: string | null;
  readonly lastModified?: string | null;
}

export interface WikimediaDisambiguationCandidate {
  readonly title: string;
  readonly description?: string;
  readonly url: string;
  readonly thumbnail?: WikimediaThumbnail | null;
}

export interface WikimediaDisambiguationPreview {
  readonly kind: "disambiguation";
  readonly source: "wikipedia";
  readonly canonicalUrl: string;
  readonly originalUrl: string;
  readonly lang: string;
  readonly title: string;
  readonly description?: string;
  readonly extract?: string;
  readonly items: readonly WikimediaDisambiguationCandidate[];
  readonly section?: string | null;
}

export interface WikimediaCommonsPreview {
  readonly kind: "commons-file";
  readonly source: "commons";
  readonly canonicalUrl: string;
  readonly originalUrl: string;
  readonly title: string;
  readonly description?: string;
  readonly credit?: string;
  readonly license?: { readonly name: string; readonly url?: string } | null;
  readonly thumbnail?: WikimediaThumbnail | null;
  readonly originalFile?: {
    readonly url: string;
    readonly width?: number;
    readonly height?: number;
  } | null;
  readonly mimeType?: string | null;
  readonly attributionRequired?: boolean;
}

export interface WikimediaWikidataFact {
  readonly propertyId: string;
  readonly label: string;
  readonly value: string;
  readonly url?: string;
}

export interface WikimediaWikidataPreview {
  readonly kind: "wikidata";
  readonly source: "wikidata";
  readonly canonicalUrl: string;
  readonly originalUrl: string;
  readonly label: string;
  readonly description?: string;
  readonly lang?: string;
  readonly image?: WikimediaThumbnail | null;
  readonly license?: { readonly name: string; readonly url?: string } | null;
  readonly credit?: string | null;
  readonly facts: readonly WikimediaWikidataFact[];
  readonly sitelinks?: readonly { readonly title: string; readonly url: string; readonly site: string }[];
}

export interface WikimediaUnavailablePreview {
  readonly kind: "unavailable";
  readonly source: WikimediaSource;
  readonly canonicalUrl: string;
  readonly originalUrl: string;
  readonly message: string;
}

export type WikimediaPreview =
  | WikimediaArticlePreview
  | WikimediaDisambiguationPreview
  | WikimediaCommonsPreview
  | WikimediaWikidataPreview
  | WikimediaUnavailablePreview;
