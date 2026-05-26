export interface TweetPreviewMedia {
  readonly type: "image" | "video";
  readonly imageUrl?: string;
  readonly videoUrl?: string;
  readonly posterUrl?: string;
  readonly captionsUrl?: string;
}

export interface TweetPreview {
  readonly tweetId: string;
  readonly url: string;
  readonly authorName?: string;
  readonly authorUrl?: string;
  readonly authorHandle?: string;
  readonly authorProfileImageUrl?: string;
  readonly replyToHandle?: string;
  readonly text?: string;
  readonly mediaLink?: string;
  readonly mediaImageUrl?: string;
  readonly mediaVideoUrl?: string;
  readonly mediaPosterUrl?: string;
  readonly mediaCaptionsUrl?: string;
  readonly media?: readonly TweetPreviewMedia[];
  readonly createdAtText?: string;
  readonly createdAtIso?: string;
  readonly favoriteCount?: number;
  readonly conversationCount?: number;
  readonly retweetCount?: number;
  readonly bookmarkCount?: number;
  readonly viewCount?: number;
}

export interface TwitterOEmbedResponse {
  readonly url?: string;
  readonly author_name?: string;
  readonly author_url?: string;
  readonly html?: string;
}
