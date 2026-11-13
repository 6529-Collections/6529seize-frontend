const formatTabCount = (count: number | null | undefined): string | null => {
  if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) {
    return null;
  }

  return count > 99 ? "99+" : `${count}`;
};

export function TabCountBadge({
  count,
  accessibleLabel,
  variant = "default",
}: {
  readonly count: number | null | undefined;
  readonly accessibleLabel?: string | undefined;
  readonly variant?: "default" | "wave" | undefined;
}) {
  const label = formatTabCount(count);

  if (label === null) {
    return null;
  }

  return (
    <span
      aria-label={accessibleLabel}
      className={`tw-relative tw-inline-flex tw-h-4 tw-min-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-px-1 tw-text-[10px] tw-font-medium tw-leading-none ${
        variant === "wave"
          ? "tw-top-0 tw-bg-iron-800 tw-text-iron-300"
          : "-tw-top-2 tw-bg-indigo-500 tw-text-white tw-shadow-sm"
      }`}
    >
      {label}
    </span>
  );
}
