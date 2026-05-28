import { renderTweetEmbed } from "../renderers";
import { isTwitterLink } from "../twitter";
import type { LinkHandler } from "../linkTypes";

export const createTwitterHandler = (options?: {
  readonly fullWidth?: boolean | undefined;
}): LinkHandler => ({
  match: isTwitterLink,
  render: (href) => renderTweetEmbed(href, { fullWidth: options?.fullWidth }),
  display: "block",
});
