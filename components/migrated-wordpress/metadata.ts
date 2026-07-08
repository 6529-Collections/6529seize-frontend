import type { Metadata } from "next";

import {
  getAppMetadata,
  LARGE_IMAGE_TWITTER_CARD,
} from "@/components/providers/metadata";
import type { PageSSRMetadata } from "@/helpers/Types";

import type { MigratedWordPressArticleMedia } from "./types";

type MigratedWordPressPageMetadataContent = {
  readonly title: string;
  readonly description: string;
  readonly heroImage?: MigratedWordPressArticleMedia;
};

const getHeroImageMetadata = (
  heroImage?: MigratedWordPressArticleMedia
): Partial<PageSSRMetadata> => {
  if (!heroImage) {
    return {};
  }

  return {
    ogImage: heroImage.src,
    ogImageAlt: heroImage.alt,
    ...(heroImage.height === undefined
      ? {}
      : { ogImageHeight: heroImage.height }),
    ...(heroImage.width === undefined ? {} : { ogImageWidth: heroImage.width }),
  };
};

export function getMigratedWordPressPageMetadata(
  content: MigratedWordPressPageMetadataContent
): Metadata {
  return getAppMetadata({
    title: `${content.title} - 6529.io`,
    description: content.description,
    twitterCard: LARGE_IMAGE_TWITTER_CARD,
    ...getHeroImageMetadata(content.heroImage),
  });
}
