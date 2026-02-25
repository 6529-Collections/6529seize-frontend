import type { TweetPreviewMode } from "@/components/tweets/TweetPreviewModeContext";

import { renderTweetEmbed } from "../renderers";
import { isTwitterLink } from "../twitter";

import type { LinkHandler } from "../linkTypes";

export const createTwitterHandler = (options?: {
  readonly tweetPreviewMode?: TweetPreviewMode;
}): LinkHandler => ({
  match: isTwitterLink,
  render: (href) => renderTweetEmbed(href, options),
  display: "block",
});
