import { isImageUrl } from "./media-url";

export const extractMetaImage = (html: string): string | undefined => {
  const match =
    /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/i.exec(
      html
    );
  return match?.[1] && isImageUrl(match[1]) ? match[1] : undefined;
};
