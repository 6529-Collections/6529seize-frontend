interface AdditionalActionPromiseBadgeProps {
  readonly className?: string | undefined;
}

export function AdditionalActionPromiseBadge({
  className = "",
}: AdditionalActionPromiseBadgeProps) {
  return (
    <span
      className={`tw-inline-flex tw-shrink-0 tw-items-center tw-rounded-full tw-bg-amber-400/10 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-semibold tw-leading-5 tw-text-amber-300 tw-ring-1 tw-ring-amber-300/25 ${className}`}
    >
      Additional action promised
    </span>
  );
}
