"use client";

import ExpandableTweetPreview from "@/components/tweets/ExpandableTweetPreview";

interface BoostedTweetPreviewProps {
  readonly href: string;
  readonly tweetId: string;
}

const getFallbackLabel = (href: string): string => {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./i, "");
    return host || href;
  } catch {
    return href;
  }
};

const TweetFallback = ({ href }: { readonly href: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer nofollow"
    className="tw-relative tw-flex tw-h-full tw-w-full tw-items-center tw-justify-start tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-p-4 tw-text-left tw-no-underline tw-transition tw-duration-200 hover:tw-border-white/20"
  >
    <div className="tw-flex tw-flex-col tw-gap-1">
      <span className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
        X post
      </span>
      <span className="tw-[overflow-wrap:anywhere] tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100">
        {getFallbackLabel(href)}
      </span>
    </div>
  </a>
);

export default function BoostedTweetPreview({
  href,
  tweetId,
}: BoostedTweetPreviewProps) {
  return (
    <ExpandableTweetPreview
      href={href}
      tweetId={tweetId}
      renderFallback={(fallbackHref) => <TweetFallback href={fallbackHref} />}
    />
  );
}
