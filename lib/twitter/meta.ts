import { loadHtmlMetadata } from "@/lib/security/htmlMetadata";

import { isImageUrl } from "./media-url";

const META_IMAGE_KEYS = new Set([
  "og:image",
  "twitter:image",
  "twitter:image:src",
]);

export const extractMetaImage = (html: string): string | undefined => {
  const $ = loadHtmlMetadata(html);
  const imageContent = $("meta")
    .toArray()
    .map((element) => $(element))
    .find((tag) => {
      const key = (tag.attr("property") ?? tag.attr("name"))?.toLowerCase();
      return (
        key !== undefined && META_IMAGE_KEYS.has(key) && !!tag.attr("content")
      );
    })
    ?.attr("content")
    ?.trim();
  return imageContent && isImageUrl(imageContent) ? imageContent : undefined;
};
