import { renderGifEmbed } from "../renderers";
import type { LinkHandler } from "../linkTypes";

const gifRegex = /^https?:\/\/media\.tenor\.com\/[^\s]+\.gif$/i;

export const createGifHandler = (): LinkHandler => ({
  match: (href) => gifRegex.test(href),
  render: (href) => renderGifEmbed(href),
  display: "block",
});
