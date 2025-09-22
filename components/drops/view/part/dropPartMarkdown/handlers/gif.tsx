import { renderGifEmbed } from "../renderers";
import type { LinkHandler } from "../linkTypes";

const gifRegex = /^https?:\/\/media\.tenor\.com\/[^\s]+\.gif$/i;

const parseGifLink = (href: string): string | null =>
  gifRegex.test(href) ? href : null;

export const createGifHandler = (): LinkHandler<string> => ({
  match: parseGifLink,
  render: (url) => renderGifEmbed(url),
  display: "block",
});

export type GifHandler = ReturnType<typeof createGifHandler>;
