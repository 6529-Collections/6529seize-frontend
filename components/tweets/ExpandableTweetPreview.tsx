"use client";

import {
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { enrichTweet, TweetContainer, useTweet } from "react-tweet";

import styles from "./ExpandableTweetPreview.module.css";
import CompactTweetContent from "./ExpandableTweetPreviewCompactContent";
import CompactControls from "./ExpandableTweetPreviewCompactControls";
import ExpandedTweetContent from "./ExpandableTweetPreviewExpandedContent";
import MeasurementShell from "./ExpandableTweetPreviewMeasurementShell";

import type { EnrichedTweet } from "./ExpandableTweetPreview.types";
import type { TweetPreviewMode } from "./TweetPreviewModeContext";

interface ExpandableTweetPreviewProps {
  readonly href: string;
  readonly tweetId: string;
  readonly compactHeightClassName?: string | undefined;
  readonly compactMode?: TweetPreviewMode | undefined;
  readonly renderFallback?: ((href: string) => ReactNode) | undefined;
}

const COMPACT_PX = 256;
const COMPACT_THRESHOLD_MULTIPLIER = 1.5;
const COMPACT_THRESHOLD_PX = COMPACT_PX * COMPACT_THRESHOLD_MULTIPLIER;

const LoadingPlaceholder = () => (
  <div className="tw-flex tw-h-full tw-w-full tw-animate-pulse tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-900/60 tw-text-iron-300">
    Loading tweet...
  </div>
);

export default function ExpandableTweetPreview({
  href,
  tweetId,
  compactHeightClassName,
  compactMode,
  renderFallback,
}: ExpandableTweetPreviewProps) {
  return (
    <ExpandableTweetPreviewInner
      key={tweetId}
      href={href}
      tweetId={tweetId}
      compactHeightClassName={compactHeightClassName}
      compactMode={compactMode}
      renderFallback={renderFallback}
    />
  );
}

function ExpandableTweetPreviewInner({
  href,
  tweetId,
  compactHeightClassName = "tw-h-64",
  compactMode,
  renderFallback,
}: ExpandableTweetPreviewProps) {
  const { data, isLoading } = useTweet(tweetId);
  const tweet = useMemo<EnrichedTweet | null>(
    () => (data ? enrichTweet(data) : null),
    [data]
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const allowCompact = (compactMode ?? "auto") === "auto";

  useLayoutEffect(() => {
    if (!allowCompact) {
      return;
    }
    if (!tweet || measuredHeight !== null) {
      return;
    }
    if (!measureRef.current) {
      return;
    }
    const rect = measureRef.current.getBoundingClientRect();
    if (rect.height > 0) {
      setMeasuredHeight(rect.height);
    }
  }, [tweet, measuredHeight, allowCompact]);

  const shouldCompact =
    allowCompact &&
    (measuredHeight === null || measuredHeight > COMPACT_THRESHOLD_PX);

  const heightClassName =
    !shouldCompact || isExpanded ? "" : compactHeightClassName;
  const modeClassName = isExpanded ? styles["expanded"] : styles["compact"];
  const overflowClassName =
    isExpanded || !shouldCompact ? "tw-overflow-visible" : "tw-overflow-hidden";
  const rootClassName = `${styles["root"] ?? ""} ${modeClassName ?? ""} ${heightClassName} ${overflowClassName} tw-relative tw-w-full tw-min-w-0 tw-max-w-full`;
  const showMeasure = allowCompact && measuredHeight === null;
  const showExpanded = isExpanded || !shouldCompact;
  const showCompactControls = allowCompact && !isExpanded && shouldCompact;

  if (isLoading) {
    return (
      <div className={rootClassName} data-theme="dark">
        <TweetContainer className="tw-h-full tw-w-full tw-min-w-0 tw-max-w-full">
          <LoadingPlaceholder />
        </TweetContainer>
      </div>
    );
  }

  if (!tweet) {
    return (
      <div className={rootClassName} data-theme="dark">
        {renderFallback ? renderFallback(href) : null}
      </div>
    );
  }

  return (
    <div className={rootClassName} data-theme="dark">
      <MeasurementShell show={showMeasure} measureRef={measureRef}>
        <ExpandedTweetContent tweet={tweet} />
      </MeasurementShell>
      <TweetContainer className="tw-h-full tw-w-full tw-min-w-0 tw-max-w-full">
        {showExpanded ? (
          <ExpandedTweetContent tweet={tweet} />
        ) : (
          <CompactTweetContent tweet={tweet} />
        )}
      </TweetContainer>

      <CompactControls
        showFade={showCompactControls}
        showButton={showCompactControls}
        isExpanded={isExpanded}
        onExpand={() => setIsExpanded(true)}
      />
    </div>
  );
}
