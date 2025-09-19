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

export interface FarcasterCastIdentifier {
  readonly type: "cast";
  readonly canonicalUrl: string;
  readonly castHash: string;
  readonly username?: string;
  readonly channel?: string | null;
}

export interface FarcasterProfileIdentifier {
  readonly type: "profile";
  readonly canonicalUrl: string;
  readonly username: string;
}

export interface FarcasterChannelIdentifier {
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

export const isFarcasterHost = (host: string): boolean =>
  FARCASTER_HOSTS.has(normalizeHost(host));

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

  if (segments[0] === "~") {
    if (segments.length < 2) {
      return null;
    }

    const second = segments[1];

    if (second !== "channel") {
      return null;
    }

    if (segments.length === 2) {
      return null;
    }

    const channel = segments[2];

    if (!channel) {
      return null;
    }

    if (segments.length === 3) {
      return {
        type: "channel",
        channel,
        canonicalUrl: buildCanonicalUrl(["~", "channel", channel]),
      };
    }

    if (segments.length === 4) {
      const castHash = segments[3];
      if (!castHash) {
        return null;
      }

      return {
        type: "cast",
        castHash,
        channel,
        canonicalUrl: buildCanonicalUrl(["~", "channel", channel, castHash]),
      };
    }

    return null;
  }

  if (segments.length === 1) {
    const username = segments[0];
    if (!username || isBlockedProfilePath(username)) {
      return null;
    }

    return {
      type: "profile",
      username,
      canonicalUrl: buildCanonicalUrl([username]),
    };
  }

  if (segments.length === 2) {
    const [username, castHash] = segments;
    if (!username || !castHash) {
      return null;
    }

    if (isBlockedProfilePath(castHash)) {
      return null;
    }

    return {
      type: "cast",
      username,
      castHash,
      canonicalUrl: buildCanonicalUrl([username, castHash]),
    };
  }

  return null;
};

export const isPotentialFarcasterUrl = (url: URL): boolean => {
  if (isFarcasterHost(url.hostname)) {
    return true;
  }

  const protocol = url.protocol.toLowerCase();
  return protocol === "http:" || protocol === "https:";
};
