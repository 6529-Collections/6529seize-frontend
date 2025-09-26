import { renderTweetEmbed } from "../renderers";
import { isTwitterLink } from "../twitter";
import type { LinkHandler } from "../linkTypes";

export const createTwitterHandler = (): LinkHandler => ({
  match: isTwitterLink,
  render: (href) => renderTweetEmbed(href),
  display: "block",
});
