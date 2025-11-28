import type { RefObject } from "react";

interface NftSuggestSentinelProps {
  readonly top: number;
  readonly height: number;
  readonly sentinelRef: RefObject<HTMLDivElement | null>;
  readonly hasSuggestions: boolean;
}

export function NftSuggestSentinel({
  top,
  height,
  sentinelRef,
  hasSuggestions,
}: NftSuggestSentinelProps) {
  return (
    <li
      key="suggestions-sentinel"
      className="tw-absolute tw-w-full"
      style={{ top, height }}
      aria-hidden="true"
    >
      <div ref={sentinelRef} style={{ height: "100%", width: "100%" }} />
      {!hasSuggestions && (
        <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-px-3 tw-text-sm tw-text-iron-400">
          No suggestions available
        </div>
      )}
    </li>
  );
}
