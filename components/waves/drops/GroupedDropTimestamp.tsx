"use client";

import type { CSSProperties } from "react";
import { DropAuthorSignedIndicator } from "./signature/DropAuthorSignedMarker";
import type { VerdictDrop } from "./signature/dropSignatureVerdicts";
import WaveDropTime from "./time/WaveDropTime";
import { GROUPED_TIMESTAMP_SWIPE_MAX_OFFSET_PX } from "./WaveDrop.helpers";

const getGroupedTimestampOpacityStyle = (offset: number): CSSProperties => ({
  opacity: `var(--message-swipe-time-opacity, ${Math.min(1, offset / GROUPED_TIMESTAMP_SWIPE_MAX_OFFSET_PX)})`,
});

const GroupedDropTimestamp = ({
  swipeOffset = 0,
  timestamp,
  variant,
  forceVisible = false,
  signedDrop,
}: {
  readonly swipeOffset?: number;
  readonly timestamp: number;
  readonly variant: "swipe" | "hover";
  /** An author-signed drop: shows its static seal, checked in this browser. */
  readonly signedDrop?: VerdictDrop | undefined;
  /** Pointer-driven row hover for browsers whose CSS :hover never fires. */
  readonly forceVisible?: boolean;
}) => {
  // "swipe": revealed by the touch swipe gesture via inline opacity.
  // "hover": desktop affordance — swiping would hijack text selection, so the
  // timestamp reveals on row hover instead.
  const isHoverVariant = variant === "hover";
  let timestampStyle: CSSProperties | undefined;

  if (isHoverVariant) {
    timestampStyle = forceVisible ? { opacity: 1 } : undefined;
  } else {
    timestampStyle = getGroupedTimestampOpacityStyle(swipeOffset);
  }

  return (
    <div
      className={`tw-pointer-events-none tw-absolute tw-right-4 tw-top-1/2 tw-z-0 tw-flex tw-w-[9.25rem] -tw-translate-y-1/2 tw-justify-end tw-overflow-visible tw-text-right tw-transition-opacity tw-duration-150 motion-reduce:tw-transition-none [[data-reply-enabled=true]_&]:tw-right-14 ${
        isHoverVariant
          ? "tw-opacity-0 desktop-hover:group-hover:tw-opacity-100"
          : ""
      }`}
      data-testid={
        isHoverVariant
          ? "grouped-drop-hover-timestamp"
          : "grouped-drop-swipe-timestamp"
      }
      style={timestampStyle}
    >
      <span className="tw-inline-flex tw-items-center tw-gap-x-1.5">
        {/* Before the time, so grouped timestamps stay right-aligned. */}
        {signedDrop && <DropAuthorSignedIndicator drop={signedDrop} />}
        <WaveDropTime timestamp={timestamp} size="xs" variant="compactReveal" />
      </span>
    </div>
  );
};

export default GroupedDropTimestamp;
