import { matchesDomainOrSubdomain } from "@/lib/url/domains";

const TWITTER_DOMAINS = ["twitter.com", "x.com"] as const;

const findTweetId = (segments: readonly string[]): string | null => {
  if (segments.length === 0) {
    return null;
  }

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]?.toLowerCase();
    if (!segment || (segment !== "status" && segment !== "statuses")) {
      continue;
    }

    const candidate = segments[index + 1];
    if (!candidate) {
      continue;
    }

    const sanitized = candidate.split(/[?#]/, 1)[0];
    if (sanitized && /^\d+$/.test(sanitized)) {
      return sanitized;
    }
  }

  return null;
};

const getPathSegments = (value: string): string[] =>
  value
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

export const parseTwitterLink = (href: string): { href: string; tweetId: string } | null => {
  let url: URL;

  try {
    url = new URL(href);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  const isSupportedHost = TWITTER_DOMAINS.some((domain) =>
    matchesDomainOrSubdomain(hostname, domain)
  );

  if (!isSupportedHost) {
    return null;
  }

  const pathnameSegments = getPathSegments(url.pathname);
  let tweetId = findTweetId(pathnameSegments);

  if (!tweetId && url.hash) {
    const hashPath = url.hash.replace(/^#!/, "");
    const hashSegments = getPathSegments(hashPath);
    tweetId = findTweetId(hashSegments);
  }

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

export { TWITTER_DOMAINS };
