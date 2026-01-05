export type FarcasterPreviewResponse =
  | FarcasterCastPreview
  | FarcasterProfilePreview
  | FarcasterChannelPreview
  | FarcasterFramePreview
  | FarcasterUnavailablePreview
  | FarcasterUnsupportedPreview;

interface FarcasterBasePreview {
  readonly canonicalUrl?: string | undefined;
}

export interface FarcasterCastEmbed {
  readonly type: "image" | "link";
  readonly url?: string | undefined;
  readonly previewImageUrl?: string | undefined;
  readonly alt?: string | undefined;
}

export interface FarcasterCastPreview extends FarcasterBasePreview {
  readonly type: "cast";
  readonly cast: {
    readonly author: {
      readonly fid?: number | undefined;
      readonly username?: string | undefined;
      readonly displayName?: string | undefined;
      readonly avatarUrl?: string | undefined;
    };
    readonly text?: string | undefined;
    readonly timestamp?: string | undefined;
    readonly channel?: {
      readonly id?: string | undefined;
      readonly name?: string | undefined;
      readonly iconUrl?: string | undefined;
    } | null | undefined;
    readonly embeds?: readonly FarcasterCastEmbed[] | undefined;
    readonly reactions?: {
      readonly likes?: number | undefined;
      readonly recasts?: number | undefined;
      readonly replies?: number | undefined;
    } | null | undefined;
  };
}

export interface FarcasterProfilePreview extends FarcasterBasePreview {
  readonly type: "profile";
  readonly profile: {
    readonly fid?: number | undefined;
    readonly username?: string | undefined;
    readonly displayName?: string | undefined;
    readonly avatarUrl?: string | undefined;
    readonly bio?: string | undefined;
  };
}

export interface FarcasterChannelPreview extends FarcasterBasePreview {
  readonly type: "channel";
  readonly channel: {
    readonly id?: string | undefined;
    readonly name?: string | undefined;
    readonly description?: string | undefined;
    readonly iconUrl?: string | undefined;
    readonly latestCast?: {
      readonly text?: string | undefined;
      readonly author?: string | undefined;
    } | null | undefined;
  };
}

export interface FarcasterFramePreview extends FarcasterBasePreview {
  readonly type: "frame";
  readonly frame: {
    readonly frameUrl: string;
    readonly title?: string | undefined;
    readonly siteName?: string | undefined;
    readonly imageUrl?: string | undefined;
    readonly buttons?: readonly string[] | undefined;
    readonly castUrl?: string | undefined;
  };
}

export interface FarcasterUnavailablePreview extends FarcasterBasePreview {
  readonly type: "unavailable";
  readonly reason?: string | undefined;
}

export interface FarcasterUnsupportedPreview extends FarcasterBasePreview {
  readonly type: "unsupported";
  readonly reason?: string | undefined;
}
