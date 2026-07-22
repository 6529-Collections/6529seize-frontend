import { publicEnv } from "@/config/env";
import { getAppEnvironment } from "@/config/appEnvironment";
import type { PageSSRMetadata } from "@/helpers/Types";
import type { Metadata } from "next";

export const SOCIAL_CARD_IMAGE_WIDTH = 1200;
export const SOCIAL_CARD_IMAGE_HEIGHT = 630;
export const DEFAULT_OG_IMAGE_PATH = "/6529io.png";
export const DEFAULT_TWITTER_CARD = "summary" as const;
export const LARGE_IMAGE_TWITTER_CARD = "summary_large_image" as const;

type OgImageDescriptor = {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly alt?: string | undefined;
};

type LargeSocialCardMetadata = Omit<
  Partial<PageSSRMetadata>,
  "ogImage" | "ogImageHeight" | "ogImageWidth" | "twitterCard"
> & {
  readonly ogImage: string;
};

type SocialCardQueryValue = string | number | null | undefined;

const getBaseEndpointUrl = (baseEndpoint: string): URL => {
  try {
    return new URL(baseEndpoint);
  } catch {
    return new URL(publicEnv.BASE_ENDPOINT);
  }
};

const appendSocialCardQueryText = (
  params: URLSearchParams,
  key: string,
  value: SocialCardQueryValue
) => {
  if (value === null || value === undefined) {
    return;
  }

  const normalized = String(value).trim();
  if (normalized) {
    params.set(key, normalized);
  }
};

const getSocialCardImagePath = (
  path: string,
  query: Record<string, SocialCardQueryValue>
): string => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) =>
    appendSocialCardQueryText(params, key, value)
  );

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
};

export function getAbsoluteOgImageUrl(
  imagePathOrUrl: string,
  baseEndpoint = publicEnv.BASE_ENDPOINT
): string {
  return new URL(imagePathOrUrl, getBaseEndpointUrl(baseEndpoint)).toString();
}

export function getDefaultOgImageUrl(
  baseEndpoint = publicEnv.BASE_ENDPOINT
): string {
  return getAbsoluteOgImageUrl(DEFAULT_OG_IMAGE_PATH, baseEndpoint);
}

export function getCollectionSocialCardImagePath(
  collection: string,
  options: {
    readonly badge?: SocialCardQueryValue;
    readonly image?: SocialCardQueryValue;
    readonly subtitle?: SocialCardQueryValue;
    readonly title?: SocialCardQueryValue;
  } = {}
): string {
  return getSocialCardImagePath(
    `/api/og-metadata/collections/${encodeURIComponent(collection)}`,
    options
  );
}

export function getNftSocialCardImagePath({
  artist,
  badge,
  collection,
  contract,
  displayId,
  id,
  image,
  subtitle,
  title,
}: {
  readonly artist?: SocialCardQueryValue;
  readonly badge?: SocialCardQueryValue;
  readonly collection?: SocialCardQueryValue;
  readonly contract: string;
  readonly displayId?: SocialCardQueryValue;
  readonly id: string | number;
  readonly image?: SocialCardQueryValue;
  readonly subtitle?: SocialCardQueryValue;
  readonly title?: SocialCardQueryValue;
}): string {
  return getSocialCardImagePath(
    `/api/og-metadata/nfts/${encodeURIComponent(contract)}/${encodeURIComponent(
      String(id)
    )}`,
    {
      artist,
      badge,
      collection,
      displayId,
      image,
      subtitle,
      title,
    }
  );
}

export function getLargeSocialCardMetadata<
  SocialCardMetadata extends LargeSocialCardMetadata,
>(
  metadata: SocialCardMetadata,
  baseEndpoint = publicEnv.BASE_ENDPOINT
): Omit<SocialCardMetadata, "ogImage"> &
  Pick<
    PageSSRMetadata,
    "ogImage" | "ogImageHeight" | "ogImageWidth" | "twitterCard"
  > {
  return {
    ...metadata,
    ogImage: getAbsoluteOgImageUrl(metadata.ogImage, baseEndpoint),
    ogImageHeight: SOCIAL_CARD_IMAGE_HEIGHT,
    ogImageWidth: SOCIAL_CARD_IMAGE_WIDTH,
    twitterCard: LARGE_IMAGE_TWITTER_CARD,
  };
}

const getOpenGraphImages = ({
  ogImage,
  ogImageHeight,
  ogImageWidth,
  ogImageAlt,
}: {
  readonly ogImage: string;
  readonly ogImageHeight?: number | undefined;
  readonly ogImageWidth?: number | undefined;
  readonly ogImageAlt?: string | undefined;
}): string[] | OgImageDescriptor[] => {
  if (
    ogImageHeight === undefined ||
    ogImageWidth === undefined ||
    ogImageHeight <= 0 ||
    ogImageWidth <= 0
  ) {
    return [ogImage];
  }

  const image: OgImageDescriptor = {
    url: ogImage,
    width: ogImageWidth,
    height: ogImageHeight,
  };

  if (ogImageAlt !== undefined && ogImageAlt.trim().length > 0) {
    return [{ ...image, alt: ogImageAlt }];
  }

  return [image];
};

export function getAppMetadata(
  customMetadata?: Partial<PageSSRMetadata>
): Metadata {
  const baseEndpoint = publicEnv.BASE_ENDPOINT;
  const environment = getAppEnvironment(baseEndpoint);

  const title = customMetadata?.title ?? environment.title;
  const description = customMetadata?.description ?? "";
  const ogImage = getAbsoluteOgImageUrl(
    customMetadata?.ogImage ?? DEFAULT_OG_IMAGE_PATH,
    baseEndpoint
  );
  const ogImageHeight = customMetadata?.ogImageHeight;
  const ogImageWidth = customMetadata?.ogImageWidth;
  const twitterCard = customMetadata?.twitterCard ?? DEFAULT_TWITTER_CARD;
  const openGraphImages = getOpenGraphImages({
    ogImage,
    ogImageHeight,
    ogImageWidth,
    ogImageAlt: customMetadata?.ogImageAlt,
  });

  const domain = environment.hostname;

  return {
    title,
    description: description ? `${description} | ${domain}` : domain,
    icons: {
      // Keep SVG last so supporting browsers prefer it over the PNG fallback.
      icon: [
        {
          url: environment.faviconFallback,
          type: "image/png",
          sizes: "96x96",
        },
        { url: environment.favicon, type: "image/svg+xml", sizes: "any" },
      ],
    },
    openGraph: {
      type: "website",
      siteName: "6529.io",
      images: openGraphImages,
      title,
      description: description ? `${description} | ${domain}` : domain,
    },
    twitter: {
      card: twitterCard,
      site: "@6529Collections",
    },
    other: {
      version: publicEnv.VERSION ?? "",
    },
  };
}
