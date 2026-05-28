import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";

export type CurationWavePreviewCardVariant = "hovercard" | "sheet";

export interface CurationWavePreviewCardProps {
  readonly waveId: string;
  readonly profileIdentity?: string | null | undefined;
  readonly fallbackName?: string | null | undefined;
  readonly fallbackPfp?: string | null | undefined;
  readonly variant?: CurationWavePreviewCardVariant | undefined;
}

export interface PreviewNftLink {
  readonly url_in_text: string;
  readonly data?: {
    readonly name?: string | null | undefined;
    readonly media_uri?: string | null | undefined;
    readonly media_preview?: {
      readonly status?: string | null | undefined;
      readonly kind?: string | null | undefined;
      readonly card_url?: string | null | undefined;
      readonly small_url?: string | null | undefined;
      readonly thumb_url?: string | null | undefined;
      readonly width?: number | null | undefined;
      readonly height?: number | null | undefined;
      readonly mime_type?: string | null | undefined;
    } | null;
  } | null;
}

export interface PreviewDropContent {
  readonly id: string;
  readonly title?: string | null | undefined;
  readonly nft_links?: readonly PreviewNftLink[] | undefined;
  readonly parts: readonly PreviewDropPart[];
}

export interface PreviewDropPart {
  readonly content?: string | null | undefined;
  readonly media: readonly ApiDropMedia[];
  readonly attachments?: ReadonlyArray<{
    readonly file_name?: string | null | undefined;
  }>;
  readonly quoted_drop?: {
    readonly drop?: PreviewDropContent | null | undefined;
  } | null;
}

export interface PreviewDrop extends PreviewDropContent {
  readonly wave?: {
    readonly name?: string | null | undefined;
    readonly picture?: string | null | undefined;
  };
}

export interface PreviewMedia {
  readonly url: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly isVideo: boolean;
}

export type PreviewItem =
  | {
      readonly kind: "media";
      readonly key: string;
      readonly media: PreviewMedia;
      readonly mediaCount: number;
      readonly showLinkHint: boolean;
      readonly text: string | null;
    }
  | {
      readonly kind: "link";
      readonly key: string;
      readonly host: string;
      readonly text: string;
      readonly url: string;
    }
  | {
      readonly inlineUrl: string | null;
      readonly isEmojiOnly: boolean;
      readonly isShortText: boolean;
      readonly kind: "text";
      readonly key: string;
      readonly linkHost: string | null;
      readonly text: string;
    };
