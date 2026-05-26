import { parseTweetUrl } from "@/lib/twitter";
export { TWITTER_DOMAINS } from "@/lib/twitter";

export const ensureTwitterLink = (
  href: string
): { href: string; tweetId: string } => {
  const payload = parseTweetUrl(href);
  if (!payload) {
    throw new Error("Invalid Twitter/X link");
  }
  return { href: payload.href, tweetId: payload.tweetId };
};

export const isTwitterLink = (href: string): boolean =>
  parseTweetUrl(href) !== undefined;
