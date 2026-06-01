import { markdownToPlainText } from "@/helpers/waves/waveDescriptionPreview";
import type { PreviewDrop, PreviewDropContent, PreviewItem } from "./types";
import { getDropMedia } from "./mediaExtraction";
import { getTrimmedText } from "./utils";

const PREVIEW_ITEM_LIMIT = 4;
const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/gi;
const REDUNDANT_LINK_HOSTS = new Set([
  "mobile.twitter.com",
  "t.co",
  "twitter.com",
  "x.com",
]);
const TRAILING_URL_PUNCTUATION = "),.;!?";

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  let end = trimmed.length;

  while (
    end > 0 &&
    TRAILING_URL_PUNCTUATION.includes(trimmed.charAt(end - 1))
  ) {
    end -= 1;
  }

  return trimmed.slice(0, end);
};

const extractUrls = (...values: readonly (string | null | undefined)[]) => {
  const urls = new Set<string>();

  for (const value of values) {
    for (const match of value?.match(URL_PATTERN) ?? []) {
      const url = normalizeUrl(match);
      if (url.length > 0) {
        urls.add(url);
      }
    }
  }

  return [...urls];
};

const stripUrls = (text: string): string | null =>
  getTrimmedText(
    text
      .replace(URL_PATTERN, "")
      .replace(/\(\s*\)/g, "")
      .replace(/\s+/g, " ")
  );

const getUrlHost = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
};

const getUrlPathLabel = (url: string): string => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/^\/+/, "");
    return path.length > 0 ? `${host}/${path}` : host;
  } catch {
    return url;
  }
};

const getWordCount = (text: string): number =>
  text.split(/\s+/).filter((word) => word.length > 0).length;

const isTrivialLinkText = (textWithoutUrls: string | null): boolean =>
  textWithoutUrls === null ||
  textWithoutUrls.length <= 30 ||
  getWordCount(textWithoutUrls) <= 6;

const isEmojiOnlyText = (text: string): boolean =>
  /^[\p{Extended_Pictographic}\uFE0F\u200D\s]+$/u.test(text);

const getPlainText = (value?: string | null): string | null =>
  getTrimmedText(markdownToPlainText(value ?? ""));

const getDropDisplayText = (drop: PreviewDropContent): string | null => {
  const title = getTrimmedText(drop.title);
  const content =
    drop.parts.flatMap((part) => {
      const plainText = getPlainText(part.content);
      return plainText ? [plainText] : [];
    })[0] ?? null;

  if (title !== null && content !== null && title !== content) {
    return `${title}: ${content}`;
  }

  return title ?? content;
};

const getAttachmentFallbackText = (drop: PreviewDropContent): string | null =>
  drop.parts
    .flatMap((part) => part.attachments ?? [])
    .map((attachment) => getTrimmedText(attachment.file_name))
    .find((fileName) => fileName !== null) ?? null;

const getQuotedDrop = (drop: PreviewDropContent): PreviewDropContent =>
  drop.parts.find((part) => part.quoted_drop?.drop)?.quoted_drop?.drop ?? drop;

const getLinkHintUrl = (
  urls: readonly string[],
  rawText: string | null
): string | null =>
  urls.find((url) => {
    const host = getUrlHost(url);
    if (host === null || REDUNDANT_LINK_HOSTS.has(host)) {
      return false;
    }

    return rawText?.includes(url) !== true;
  }) ?? null;

const getPrimaryLink = (
  drop: PreviewDropContent,
  urls: readonly string[],
  textWithoutUrls: string | null
) => {
  const url = urls.at(0) ?? getTrimmedText(drop.nft_links?.[0]?.url_in_text);
  if (url === null) {
    return null;
  }

  const host = getUrlHost(url);
  if (host === null) {
    return null;
  }

  const title =
    getTrimmedText(drop.nft_links?.[0]?.data?.name) ??
    textWithoutUrls ??
    getUrlPathLabel(url);

  return { host, title, url };
};

const classifyDrop = (inputDrop: PreviewDrop): PreviewItem | null => {
  const drop = getQuotedDrop(inputDrop);
  const rawText = getDropDisplayText(drop);
  const rawContents = drop.parts.map((part) => part.content ?? "");
  const urls = extractUrls(
    rawText,
    ...rawContents,
    ...(drop.nft_links?.map((link) => link.url_in_text) ?? [])
  );
  const textWithoutUrls =
    rawText === null ? getAttachmentFallbackText(drop) : stripUrls(rawText);
  const media = getDropMedia(drop, urls);
  const primaryMedia = media[0] ?? null;
  const hasMeaningfulText = textWithoutUrls !== null;

  if (primaryMedia !== null) {
    return {
      kind: "media",
      key: `${drop.id}-${primaryMedia.sourceUrl}`,
      media: primaryMedia,
      mediaCount: media.length,
      showLinkHint: hasMeaningfulText && getLinkHintUrl(urls, rawText) !== null,
      text: hasMeaningfulText ? textWithoutUrls : null,
    };
  }

  if (urls.length > 0 && isTrivialLinkText(textWithoutUrls)) {
    const primaryLink = getPrimaryLink(drop, urls, textWithoutUrls);
    if (primaryLink !== null) {
      return {
        kind: "link",
        key: `${drop.id}-${primaryLink.url}`,
        host: primaryLink.host,
        text: primaryLink.title,
        url: primaryLink.url,
      };
    }
  }

  if (textWithoutUrls !== null) {
    const inlineUrl = urls[0] ?? null;
    const linkHost = inlineUrl === null ? null : getUrlHost(inlineUrl);

    return {
      kind: "text",
      key: `${drop.id}-text`,
      inlineUrl,
      isEmojiOnly: isEmojiOnlyText(textWithoutUrls),
      isShortText: textWithoutUrls.length < 60,
      linkHost,
      text: textWithoutUrls,
    };
  }

  return null;
};

export const getPreviewItems = (drops: readonly PreviewDrop[]): PreviewItem[] =>
  drops
    .map(classifyDrop)
    .filter((item): item is PreviewItem => item !== null)
    .slice(0, PREVIEW_ITEM_LIMIT);
