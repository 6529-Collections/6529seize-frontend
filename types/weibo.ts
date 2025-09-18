export type WeiboVerificationBadge = "blue" | "yellow" | "enterprise" | "none";

export interface WeiboBaseResponse {
  readonly requestUrl?: string | null;
  readonly url?: string | null;
  readonly canonicalUrl?: string | null;
  readonly contentType?: string | null;
  readonly [key: string]: unknown;
}

export interface WeiboPostMedia {
  readonly url: string;
  readonly alt: string;
}

export interface WeiboPostVideo {
  readonly thumbnail: string | null;
}

export interface WeiboAuthor {
  readonly displayName: string | null;
  readonly avatar: string | null;
  readonly verified: WeiboVerificationBadge;
}

export interface WeiboPostData {
  readonly uid: string | null;
  readonly mid: string | null;
  readonly author: WeiboAuthor;
  readonly createdAt: string | null;
  readonly text: string;
  readonly images?: readonly WeiboPostMedia[] | null;
  readonly video?: WeiboPostVideo | null;
}

export interface WeiboProfileData {
  readonly uid: string | null;
  readonly displayName: string | null;
  readonly avatar: string | null;
  readonly banner: string | null;
  readonly bio: string | null;
  readonly verified: WeiboVerificationBadge;
}

export interface WeiboTopicData {
  readonly title: string | null;
  readonly cover: string | null;
  readonly description: string | null;
}

export interface WeiboPostResponse extends WeiboBaseResponse {
  readonly type: "weibo.post";
  readonly canonicalUrl: string;
  readonly post: WeiboPostData;
}

export interface WeiboProfileResponse extends WeiboBaseResponse {
  readonly type: "weibo.profile";
  readonly canonicalUrl: string;
  readonly profile: WeiboProfileData;
}

export interface WeiboTopicResponse extends WeiboBaseResponse {
  readonly type: "weibo.topic";
  readonly canonicalUrl: string;
  readonly topic: WeiboTopicData;
}

export interface WeiboUnavailableResponse extends WeiboBaseResponse {
  readonly type: "weibo.unavailable";
  readonly canonicalUrl: string;
  readonly reason: "login_required" | "removed" | "rate_limited" | "error";
}

export type WeiboCardResponse =
  | WeiboPostResponse
  | WeiboProfileResponse
  | WeiboTopicResponse
  | WeiboUnavailableResponse;
