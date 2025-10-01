import type { AnchorHTMLAttributes } from "react";
import { ExtraProps } from "react-markdown";

import { publicEnv } from "@/config/env";
import { isLikelyEnsTarget } from "@/lib/ens/detect";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";

import { isPepeHost } from "./pepe";

const parseUrl = (href: string): URL | null => {
  try {
    return new URL(href);
  } catch {
    return null;
  }
};

const YOUTUBE_DOMAINS = ["youtube.com", "youtube-nocookie.com"] as const;
const TWITTER_DOMAINS = ["twitter.com", "x.com"] as const;
const ART_BLOCKS_DOMAINS = [
  "artblocks.io",
  "live.artblocks.io",
  "media.artblocks.io",
  "media-proxy.artblocks.io",
  "token.artblocks.io",
] as const;

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

  if (hostname === "youtu.be") {
    return false;
  }

  if (isPepeHost(hostname)) {
    return false;
  }

  if (
    YOUTUBE_DOMAINS.some((domain) => matchesDomainOrSubdomain(hostname, domain))
  ) {
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
  const isExternalLink = baseEndpoint && !href.startsWith(baseEndpoint);
  const { onClick, ...restProps } = props;
  const anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps = {
    ...restProps,
    href,
  };

  if (isExternalLink) {
    anchorProps.rel = "noopener noreferrer nofollow";
    anchorProps.target = "_blank";
  } else if (baseEndpoint) {
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
  isValidLink,
  parseUrl,
  renderExternalOrInternalLink,
  shouldUseOpenGraphPreview,
};
