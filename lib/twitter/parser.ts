import * as cheerio from "cheerio";

import { matchesDomainOrSubdomain } from "@/lib/url/domains";

import type { TweetPreview, TwitterOEmbedResponse } from "./types";
import { parseTweetUrl } from "./url";

const readString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeUrlCandidate = (value: string): string => {
  const trimmed = value.trim();
  return /^[a-z][a-z\d+\-.]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const normalizeTweetText = (value: string): string | undefined => {
  const normalized = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return readString(normalized);
};

const parseHandleFromUrl = (url: string | undefined): string | undefined => {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    const firstSegment = parsed.pathname
      .split("/")
      .map((segment) => segment.trim())
      .find((segment) => segment.length > 0);
    return firstSegment && firstSegment.toLowerCase() !== "i"
      ? firstSegment
      : undefined;
  } catch {
    return undefined;
  }
};

const findMediaLink = (
  $: ReturnType<typeof cheerio.load>
): string | undefined => {
  const anchors = $("blockquote p a").toArray();
  const mediaAnchor = anchors.find(
    (element: ReturnType<typeof $.root>[number]) => {
      const href = $(element).attr("href") ?? "";
      const text = $(element).text();
      return isPicTwitterUrl(href) || (isTcoUrl(href) && isPicTwitterUrl(text));
    }
  );

  if (!mediaAnchor) {
    return undefined;
  }

  const wrappedAnchor = $(mediaAnchor);
  return (
    readString(wrappedAnchor.attr("href")) ?? readString(wrappedAnchor.text())
  );
};

const isPicTwitterUrl = (value: string): boolean => {
  try {
    const parsed = new URL(normalizeUrlCandidate(value));
    return matchesDomainOrSubdomain(parsed.hostname, "pic.twitter.com");
  } catch {
    return false;
  }
};

const isTcoUrl = (value: string): boolean => {
  try {
    const parsed = new URL(normalizeUrlCandidate(value));
    return matchesDomainOrSubdomain(parsed.hostname, "t.co");
  } catch {
    return false;
  }
};

export function parseTwitterOEmbed(
  oembed: TwitterOEmbedResponse,
  sourceUrl: string,
  tweetId: string
): TweetPreview {
  const $ = cheerio.load(oembed.html ?? "");
  const paragraph = $("blockquote p").first();
  paragraph.find("br").replaceWith("\n");
  const text = normalizeTweetText(
    paragraph.clone().children().remove().end().text()
  );
  const tweetUrl =
    readString($("blockquote a").last().attr("href")) ?? sourceUrl;
  const createdAtText = readString($("blockquote a").last().text());
  const authorUrl = readString(oembed.author_url);
  const parsedSource = parseTweetUrl(sourceUrl);
  const authorHandle =
    parseHandleFromUrl(authorUrl) ??
    parseHandleFromUrl(tweetUrl) ??
    parsedSource?.authorHandle;
  const authorName = readString(oembed.author_name);
  const mediaLink = findMediaLink($);

  return {
    tweetId,
    url: tweetUrl,
    ...(authorName ? { authorName } : {}),
    ...(authorUrl ? { authorUrl } : {}),
    ...(authorHandle ? { authorHandle } : {}),
    ...(text ? { text } : {}),
    ...(mediaLink ? { mediaLink } : {}),
    ...(createdAtText ? { createdAtText } : {}),
  };
}
