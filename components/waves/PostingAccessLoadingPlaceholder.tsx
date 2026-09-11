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
  return (
    <div
      {...(statusLabel
        ? {
            role: "status",
            "aria-live": "polite" as const,
            "aria-busy": true,
          }
        : { "aria-hidden": true })}
      data-testid="posting-access-skeleton"
      className="tw-grid tw-min-h-11 tw-w-full tw-grid-cols-[auto_minmax(0,1fr)_auto] tw-items-center tw-gap-x-2 lg:tw-gap-x-3"
    >
      {statusLabel && <span className="tw-sr-only">{statusLabel}</span>}
      <SkeletonPart className="tw-size-8 tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-white/5 lg:tw-size-7" />
      <SkeletonPart className="tw-h-11 tw-min-w-0 tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-white/10" />
      <SkeletonPart className="tw-h-11 tw-w-10 tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-white/5 lg:tw-w-[3.875rem]" />
    </div>
  );
}
