const twitterRegex =
  /https:\/\/(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/;

export const parseTwitterLink = (href: string): { href: string; tweetId: string } | null => {
  const match = twitterRegex.exec(href);
  if (!match) {
    return null;
  }

  const tweetId = match[2];
  if (!tweetId) {
    return null;
  }

  return { href, tweetId };
};

export const ensureTwitterLink = (href: string): { href: string; tweetId: string } => {
  const payload = parseTwitterLink(href);
  if (!payload) {
    throw new Error("Invalid Twitter/X link");
  }
  return payload;
};

export const isTwitterLink = (href: string): boolean => parseTwitterLink(href) !== null;
