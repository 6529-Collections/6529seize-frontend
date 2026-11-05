"use client";

import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useCreateDropContainerWidth } from "./create-drop-content/useCreateDropContainerWidth";
import { COMPOSER_ROW_GAP_CLASS_NAME } from "./composerPresentation";

interface PostingAccessLoadingPlaceholderProps {
  readonly statusLabel?: string | undefined;
}

const shimmerClassName =
  "tw-animate-[shimmer_1.8s_ease-in-out_infinite] tw-bg-[linear-gradient(90deg,#1C1C21_20%,#303137_50%,#1C1C21_80%)] tw-bg-[length:200%_100%] motion-reduce:tw-animate-none";

const SkeletonPart = ({ className }: { readonly className: string }) => (
  <span
    aria-hidden="true"
    data-wave-composer-skeleton-part="true"
    className={`${shimmerClassName} ${className}`}
  />
);

export default function PostingAccessLoadingPlaceholder({
  statusLabel,
}: PostingAccessLoadingPlaceholderProps) {
  const isMobile = useIsMobileScreen();
  const { isWideContainer, setActionsContainerRef } =
    useCreateDropContainerWidth();
  const expanded = !isMobile && isWideContainer;
  return (
    <div
      ref={setActionsContainerRef}
      {...(statusLabel
        ? {
            role: "status",
            "aria-live": "polite" as const,
            "aria-busy": true,
          }
        : { "aria-hidden": true })}
      data-testid="posting-access-skeleton"
      className={`tw-grid tw-min-h-10 tw-w-full tw-grid-cols-[auto_minmax(0,1fr)_auto] tw-items-center ${COMPOSER_ROW_GAP_CLASS_NAME}`}
    >
      {statusLabel && <span className="tw-sr-only">{statusLabel}</span>}
      <div
        className="tw-flex tw-items-center tw-gap-2"
        data-testid="composer-actions-skeleton"
      >
        {["attach", "gif", "poll", "storm"]
          .slice(0, expanded ? 4 : 1)
          .map((action) => (
            <SkeletonPart
              key={action}
              className={`tw-size-10 ${expanded ? "tw-rounded-lg" : "tw-rounded-full"} tw-ring-1 tw-ring-inset tw-ring-white/5`}
            />
          ))}
      </div>
      <SkeletonPart className="tw-h-[42px] tw-min-w-0 tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-white/10" />
      <SkeletonPart className="tw-h-10 tw-w-10 tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-white/5 lg:tw-w-[3.875rem]" />
    </div>
  );
}
