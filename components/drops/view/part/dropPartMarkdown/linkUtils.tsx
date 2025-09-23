import type { AnchorHTMLAttributes } from "react";
import { ExtraProps } from "react-markdown";

import { isLikelyEnsTarget } from "@/lib/ens/detect";

const parseUrl = (href: string): URL | null => {
  try {
    return new URL(href);
  } catch {
    return null;
  }
};

const shouldUseOpenGraphPreview = (href: string, parsedUrl?: URL | null): boolean => {
  if (isLikelyEnsTarget(href)) {
    return false;
  }

  const url = parsedUrl ?? parseUrl(href);
  if (!url) {
    return false;
  }

  const hostname = url.hostname.toLowerCase();

  if (hostname.endsWith("artblocks.io")) {
    const path = url.pathname.toLowerCase();
    if (path.startsWith("/project/")) {
      return false;
    }
  }

  const protocol = url.protocol.toLowerCase();
  return protocol === "http:" || protocol === "https:";
};

const renderExternalOrInternalLink = (
  href: string,
  props: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps
) => {
  const baseEndpoint = process.env.BASE_ENDPOINT ?? "";
  const isExternalLink = baseEndpoint && !href.startsWith(baseEndpoint);
  const { onClick, ...restProps } = props;
  const anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps = {
    ...restProps,
    href,
  };

  if (isExternalLink) {
    anchorProps.rel = "noopener noreferrer nofollow";
    anchorProps.target = "_blank";
  } else {
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

export { parseUrl, shouldUseOpenGraphPreview, renderExternalOrInternalLink, isValidLink };
