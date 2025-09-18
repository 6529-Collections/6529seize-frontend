import type { LinkPreviewMedia, LinkPreviewResponse } from "@/services/api/link-preview-api";

export interface NostrPointerBase {
  readonly relays?: readonly string[];
}

export interface NostrNotePointer extends NostrPointerBase {
  readonly id: string;
}

export interface NostrProfilePointer extends NostrPointerBase {
  readonly pubkey: string;
}

export interface NostrArticlePointer extends NostrPointerBase {
  readonly kind: 30023;
  readonly pubkey: string;
  readonly identifier: string;
}

export interface NostrAuthorInfo {
  readonly pubkey: string;
  readonly name: string | null;
  readonly handle: string | null;
  readonly avatar: string | null;
  readonly verifiedNip05: boolean;
}

export interface NostrImageInfo extends LinkPreviewMedia {
  readonly url: string;
  readonly alt?: string | null;
}

export interface NostrNoteResponse extends LinkPreviewResponse {
  readonly type: "nostr.note";
  readonly canonicalUrl: string | null;
  readonly pointer: NostrNotePointer;
  readonly author: NostrAuthorInfo | null;
  readonly createdAt: string | null;
  readonly text: string | null;
  readonly images: readonly NostrImageInfo[];
  readonly labels: readonly string[];
  readonly links: { readonly open: string | null };
}

export interface NostrProfileResponse extends LinkPreviewResponse {
  readonly type: "nostr.profile";
  readonly canonicalUrl: string | null;
  readonly pointer: NostrProfilePointer;
  readonly profile: {
    readonly name: string | null;
    readonly handle: string | null;
    readonly about: string | null;
    readonly avatar: string | null;
    readonly banner: string | null;
    readonly verifiedNip05: boolean;
  };
}

export interface NostrArticleResponse extends LinkPreviewResponse {
  readonly type: "nostr.article";
  readonly canonicalUrl: string | null;
  readonly pointer: NostrArticlePointer;
  readonly author: NostrAuthorInfo | null;
  readonly article: {
    readonly title: string | null;
    readonly summary: string | null;
    readonly image: string | null;
  };
  readonly createdAt: string | null;
  readonly links: { readonly open: string | null };
}

export interface NostrSecretRedactedResponse extends LinkPreviewResponse {
  readonly type: "nostr.secret_redacted";
  readonly message: string;
}

export interface NostrUnavailableResponse extends LinkPreviewResponse {
  readonly type: "nostr.unavailable";
  readonly message: string;
  readonly links?: { readonly open?: string | null };
}

export type NostrCardResponse =
  | NostrNoteResponse
  | NostrProfileResponse
  | NostrArticleResponse
  | NostrSecretRedactedResponse
  | NostrUnavailableResponse;

export const isNostrCardResponse = (
  value: unknown
): value is NostrCardResponse => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const type = (value as { readonly type?: unknown }).type;
  return typeof type === "string" && type.startsWith("nostr.");
};
