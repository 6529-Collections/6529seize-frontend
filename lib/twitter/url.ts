import { matchesDomainOrSubdomain } from "@/lib/url/domains";

export const TWITTER_DOMAINS = ["twitter.com", "x.com"] as const;

interface TweetUrlParts {
  readonly tweetId: string;
  readonly href: string;
  readonly authorHandle?: string;
}

const findTweetId = (segments: readonly string[]): string | undefined => {
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]?.toLowerCase();
    if (segment !== "status" && segment !== "statuses") {
      continue;
    }

    const candidate = segments[index + 1]?.split(/[?#]/, 1)[0];
    if (candidate && /^\d+$/.test(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

const getPathSegments = (value: string): string[] =>
  value
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

const getAuthorHandle = (segments: readonly string[]): string | undefined => {
  const [firstSegment] = segments;
  if (!firstSegment || firstSegment.toLowerCase() === "i") {
    return undefined;
  }

  return firstSegment;
};

export const parseTweetUrl = (href: string): TweetUrlParts | undefined => {
  let url: URL;

  try {
    url = new URL(href);
  } catch {
    return undefined;
  }

  const hostname = url.hostname.toLowerCase();
  const isSupportedHost = TWITTER_DOMAINS.some((domain) =>
    matchesDomainOrSubdomain(hostname, domain)
  );

  if (!isSupportedHost) {
    return undefined;
  }

  const pathnameSegments = getPathSegments(url.pathname);
  const tweetId = findTweetId(pathnameSegments);
  if (tweetId) {
    const authorHandle = getAuthorHandle(pathnameSegments);
    return {
      tweetId,
      href,
      ...(authorHandle ? { authorHandle } : {}),
    };
  }

  if (!url.hash) {
    return undefined;
  }

  const hashPath = url.hash.replace(/^#!/, "");
  const hashSegments = getPathSegments(hashPath);
  const hashTweetId = findTweetId(hashSegments);
  if (!hashTweetId) {
    return undefined;
  }

  const authorHandle = getAuthorHandle(hashSegments);
  return {
    tweetId: hashTweetId,
    href,
    ...(authorHandle ? { authorHandle } : {}),
  };
};

export const extractTweetId = (href: string): string | undefined =>
  parseTweetUrl(href)?.tweetId;
