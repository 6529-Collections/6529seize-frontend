import { publicEnv } from "@/config/env";
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

const getBaseEndpointUrl = (baseEndpoint: string): URL => {
  try {
    return new URL(baseEndpoint);
  } catch {
    return new URL(publicEnv.BASE_ENDPOINT);
  }
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

export function getLargeSocialCardMetadata(
  metadata: LargeSocialCardMetadata,
  baseEndpoint = publicEnv.BASE_ENDPOINT
): Partial<PageSSRMetadata> {
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
  if (!ogImageHeight || !ogImageWidth) {
    return [ogImage];
  }

  const image: OgImageDescriptor = {
    url: ogImage,
    width: ogImageWidth,
    height: ogImageHeight,
  };

  if (ogImageAlt) {
    return [{ ...image, alt: ogImageAlt }];
  }

  return [image];
};

export function getAppMetadata(
  customMetadata?: Partial<PageSSRMetadata>
): Metadata {
  const baseEndpoint = publicEnv.BASE_ENDPOINT;
  const isStaging = baseEndpoint.includes("staging");

  const title =
    customMetadata?.title ?? (isStaging ? "6529 Staging" : "6529.io");
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

  const domain = isStaging ? "staging.6529.io" : "6529.io";

  return {
    title,
    description: description ? `${description} | ${domain}` : domain,
    icons: {
      icon: "/favicon.ico",
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
