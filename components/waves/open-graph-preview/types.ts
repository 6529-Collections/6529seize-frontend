import type { LinkPreviewVariant } from "../LinkPreviewContext";

export interface OpenGraphPreviewData {
  title?: unknown | undefined;
  description?: unknown | undefined;
  url?: unknown | undefined;
  siteName?: unknown | undefined;
  site_name?: unknown | undefined;
  domain?: unknown | undefined;
  source?: unknown | undefined;
  canonicalUrl?: unknown | undefined;
  canonical_url?: unknown | undefined;
  image?: unknown | undefined;
  imageUrl?: unknown | undefined;
  image_url?: unknown | undefined;
  images?: unknown | undefined;
  favicon?: unknown | undefined;
  favicons?: unknown | undefined;
  ogImage?: unknown | undefined;
  og_image?: unknown | undefined;
  thumbnailUrl?: unknown | undefined;
  thumbnail_url?: unknown | undefined;
  author?: unknown | undefined;
  byline?: unknown | undefined;
  publishedTime?: unknown | undefined;
  published_time?: unknown | undefined;
  datePublished?: unknown | undefined;
  date_published?: unknown | undefined;
  mediaType?: unknown | undefined;
  type?: unknown | undefined;
  [key: string]: unknown;
}

export interface OpenGraphPreviewProps {
  readonly href: string;
  readonly preview?: OpenGraphPreviewData | null | undefined;
  readonly variant?: LinkPreviewVariant | undefined;
  readonly imageOnly?: boolean | undefined;
  readonly hideActions?: boolean | undefined;
}

export type MaybeRecord = Record<string, unknown>;
export type RoutedPreviewCardProps = {
  readonly href: string;
  readonly effectiveHref: string;
  readonly linkTarget: "_blank" | undefined;
  readonly linkRel: string | undefined;
  readonly variant: LinkPreviewVariant;
  readonly hideActions: boolean;
};

export type FirstPartyOpenGraphPreviewKind = "profile" | "drop" | "wave";
