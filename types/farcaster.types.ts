export type FarcasterPreviewResponse =
  | FarcasterCastPreview
  | FarcasterProfilePreview
  | FarcasterChannelPreview
  | FarcasterFramePreview
  | FarcasterUnavailablePreview
  | FarcasterUnsupportedPreview;

interface FarcasterBasePreview {
  readonly canonicalUrl?: string;
}

export interface FarcasterCastEmbed {
  readonly type: "image" | "link";
  readonly url?: string;
  readonly previewImageUrl?: string;
  readonly alt?: string;
}

export interface FarcasterCastPreview extends FarcasterBasePreview {
  readonly type: "cast";
  readonly cast: {
    readonly author: {
      readonly fid?: number;
      readonly username?: string;
      readonly displayName?: string;
      readonly avatarUrl?: string;
    };
    readonly text?: string;
    readonly timestamp?: string;
    readonly channel?: {
      readonly id?: string;
      readonly name?: string;
      readonly iconUrl?: string;
    } | null;
    readonly embeds?: readonly FarcasterCastEmbed[];
    readonly reactions?: {
      readonly likes?: number;
      readonly recasts?: number;
      readonly replies?: number;
    } | null;
  };
}

export interface FarcasterProfilePreview extends FarcasterBasePreview {
  readonly type: "profile";
  readonly profile: {
    readonly fid?: number;
    readonly username?: string;
    readonly displayName?: string;
    readonly avatarUrl?: string;
    readonly bio?: string;
  };
}

export interface FarcasterChannelPreview extends FarcasterBasePreview {
  readonly type: "channel";
  readonly channel: {
    readonly id?: string;
    readonly name?: string;
    readonly description?: string;
    readonly iconUrl?: string;
    readonly latestCast?: {
      readonly text?: string;
      readonly author?: string;
    } | null;
  };
}

export interface FarcasterFramePreview extends FarcasterBasePreview {
  readonly type: "frame";
  readonly frame: {
    readonly frameUrl: string;
    readonly title?: string;
    readonly siteName?: string;
    readonly imageUrl?: string;
    readonly buttons?: readonly string[];
    readonly castUrl?: string;
  };
}

export interface FarcasterUnavailablePreview extends FarcasterBasePreview {
  readonly type: "unavailable";
  readonly reason?: string;
}

export interface FarcasterUnsupportedPreview extends FarcasterBasePreview {
  readonly type: "unsupported";
  readonly reason?: string;
}
