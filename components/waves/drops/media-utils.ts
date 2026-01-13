/**
 * Utility functions for handling media in wave drops
 */

/**
 * Determines if a URL is pointing to a video based on extension or source
 */
const isVideoUrl = (url: string): boolean => {
  // Check file extension
  const videoExtensions = [
    ".mp4",
    ".webm",
    ".ogg",
    ".mov",
    ".avi",
    ".wmv",
    ".flv",
    ".mkv",
  ];
  const lowercaseUrl = url.toLowerCase();

  // Check if URL ends with a video extension
  if (videoExtensions.some((ext) => lowercaseUrl.endsWith(ext))) {
    return true;
  }

  // Check for video hosting services
  const videoPatterns = [
    "youtube.com/watch",
    "youtu.be/",
    "vimeo.com/",
    "dailymotion.com/",
    "twitch.tv/",
    "player.vimeo.com",
  ];

  return videoPatterns.some((pattern) => lowercaseUrl.includes(pattern));
};

/**
 * Determines if a MIME type is a video type
 */
export const isVideoMimeType = (mimeType: string): boolean => {
  return mimeType.startsWith("video/");
};

/**
 * Type definition for media
 */
export type MediaItem = {
  alt: string;
  url: string;
  type: "image" | "video";
};

export type DropMediaInput = {
  url: string;
  mime_type: string;
};

/**
 * Type definition for content segments (either text or media)
 */
export type ContentSegment = {
  type: "text" | "media";
  content: string;
  mediaInfo?: MediaItem | undefined;
};

/**
 * Type definition for processed content
 */
export interface ProcessedContent {
  segments: ContentSegment[];
  apiMedia: MediaItem[];
}

/**
 * Extracts media from markdown text and returns segmented content
 */
const extractMediaFromMarkdown = (text: string): ProcessedContent => {
  const mediaPattern = /!\[([^\]]*)\]\(([^\)]+)\)/g;
  const segments: ContentSegment[] = [];

  // Break text into segments of text and media
  let lastIndex = 0;
  let match;

  while ((match = mediaPattern.exec(text)) !== null) {
    // Add text segment before this match if there is any
    if (match.index > lastIndex) {
      const textSegment = text.substring(lastIndex, match.index);
      if (textSegment.trim()) {
        segments.push({ type: "text", content: textSegment.trim() });
      }
    }

    // Add media segment
    const url = match[2];
    const type = isVideoUrl(url!) ? "video" : "image";
    segments.push({
      type: "media",
      content: match[0],
      mediaInfo: { alt: match[1]!, url: url!, type },
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    const textSegment = text.substring(lastIndex);
    if (textSegment.trim()) {
      segments.push({ type: "text", content: textSegment.trim() });
    }
  }

  // Return empty array for apiMedia as we'll add that separately
  return { segments, apiMedia: [] };
};

/**
 * Removes @ square brackets from text (e.g., @[username] -> @username)
 */
const removeSquareBrackets = (text: string): string => {
  return text.replace(/@\[([^\]]+)\]/g, "@$1");
};

/**
 * Processes content by removing square brackets and extracting media
 */
export const processContent = (
  content: string,
  apiMedia: MediaItem[] = []
): ProcessedContent => {
  const withoutBrackets = removeSquareBrackets(content);
  const result = extractMediaFromMarkdown(withoutBrackets);
  result.apiMedia = apiMedia;
  return result;
};

export const buildProcessedContent = (
  content: string | null | undefined,
  media: DropMediaInput[] | null | undefined,
  fallbackText: string = "Media"
): ProcessedContent => {
  const apiMedia: MediaItem[] = (media ?? []).map((item) => ({
    alt: "Media",
    url: item.url,
    type: isVideoMimeType(item.mime_type) ? "video" : ("image" as const),
  }));

  if (!content) {
    return {
      segments: apiMedia.length
        ? []
        : [{ type: "text", content: fallbackText }],
      apiMedia,
    };
  }

  return processContent(content, apiMedia);
};
