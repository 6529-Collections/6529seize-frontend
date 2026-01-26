"use client";

import { useMemo } from "react";
import {
  TweetBody,
  TweetContainer,
  TweetHeader,
  TweetSkeleton,
  enrichTweet,
  useTweet,
} from "react-tweet";

import styles from "./BoostedTweetPreview.module.css";

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
  const { data, isLoading } = useTweet(tweetId);

  const tweet = useMemo(() => (data ? enrichTweet(data) : null), [data]);

  if (isLoading) {
    return (
      <div className={styles["root"]} data-theme="dark">
        <TweetSkeleton />
      </div>
    );
  }

  if (!tweet) {
    return <TweetFallback href={href} />;
  }

  return (
    <div className={styles["root"]} data-theme="dark">
      <TweetContainer className="tw-w-full tw-min-w-0 tw-max-w-full">
        <TweetHeader tweet={tweet} />
        <TweetBody tweet={tweet} />
      </TweetContainer>
    </div>
  );
}
