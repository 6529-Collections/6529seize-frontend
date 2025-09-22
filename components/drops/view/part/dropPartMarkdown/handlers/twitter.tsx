import { renderTweetEmbed } from "../renderers";
import type { LinkHandler } from "../linkTypes";

interface TwitterMatchResult {
  readonly href: string;
  readonly tweetId: string;
}

const twitterRegex =
  /https:\/\/(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/;

const parseTwitterLink = (href: string): TwitterMatchResult | null => {
  const match = href.match(twitterRegex);
  if (!match) {
    return null;
  }

  const tweetId = match[2];
  if (!tweetId) {
    return null;
  }

  return { href, tweetId };
};

export const createTwitterHandler = (): LinkHandler<TwitterMatchResult> => ({
  match: parseTwitterLink,
  render: (payload) => renderTweetEmbed(payload),
  display: "block",
});

export type TwitterHandler = ReturnType<typeof createTwitterHandler>;
