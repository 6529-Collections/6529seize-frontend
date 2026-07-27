import { matchesDomainOrSubdomain } from "@/lib/url/domains";

import { isSafeTwitterImageUrl } from "./media-url";
import type { TweetPreviewArticle } from "./types";

interface SyndicationArticleResult {
  readonly article?: TweetPreviewArticle;
  readonly redirectUrl?: string;
}

const readRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;

const readString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isNumericId = (value: string): boolean => /^\d+$/u.test(value);

const readArticle = (
  record: Record<string, unknown>
): TweetPreviewArticle | undefined => {
  const article = readRecord(record["article"]);
  const restId = readString(article?.["rest_id"]);
  const title = readString(article?.["title"]);
  if (!article || !restId || !isNumericId(restId) || !title) {
    return undefined;
  }

  const mediaInfo = readRecord(
    readRecord(article["cover_media"])?.["media_info"]
  );
  const coverImageCandidate = readString(mediaInfo?.["original_img_url"]);
  const coverImageUrl =
    coverImageCandidate && isSafeTwitterImageUrl(coverImageCandidate)
      ? coverImageCandidate
      : undefined;
  const previewText = readString(article["preview_text"]);

  return {
    // X exposes this stable canonical path alongside the numeric article ID.
    url: `https://x.com/i/article/${restId}`,
    title,
    ...(previewText ? { previewText } : {}),
    ...(coverImageUrl ? { coverImageUrl } : {}),
  };
};

const isMatchingArticleEntity = (
  value: unknown,
  article: TweetPreviewArticle
): boolean => {
  const expandedUrl = readString(readRecord(value)?.["expanded_url"]);
  if (!expandedUrl) {
    return false;
  }

  try {
    const parsedExpandedUrl = new URL(expandedUrl);
    const parsedArticleUrl = new URL(article.url);
    return (
      matchesDomainOrSubdomain(parsedExpandedUrl.hostname, "x.com") &&
      parsedExpandedUrl.pathname === parsedArticleUrl.pathname
    );
  } catch {
    return false;
  }
};

const findArticleRedirectUrl = (
  entities: Record<string, unknown>,
  article: TweetPreviewArticle
): string | undefined => {
  const urls: readonly unknown[] = Array.isArray(entities["urls"])
    ? entities["urls"]
    : [];
  const entity = urls.find((candidate) =>
    isMatchingArticleEntity(candidate, article)
  );
  return readString(readRecord(entity)?.["url"]);
};

export function parseSyndicationArticle(
  record: Record<string, unknown>,
  entities: Record<string, unknown>
): SyndicationArticleResult {
  const article = readArticle(record);
  if (!article) {
    return {};
  }

  const redirectUrl = findArticleRedirectUrl(entities, article);
  return {
    article,
    ...(redirectUrl ? { redirectUrl } : {}),
  };
}
