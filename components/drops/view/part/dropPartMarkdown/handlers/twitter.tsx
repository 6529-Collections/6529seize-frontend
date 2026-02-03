import { renderTweetEmbed } from "../renderers";
import { isTwitterLink } from "../twitter";
import type { LinkHandler } from "../linkTypes";
import type { TweetPreviewMode } from "@/components/tweets/TweetPreviewModeContext";

export const createTwitterHandler = (options?: {
  readonly tweetPreviewMode?: TweetPreviewMode;
}): LinkHandler => ({
  match: isTwitterLink,
  render: (href) => renderTweetEmbed(href, options),
  display: "block",
});
