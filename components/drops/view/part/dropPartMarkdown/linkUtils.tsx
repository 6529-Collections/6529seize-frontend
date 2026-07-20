import type { AnchorHTMLAttributes } from "react";
import type { ExtraProps } from "react-markdown";

import { publicEnv } from "@/config/env";
import { isLikelyEnsTarget } from "@/lib/ens/detect";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";
import { parseYoutubeLink } from "@/services/youtube/url";

import { isPepeHost } from "./pepe";
import { TWITTER_DOMAINS } from "./twitter";

const parseUrl = (href: string): URL | null => {
  try {
    return new URL(href);
  } catch {
    return null;
  }
};

const YOUTUBE_DOMAINS = ["youtube.com", "youtube-nocookie.com"] as const;
const ART_BLOCKS_DOMAINS = [
  "artblocks.io",
  "live.artblocks.io",
  "media.artblocks.io",
  "media-proxy.artblocks.io",
  "token.artblocks.io",
] as const;
const DIRECT_IMAGE_EXTENSIONS = [
  ".gif",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
] as const;
const SAFE_DATA_IMAGE_REGEX =
  /^data:image\/(?:gif|png|jpe?g|webp|avif);base64,[a-z0-9+/=\s]+$/i;

const isSafeDataImageUrl = (href: string): boolean => {
  return SAFE_DATA_IMAGE_REGEX.test(href.trim());
};

const isSafeRelativeImagePath = (href: string): boolean => {
  return (
    (href.startsWith("/") && !href.startsWith("//")) ||
    href.startsWith("./") ||
    href.startsWith("../")
  );
};

const isSafeMarkdownImageSrc = (href: string): boolean => {
  const trimmedHref = href.trim();

  if (trimmedHref.length === 0) {
    return false;
  }

  if (isSafeDataImageUrl(trimmedHref)) {
    return true;
  }

  const parsedUrl = parseUrl(trimmedHref);
  if (!parsedUrl) {
    return isSafeRelativeImagePath(trimmedHref);
  }

  const protocol = parsedUrl.protocol.toLowerCase();
  return protocol === "http:" || protocol === "https:";
};

const isGithubBlobUrl = (url: URL): boolean => {
  const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (hostname !== "github.com") {
    return false;
  }

  const [, , kindSegment] = url.pathname.split("/").filter(Boolean);
  return kindSegment === "blob";
};

const isWikimediaCommonsFilePage = (url: URL): boolean => {
  const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
  return (
    hostname === "commons.wikimedia.org" &&
    /^\/wiki\/file(?::|%3a)/i.test(url.pathname)
  );
};

const isDirectImageUrl = (href: string, parsedUrl?: URL | null): boolean => {
  const url = parsedUrl ?? parseUrl(href);
  if (!url) {
    return false;
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return false;
  }

  if (isGithubBlobUrl(url) || isWikimediaCommonsFilePage(url)) {
    return false;
  }

  const pathname = url.pathname.toLowerCase();
  return DIRECT_IMAGE_EXTENSIONS.some((extension) =>
    pathname.endsWith(extension)
  );
};

const shouldUseOpenGraphPreview = (
  href: string,
  parsedUrl?: URL | null
): boolean => {
  if (isLikelyEnsTarget(href)) {
    return false;
  }

  const url = parsedUrl ?? parseUrl(href);
  if (!url) {
    return false;
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return false;
  }

  const hostname = url.hostname.toLowerCase();

  const isYoutubeUrl =
    hostname === "youtu.be" ||
    YOUTUBE_DOMAINS.some((domain) =>
      matchesDomainOrSubdomain(hostname, domain)
    );

  if (isYoutubeUrl) {
    return parseYoutubeLink(href) !== null;
  }

  if (isPepeHost(hostname)) {
    return false;
  }

  if (
    TWITTER_DOMAINS.some((domain) => matchesDomainOrSubdomain(hostname, domain))
  ) {
    return false;
  }

  if (
    ART_BLOCKS_DOMAINS.some((domain) =>
      matchesDomainOrSubdomain(hostname, domain)
    )
  ) {
    return false;
  }

  return true;
};

const renderExternalOrInternalLink = (
  href: string,
  props: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps
) => {
  const baseEndpoint = publicEnv.BASE_ENDPOINT || "";
  const hasBaseEndpoint = baseEndpoint.length > 0;
  const isExternalLink = hasBaseEndpoint && !href.startsWith(baseEndpoint);
  const { onClick, ...restProps } = props;
  const anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps = {
    ...restProps,
    href,
  };

  if (isExternalLink) {
    anchorProps.rel = "noopener noreferrer nofollow";
    anchorProps.target = "_blank";
  } else if (hasBaseEndpoint) {
    anchorProps.href = href.replace(baseEndpoint, "");
  }

  return (
    <a
      {...anchorProps}
      onClick={(e) => {
        e.stopPropagation();
        if (typeof onClick === "function") {
          onClick(e);
        }
      }}
    />
  );
};

const isValidLink = (href: string): boolean => {
  return parseUrl(href) !== null || isLikelyEnsTarget(href);
};

export {
  isDirectImageUrl,
  isSafeMarkdownImageSrc,
  isValidLink,
  parseUrl,
  renderExternalOrInternalLink,
  shouldUseOpenGraphPreview,
};
