const FARCASTER_HOSTS = new Set(["warpcast.com", "farcaster.xyz"]);

const PROFILE_BLOCKED_SEGMENTS = new Set([
  "likes",
  "recasters",
  "followers",
  "casts",
  "reactions",
]);

export type FarcasterResourceIdentifier =
  | FarcasterCastIdentifier
  | FarcasterProfileIdentifier
  | FarcasterChannelIdentifier;

interface FarcasterCastIdentifier {
  readonly type: "cast";
  readonly canonicalUrl: string;
  readonly castHash: string;
  readonly username?: string;
  readonly channel?: string | null;
}

interface FarcasterProfileIdentifier {
  readonly type: "profile";
  readonly canonicalUrl: string;
  readonly username: string;
}

interface FarcasterChannelIdentifier {
  readonly type: "channel";
  readonly canonicalUrl: string;
  readonly channel: string;
}

const normalizeHost = (host: string): string => host.replace(/^www\./i, "").toLowerCase();

const normalizePathname = (pathname: string): readonly string[] =>
  pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

const buildCanonicalUrl = (segments: readonly string[]): string =>
  `https://warpcast.com/${segments.join("/")}`;

const isBlockedProfilePath = (segment: string): boolean =>
  PROFILE_BLOCKED_SEGMENTS.has(segment.toLowerCase());

const parseChannelSegments = (
  segments: readonly string[]
): FarcasterResourceIdentifier | null => {
  const [, segment, channel, castHash] = segments;

  if (segment !== "channel" || !channel) {
    return null;
  }

  if (segments.length === 3) {
    return {
      type: "channel",
      channel,
      canonicalUrl: buildCanonicalUrl(["~", "channel", channel]),
    };
  }

  if (segments.length === 4 && castHash) {
    return {
      type: "cast",
      castHash,
      channel,
      canonicalUrl: buildCanonicalUrl(["~", "channel", channel, castHash]),
    };
  }

  return null;
};

const parseUserSegments = (
  segments: readonly string[]
): FarcasterResourceIdentifier | null => {
  const [username, castHash] = segments;

  if (!username || isBlockedProfilePath(username)) {
    return null;
  }

  if (segments.length === 1) {
    return {
      type: "profile",
      username,
      canonicalUrl: buildCanonicalUrl([username]),
    };
  }

  if (segments.length === 2 && castHash && !isBlockedProfilePath(castHash)) {
    return {
      type: "cast",
      username,
      castHash,
      canonicalUrl: buildCanonicalUrl([username, castHash]),
    };
  }

  return null;
};

export const parseFarcasterResource = (
  url: URL
): FarcasterResourceIdentifier | null => {
  const host = normalizeHost(url.hostname);

  if (!FARCASTER_HOSTS.has(host)) {
    return null;
  }

  const segments = normalizePathname(url.pathname);

  if (segments.length === 0) {
    return null;
  }

  if (host === "farcaster.xyz" && segments[0] === "u") {
    return segments.length > 1 ? parseUserSegments(segments.slice(1)) : null;
  }

  if (segments[0] === "~") {
    return parseChannelSegments(segments);
  }

  return parseUserSegments(segments);
};
