import { renderGifEmbed } from "../renderers";
import type { LinkHandler } from "../linkTypes";

const TENOR_HOST = "media.tenor.com";

const isTenorGif = (href: string): boolean => {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    if (hostname !== TENOR_HOST) {
      return false;
    }

    const pathname = url.pathname.toLowerCase();
    return pathname.endsWith(".gif");
  } catch {
    return false;
  }
};

export const createGifHandler = (): LinkHandler => ({
  match: isTenorGif,
  render: (href) => renderGifEmbed(href),
  display: "block",
});
