"use client";


import { ensureTwitterLink } from "@/components/drops/view/part/dropPartMarkdown/twitter";
import SmartLinkPreview from "@/components/waves/SmartLinkPreview";

import BoostedTweetPreview from "./BoostedTweetPreview";

import type { SyntheticEvent } from "react";

const getFallbackLabel = (href: string): string => {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./i, "");
    return host || href;
  } catch {
    return href;
  }
};

const getTwitterPayload = (href: string) => {
  try {
    return ensureTwitterLink(href);
  } catch {
    return null;
  }
};

const stopPropagation = (event: SyntheticEvent) => {
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();
};

export default function BoostedDropLinkPreview({
  href,
}: {
  readonly href: string;
}) {
  const twitterPayload = getTwitterPayload(href);
  if (twitterPayload) {
    const { tweetId, href: normalizedHref } = twitterPayload;
    return (
      <div
        className="tw-h-full tw-w-full tw-min-w-0 tw-max-w-full"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        onTouchStart={stopPropagation}
      >
        <BoostedTweetPreview href={normalizedHref} tweetId={tweetId} />
      </div>
    );
  }

  return (
    <div
      className="tw-h-full tw-w-full tw-min-w-0 tw-max-w-full"
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onPointerDown={stopPropagation}
      onTouchStart={stopPropagation}
    >
      <SmartLinkPreview
        href={href}
        variant="home"
        renderFallback={() => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => e.stopPropagation()}
            className="tw-[overflow-wrap:anywhere] tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white"
          >
            {getFallbackLabel(href)}
          </a>
        )}
      />
    </div>
  );
}
