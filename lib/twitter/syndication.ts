import { matchesDomainOrSubdomain } from "@/lib/url/domains";

import type {
  TweetPreview,
  TweetPreviewMedia,
  TweetPreviewVideoVariant,
} from "./types";

const TWEET_PREVIEW_TEXT_MAX_CHARS = 260;
const DEFAULT_MAX_VIDEO_QUALITY = 1080;

type MutableTweetPreview = {
  -readonly [Key in keyof TweetPreview]: TweetPreview[Key];
};

type MutableTweetPreviewMedia = {
  -readonly [Key in keyof TweetPreviewMedia]: TweetPreviewMedia[Key];
};

export const getSyndicationToken = (tweetId: string): string =>
  ((Number(tweetId) / 1e15) * Math.PI).toString(36).replaceAll(/(0+|\.)/g, "");

const readString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const readNumberish = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return readNumber(value);
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const readRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;

const readArray = (value: unknown): readonly unknown[] =>
  Array.isArray(value) ? value : [];

const normalizeProfileImageUrl = (
  value: string | undefined
): string | undefined => value?.replace("_normal.", "_bigger.");

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const removeTrailingMediaUrl = (
  text: string | undefined,
  mediaLink: string | undefined
): string | undefined => {
  if (!text) {
    return undefined;
  }

  const withoutMedia = mediaLink
    ? text.replace(
        new RegExp(String.raw`\s*${escapeRegExp(mediaLink)}\s*$`),
        ""
      )
    : text;
  const trimmed = withoutMedia.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

type TweetTextResult = {
  readonly text: string;
  readonly expanded: boolean;
};

const readExpandedTweetText = (
  record: Record<string, unknown>
): string | undefined => {
  const noteTweet = readRecord(record["note_tweet"]);
  const noteTweetResult = readRecord(noteTweet?.["note_tweet_results"]);
  const noteTweetResultValue = readRecord(noteTweetResult?.["result"]);
  return (
    readString(noteTweetResultValue?.["text"]) ??
    readString(noteTweet?.["text"]) ??
    readString(readRecord(record["extended_tweet"])?.["full_text"]) ??
    readString(readRecord(record["legacy"])?.["full_text"]) ??
    readString(record["full_text"])
  );
};

const readTweetText = (
  record: Record<string, unknown>
): TweetTextResult | undefined => {
  const expandedText = readExpandedTweetText(record);
  if (expandedText) {
    return { text: expandedText, expanded: true };
  }

  const text = readString(record["text"]);
  return text ? { text, expanded: false } : undefined;
};

const readDisplayTextRange = (
  record: Record<string, unknown>
): readonly [number, number] | undefined => {
  const range = readArray(record["display_text_range"]);
  const [start, end] = range;
  return typeof start === "number" && typeof end === "number"
    ? [start, end]
    : undefined;
};

const applyDisplayTextRange = (
  text: string | undefined,
  range: readonly [number, number] | undefined
): string | undefined => {
  if (!text || !range) {
    return text;
  }

  const [start] = range;
  const sliced = Array.from(text).slice(start).join("").trim();
  return sliced.length > 0 ? sliced : text;
};

const endsLikeCompleteText = (text: string): boolean =>
  /(?:[.!?…"”’)\]]|https?:\/\/\S+)$/u.test(text);

const trimTrailingPreviewPunctuation = (text: string): string => {
  let end = text.length;
  while (end > 0) {
    const char = text[end - 1];
    if (!char) {
      break;
    }
    if (char !== "," && !/\s/u.test(char)) {
      break;
    }
    end -= 1;
  }
  return text.slice(0, end);
};

const appendEllipsisIfTruncated = (
  text: string | undefined,
  expanded: boolean
): string | undefined => {
  if (!text || expanded || text.length < 100 || endsLikeCompleteText(text)) {
    return text;
  }

  return `${trimTrailingPreviewPunctuation(text)}...`;
};

const excerptTweetText = (text: string | undefined): string | undefined => {
  if (!text) {
    return undefined;
  }

  const chars = Array.from(text);
  if (chars.length <= TWEET_PREVIEW_TEXT_MAX_CHARS) {
    return text;
  }

  const candidate = chars.slice(0, TWEET_PREVIEW_TEXT_MAX_CHARS).join("");
  const wordBoundaryIndex = Math.max(
    candidate.lastIndexOf(" "),
    candidate.lastIndexOf("\n")
  );
  const excerpt =
    wordBoundaryIndex > TWEET_PREVIEW_TEXT_MAX_CHARS * 0.75
      ? candidate.slice(0, wordBoundaryIndex)
      : candidate;
  return `${trimTrailingPreviewPunctuation(excerpt)}...`;
};

const isImageUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();
    return (
      matchesDomainOrSubdomain(url.hostname, "twimg.com") ||
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".webp")
    );
  } catch {
    return false;
  }
};

const isTwitterMediaUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return matchesDomainOrSubdomain(url.hostname, "twimg.com");
  } catch {
    return false;
  }
};

const findFirstImageInArray = (
  values: readonly unknown[]
): string | undefined => {
  for (const entry of values) {
    const imageUrl = findFirstImageUrl(entry);
    if (imageUrl) {
      return imageUrl;
    }
  }
  return undefined;
};

const findFirstImageInRecord = (
  record: Record<string, unknown>
): string | undefined => {
  const directImageUrl = findFirstImageInArray(
    ["url", "media_url_https", "media_url", "src"].map((key) => record[key])
  );
  return directImageUrl ?? findFirstImageInArray(Object.values(record));
};

export const findFirstImageUrl = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return isImageUrl(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    return findFirstImageInArray(value);
  }

  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  return findFirstImageInRecord(record);
};

const findMediaImageUrl = (
  record: Record<string, unknown>
): string | undefined => {
  for (const key of ["photos", "mediaDetails"]) {
    const imageUrl = findFirstImageUrl(record[key]);
    if (imageUrl) {
      return imageUrl;
    }
  }

  return undefined;
};

const isMp4VideoVariant = (
  variant: Record<string, unknown>,
  url: string
): boolean => {
  const contentType = (
    readString(variant["content_type"]) ?? readString(variant["type"])
  )?.toLowerCase();
  return contentType === "video/mp4" || url.toLowerCase().endsWith(".mp4");
};

const isHlsVideoVariant = (
  variant: Record<string, unknown>,
  url: string
): boolean => {
  const contentType = (
    readString(variant["content_type"]) ?? readString(variant["type"])
  )?.toLowerCase();
  return (
    contentType === "application/x-mpegurl" ||
    contentType === "application/vnd.apple.mpegurl" ||
    url.toLowerCase().includes(".m3u8")
  );
};

const readVideoDimensionsFromUrl = (
  value: string
): { readonly width: number; readonly height: number } | undefined => {
  const match = /\/(\d{2,5})x(\d{2,5})\//u.exec(value);
  const width = match?.[1] ? Number(match[1]) : undefined;
  const height = match?.[2] ? Number(match[2]) : undefined;
  return width && height ? { width, height } : undefined;
};

const readVideoVariantDimensions = (
  variant: Record<string, unknown>,
  url: string
): { readonly width?: number; readonly height?: number } => {
  const urlDimensions = readVideoDimensionsFromUrl(url);
  const width = readNumberish(variant["width"]) ?? urlDimensions?.width;
  const height = readNumberish(variant["height"]) ?? urlDimensions?.height;
  return {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };
};

const getVariantQuality = (dimensions: {
  readonly width?: number;
  readonly height?: number;
}): number | undefined =>
  dimensions.width && dimensions.height
    ? Math.min(dimensions.width, dimensions.height)
    : undefined;

const readVideoVariant = (
  variant: Record<string, unknown>,
  url: string
): TweetPreviewVideoVariant | undefined => {
  if (!isMp4VideoVariant(variant, url)) {
    return undefined;
  }

  const dimensions = readVideoVariantDimensions(variant, url);
  const quality = getVariantQuality(dimensions);
  const bitrate = readNumberish(variant["bitrate"]);
  return {
    url,
    ...dimensions,
    ...(quality ? { quality } : {}),
    ...(bitrate ? { bitrate } : {}),
  };
};

const compareVideoVariants = (
  left: TweetPreviewVideoVariant,
  right: TweetPreviewVideoVariant
): number => {
  const qualityDelta = (left.quality ?? 0) - (right.quality ?? 0);
  if (qualityDelta !== 0) {
    return qualityDelta;
  }

  const bitrateDelta = (left.bitrate ?? 0) - (right.bitrate ?? 0);
  if (bitrateDelta !== 0) {
    return bitrateDelta;
  }

  const leftPixels = (left.width ?? 0) * (left.height ?? 0);
  const rightPixels = (right.width ?? 0) * (right.height ?? 0);
  return leftPixels - rightPixels;
};

const preferHigherQualityVariant = (
  best: TweetPreviewVideoVariant | undefined,
  variant: TweetPreviewVideoVariant
): TweetPreviewVideoVariant => {
  if (best) {
    return compareVideoVariants(variant, best) > 0 ? variant : best;
  }

  return variant;
};

const preferLowerQualityVariant = (
  lowest: TweetPreviewVideoVariant | undefined,
  variant: TweetPreviewVideoVariant
): TweetPreviewVideoVariant => {
  if (lowest) {
    return compareVideoVariants(variant, lowest) < 0 ? variant : lowest;
  }

  return variant;
};

const getBestVideoVariant = (
  variants: readonly TweetPreviewVideoVariant[]
): TweetPreviewVideoVariant | undefined =>
  variants.reduce<TweetPreviewVideoVariant | undefined>(
    (best, variant) => preferHigherQualityVariant(best, variant),
    undefined
  );

const findDefaultVideoVariant = (
  variants: readonly TweetPreviewVideoVariant[]
): TweetPreviewVideoVariant | undefined => {
  const cappedVariants = variants.filter(
    (variant) =>
      variant.quality !== undefined &&
      variant.quality <= DEFAULT_MAX_VIDEO_QUALITY
  );

  if (cappedVariants.length > 0) {
    return getBestVideoVariant(cappedVariants);
  }

  const qualityVariants = variants.filter(
    (variant) => variant.quality !== undefined
  );
  if (qualityVariants.length > 0) {
    return qualityVariants.reduce<TweetPreviewVideoVariant | undefined>(
      (lowest, variant) => preferLowerQualityVariant(lowest, variant),
      undefined
    );
  }

  return getBestVideoVariant(variants);
};

const sortVideoVariantsForDisplay = (
  variants: readonly TweetPreviewVideoVariant[]
): readonly TweetPreviewVideoVariant[] =>
  [...variants].sort((first, second) => compareVideoVariants(second, first));

const findVideoVariants = (
  variants: readonly unknown[],
  urlKey: "src" | "url"
): readonly TweetPreviewVideoVariant[] => {
  const videoVariants: TweetPreviewVideoVariant[] = [];

  for (const variant of variants) {
    const variantRecord = readRecord(variant);
    const url = readString(variantRecord?.[urlKey]);
    if (!variantRecord || !url || !isTwitterMediaUrl(url)) {
      continue;
    }

    const videoVariant = readVideoVariant(variantRecord, url);
    if (
      videoVariant &&
      !videoVariants.some((candidate) => candidate.url === videoVariant.url)
    ) {
      videoVariants.push(videoVariant);
    }
  }

  return sortVideoVariantsForDisplay(videoVariants);
};

const hasVideoVariantMetadata = (variant: TweetPreviewVideoVariant): boolean =>
  variant.quality !== undefined ||
  variant.width !== undefined ||
  variant.height !== undefined ||
  variant.bitrate !== undefined;

const shouldExposeVideoVariants = (
  variants: readonly TweetPreviewVideoVariant[]
): boolean =>
  variants.length > 1 ||
  variants.some((variant) => hasVideoVariantMetadata(variant));

const findFallbackVideoVariantUrl = (
  variants: readonly unknown[],
  urlKey: "src" | "url"
): string | undefined => {
  for (const variant of variants) {
    const variantRecord = readRecord(variant);
    const url = readString(variantRecord?.[urlKey]);
    if (url && isTwitterMediaUrl(url)) {
      return url;
    }
  }

  return undefined;
};

const findHlsVideoVariantUrl = (
  variants: readonly unknown[],
  urlKey: "src" | "url"
): string | undefined => {
  for (const variant of variants) {
    const variantRecord = readRecord(variant);
    const url = readString(variantRecord?.[urlKey]);
    if (
      variantRecord &&
      url &&
      isTwitterMediaUrl(url) &&
      isHlsVideoVariant(variantRecord, url)
    ) {
      return url;
    }
  }

  return undefined;
};

type TweetVideoResult = {
  readonly videoUrl: string;
  readonly videoHlsUrl?: string;
  readonly videoVariants?: readonly TweetPreviewVideoVariant[];
};

const createVideoResult = (
  variants: readonly unknown[],
  urlKey: "src" | "url"
): TweetVideoResult | undefined => {
  const videoHlsUrl = findHlsVideoVariantUrl(variants, urlKey);
  const videoVariants = findVideoVariants(variants, urlKey);
  const selectedVariant = findDefaultVideoVariant(videoVariants);
  if (selectedVariant) {
    return {
      videoUrl: selectedVariant.url,
      ...(videoHlsUrl ? { videoHlsUrl } : {}),
      ...(shouldExposeVideoVariants(videoVariants) ? { videoVariants } : {}),
    };
  }

  const fallbackUrl = findFallbackVideoVariantUrl(variants, urlKey);
  if (!fallbackUrl) {
    return undefined;
  }

  if (videoHlsUrl) {
    return { videoUrl: fallbackUrl, videoHlsUrl };
  }

  return { videoUrl: fallbackUrl };
};

const findVideoResult = (
  record: Record<string, unknown>
): TweetVideoResult | undefined => {
  const video = readRecord(record["video"]);
  const videoResult = createVideoResult(readArray(video?.["variants"]), "src");
  if (videoResult) {
    return videoResult;
  }

  const mediaDetails = readArray(record["mediaDetails"]);
  for (const mediaDetail of mediaDetails) {
    const videoInfo = readRecord(readRecord(mediaDetail)?.["video_info"]);
    const result = createVideoResult(readArray(videoInfo?.["variants"]), "url");
    if (result) {
      return result;
    }
  }

  return undefined;
};

const findVideoPosterUrl = (
  record: Record<string, unknown>
): string | undefined => {
  const videoPoster = readString(readRecord(record["video"])?.["poster"]);
  return videoPoster ?? findMediaImageUrl(record);
};

const getMediaIdentity = (media: TweetPreviewMedia): string | undefined =>
  media.videoUrl ?? media.imageUrl ?? media.posterUrl;

const pushUniqueMedia = (
  mediaItems: TweetPreviewMedia[],
  media: TweetPreviewMedia | undefined
): void => {
  const identity = media ? getMediaIdentity(media) : undefined;
  if (!media || !identity) {
    return;
  }

  if (!mediaItems.some((item) => getMediaIdentity(item) === identity)) {
    mediaItems.push(media);
  }
};

const createImageMedia = (
  url: string | undefined
): TweetPreviewMedia | undefined =>
  url && isImageUrl(url) && isTwitterMediaUrl(url)
    ? { type: "image", imageUrl: url }
    : undefined;

const createVideoMedia = (
  videoResult: TweetVideoResult | undefined,
  posterUrl: string | undefined
): TweetPreviewMedia | undefined => {
  if (!videoResult) {
    return undefined;
  }

  const media: MutableTweetPreviewMedia = {
    type: "video",
    videoUrl: videoResult.videoUrl,
  };
  if (posterUrl && isTwitterMediaUrl(posterUrl)) {
    media.posterUrl = posterUrl;
  }
  if (videoResult.videoHlsUrl) {
    media.videoHlsUrl = videoResult.videoHlsUrl;
  }
  if (videoResult.videoVariants) {
    media.videoVariants = videoResult.videoVariants;
  }

  return media;
};

const readMediaDetailImageUrl = (
  mediaDetail: Record<string, unknown>
): string | undefined =>
  readString(mediaDetail["media_url_https"]) ??
  readString(mediaDetail["media_url"]) ??
  readString(mediaDetail["url"]) ??
  findFirstImageUrl(mediaDetail);

const readMediaDetail = (
  mediaDetail: Record<string, unknown>
): TweetPreviewMedia | undefined => {
  const videoInfo = readRecord(mediaDetail["video_info"]);
  const videoResult = createVideoResult(
    readArray(videoInfo?.["variants"]),
    "url"
  );
  const imageUrl = readMediaDetailImageUrl(mediaDetail);
  const imageMedia = createImageMedia(imageUrl);
  return createVideoMedia(videoResult, imageMedia?.imageUrl) ?? imageMedia;
};

const findMediaItems = (
  record: Record<string, unknown>
): readonly TweetPreviewMedia[] => {
  const mediaItems: TweetPreviewMedia[] = [];
  const mediaDetails = readArray(record["mediaDetails"]);

  for (const mediaDetail of mediaDetails) {
    const mediaDetailRecord = readRecord(mediaDetail);
    if (mediaDetailRecord) {
      pushUniqueMedia(mediaItems, readMediaDetail(mediaDetailRecord));
    }
  }

  if (mediaDetails.length > 0) {
    return mediaItems;
  }

  for (const photo of readArray(record["photos"])) {
    const photoRecord = readRecord(photo);
    pushUniqueMedia(
      mediaItems,
      createImageMedia(readString(photoRecord?.["url"]))
    );
  }

  pushUniqueMedia(
    mediaItems,
    createVideoMedia(findVideoResult(record), findVideoPosterUrl(record))
  );

  return mediaItems;
};

const findFirstMedia = (
  mediaItems: readonly TweetPreviewMedia[],
  type: TweetPreviewMedia["type"]
): TweetPreviewMedia | undefined =>
  mediaItems.find((media) => media.type === type);

const firstRecord = (values: readonly unknown[]): Record<string, unknown> =>
  readRecord(values[0]) ?? {};

const getSyndicationEntities = (
  record: Record<string, unknown>
): Record<string, unknown> => readRecord(record["entities"]) ?? {};

const getSyndicationUser = (
  record: Record<string, unknown>
): Record<string, unknown> => readRecord(record["user"]) ?? {};

const getFirstSyndicationMedia = (
  entities: Record<string, unknown>
): Record<string, unknown> => firstRecord(readArray(entities["media"]));

const setPreviewValue = <Key extends keyof TweetPreview>(
  preview: MutableTweetPreview,
  key: Key,
  value: TweetPreview[Key] | undefined
): void => {
  if (value !== undefined) {
    preview[key] = value;
  }
};

export const extractMetaImage = (html: string): string | undefined => {
  const match =
    /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/i.exec(
      html
    );
  return match?.[1] && isImageUrl(match[1]) ? match[1] : undefined;
};

export function parseSyndicationPreview(
  payload: unknown,
  href: string,
  tweetId: string
): TweetPreview | undefined {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  if (record["__typename"] === "Tweet") {
    return buildSyndicationPreview(record, href, tweetId);
  }

  return undefined;
}

function buildSyndicationPreview(
  record: Record<string, unknown>,
  href: string,
  tweetId: string
): TweetPreview {
  const user = getSyndicationUser(record);
  const entities = getSyndicationEntities(record);
  const firstMedia = getFirstSyndicationMedia(entities);
  const authorHandle = readString(user["screen_name"]);
  const mediaLink = readString(firstMedia["url"]);
  const mediaItems = findMediaItems(record);
  const firstImageMedia = findFirstMedia(mediaItems, "image");
  const firstVideoMedia = findFirstMedia(mediaItems, "video");
  const tweetText = readTweetText(record);
  const displayText = appendEllipsisIfTruncated(
    applyDisplayTextRange(tweetText?.text, readDisplayTextRange(record)),
    tweetText?.expanded ?? false
  );
  const previewText = excerptTweetText(displayText);
  const preview: MutableTweetPreview = {
    tweetId,
    url: href,
  };

  setPreviewValue(preview, "authorName", readString(user["name"]));
  setPreviewValue(
    preview,
    "authorUrl",
    authorHandle ? `https://twitter.com/${authorHandle}` : undefined
  );
  setPreviewValue(preview, "authorHandle", authorHandle);
  setPreviewValue(
    preview,
    "replyToHandle",
    readString(record["in_reply_to_screen_name"])
  );
  setPreviewValue(
    preview,
    "authorProfileImageUrl",
    normalizeProfileImageUrl(readString(user["profile_image_url_https"]))
  );
  setPreviewValue(
    preview,
    "text",
    removeTrailingMediaUrl(previewText, mediaLink)
  );
  setPreviewValue(preview, "mediaLink", mediaLink);
  setPreviewValue(
    preview,
    "media",
    mediaItems.length > 0 ? mediaItems : undefined
  );
  setPreviewValue(preview, "mediaImageUrl", firstImageMedia?.imageUrl);
  setPreviewValue(preview, "mediaVideoUrl", firstVideoMedia?.videoUrl);
  setPreviewValue(preview, "mediaVideoHlsUrl", firstVideoMedia?.videoHlsUrl);
  setPreviewValue(preview, "mediaPosterUrl", firstVideoMedia?.posterUrl);
  setPreviewValue(
    preview,
    "mediaVideoVariants",
    firstVideoMedia?.videoVariants
  );
  setPreviewValue(preview, "createdAtIso", readString(record["created_at"]));
  setPreviewValue(
    preview,
    "favoriteCount",
    readNumberish(record["favorite_count"])
  );
  setPreviewValue(
    preview,
    "conversationCount",
    readNumberish(record["conversation_count"])
  );
  setPreviewValue(
    preview,
    "retweetCount",
    readNumberish(record["retweet_count"])
  );
  setPreviewValue(
    preview,
    "bookmarkCount",
    readNumberish(record["bookmark_count"])
  );
  setPreviewValue(preview, "viewCount", readNumberish(record["view_count"]));

  return preview;
}
