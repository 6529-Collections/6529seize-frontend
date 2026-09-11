import type {
  FarcasterCastPreview,
  FarcasterChannelPreview,
  FarcasterProfilePreview,
} from "@/types/farcaster.types";

export type WarpcastUserResponse = {
  readonly result?:
    | {
        readonly user?:
          | {
              readonly fid?: number | undefined;
              readonly username?: string | undefined;
              readonly displayName?: string | undefined;
              readonly pfp?: { readonly url?: string | undefined } | undefined;
              readonly profile?:
                | {
                    readonly bio?:
                      | { readonly text?: string | undefined }
                      | undefined;
                  }
                | undefined;
            }
          | undefined;
      }
    | undefined;
};

type WarpcastCastEmbed = {
  readonly url?: string | undefined;
  readonly castId?:
    | { readonly fid?: number | undefined; readonly hash?: string | undefined }
    | undefined;
  readonly metadata?: { readonly image?: string | undefined } | undefined;
  readonly type?: string | undefined;
};

type WarpcastCastAuthor = {
  readonly fid?: number | undefined;
  readonly username?: string | undefined;
  readonly displayName?: string | undefined;
  readonly pfp?: { readonly url?: string | undefined } | undefined;
};

export type WarpcastCastResponse = {
  readonly result?:
    | {
        readonly cast?:
          | {
              readonly hash?: string | undefined;
              readonly text?: string | undefined;
              readonly timestamp?: string | undefined;
              readonly embeds?: readonly WarpcastCastEmbed[] | undefined;
              readonly author?: WarpcastCastAuthor | undefined;
              readonly channel?:
                | {
                    readonly id?: string | undefined;
                    readonly name?: string | undefined;
                    readonly imageUrl?: string | undefined;
                  }
                | undefined;
              readonly reactions?:
                | {
                    readonly likes?: number | undefined;
                    readonly recasts?: number | undefined;
                  }
                | undefined;
              readonly replies?:
                | {
                    readonly count?: number | undefined;
                  }
                | undefined;
            }
          | undefined;
      }
    | undefined;
};

export type WarpcastChannelResponse = {
  readonly result?:
    | {
        readonly channel?:
          | {
              readonly id?: string | undefined;
              readonly name?: string | undefined;
              readonly description?: string | undefined;
              readonly imageUrl?: string | undefined;
            }
          | undefined;
        readonly recentCast?:
          | {
              readonly text?: string | undefined;
              readonly author?:
                | {
                    readonly username?: string | undefined;
                  }
                | undefined;
            }
          | undefined;
      }
    | undefined;
};

export const mapWarpcastUser = (
  data: WarpcastUserResponse | null,
  canonicalUrl: string
): FarcasterProfilePreview | null => {
  if (!data?.result?.user) {
    return null;
  }

  const { user } = data.result;

  return {
    type: "profile",
    canonicalUrl,
    profile: {
      fid: typeof user.fid === "number" ? user.fid : undefined,
      username: typeof user.username === "string" ? user.username : undefined,
      displayName:
        typeof user.displayName === "string" ? user.displayName : undefined,
      avatarUrl:
        typeof user.pfp?.url === "string" && user.pfp.url
          ? user.pfp.url
          : undefined,
      bio:
        typeof user.profile?.bio?.text === "string"
          ? user.profile.bio.text
          : undefined,
    },
  };
};

type WarpcastCastData = NonNullable<
  NonNullable<WarpcastCastResponse["result"]>["cast"]
>;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined;

const mapCastEmbed = (
  embed: WarpcastCastEmbed
): NonNullable<FarcasterCastPreview["cast"]["embeds"]>[number] | null => {
  const url = asString(embed.url);
  const type = asString(embed.type);
  const imageUrl = asString(embed.metadata?.image);

  if (!url && !imageUrl) {
    return null;
  }

  if (type === "image" || (imageUrl && !type)) {
    return {
      type: "image",
      url,
      previewImageUrl: imageUrl ?? url,
    };
  }

  return {
    type: "link",
    url,
    previewImageUrl: imageUrl,
  };
};

const mapCastEmbeds = (
  embeds: WarpcastCastData["embeds"]
): FarcasterCastPreview["cast"]["embeds"] => {
  if (!Array.isArray(embeds)) {
    return undefined;
  }

  return embeds
    .map(mapCastEmbed)
    .filter(
      (value): value is NonNullable<ReturnType<typeof mapCastEmbed>> =>
        value !== null
    );
};

const mapCastAuthor = (
  author: WarpcastCastAuthor | undefined
): FarcasterCastPreview["cast"]["author"] => ({
  fid: asNumber(author?.fid),
  username: asString(author?.username),
  displayName: asString(author?.displayName),
  avatarUrl: asString(author?.pfp?.url),
});

const mapCastChannel = (
  channel: WarpcastCastData["channel"]
): FarcasterCastPreview["cast"]["channel"] => {
  if (!channel) {
    return null;
  }

  return {
    id: asString(channel.id),
    name: asString(channel.name),
    iconUrl: asString(channel.imageUrl),
  };
};

const mapCastReactions = (
  reactions: WarpcastCastData["reactions"],
  replies: WarpcastCastData["replies"]
): FarcasterCastPreview["cast"]["reactions"] => ({
  likes: asNumber(reactions?.likes),
  recasts: asNumber(reactions?.recasts),
  replies: asNumber(replies?.count),
});

export const mapWarpcastCast = (
  data: WarpcastCastResponse | null,
  canonicalUrl: string
): FarcasterCastPreview | null => {
  const cast = data?.result?.cast;

  if (!cast) {
    return null;
  }

  return {
    type: "cast",
    canonicalUrl,
    cast: {
      author: mapCastAuthor(cast.author),
      text: asString(cast.text),
      timestamp: asString(cast.timestamp),
      channel: mapCastChannel(cast.channel),
      embeds: mapCastEmbeds(cast.embeds),
      reactions: mapCastReactions(cast.reactions, cast.replies),
    },
  };
};

export const mapWarpcastChannel = (
  data: WarpcastChannelResponse | null,
  canonicalUrl: string
): FarcasterChannelPreview | null => {
  const channel = data?.result?.channel;

  if (!channel) {
    return null;
  }

  const recentCast = data?.result?.recentCast;

  return {
    type: "channel",
    canonicalUrl,
    channel: {
      id: typeof channel.id === "string" ? channel.id : undefined,
      name: typeof channel.name === "string" ? channel.name : undefined,
      description:
        typeof channel.description === "string"
          ? channel.description
          : undefined,
      iconUrl:
        typeof channel.imageUrl === "string" ? channel.imageUrl : undefined,
      latestCast: recentCast
        ? {
            text:
              typeof recentCast.text === "string" ? recentCast.text : undefined,
            author:
              typeof recentCast.author?.username === "string"
                ? recentCast.author.username
                : undefined,
          }
        : null,
    },
  };
};
