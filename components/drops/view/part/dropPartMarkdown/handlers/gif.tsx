import { renderGifEmbed } from "../renderers";
import type { LinkHandler } from "../linkTypes";
import type { LinkPreviewVariant } from "@/components/waves/LinkPreviewContext";

const TENOR_HOST = "media.tenor.com";
const GIPHY_MEDIA_HOST_REGEX = /^media\d*\.giphy\.com$/;

const isSupportedGif = (href: string): boolean => {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    if (hostname !== TENOR_HOST && !GIPHY_MEDIA_HOST_REGEX.test(hostname)) {
      return false;
    }

    const pathname = url.pathname.toLowerCase();
    return pathname.endsWith(".gif");
  } catch {
    return false;
  }
};

export const createGifHandler = (options?: {
  readonly linkPreviewVariant?: LinkPreviewVariant;
}): LinkHandler => ({
  match: isSupportedGif,
  render: (href) =>
    renderGifEmbed(href, {
      fixedSize: options?.linkPreviewVariant !== "home",
    }),
  display: "block",
});
