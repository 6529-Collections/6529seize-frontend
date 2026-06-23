const formatTabCount = (count: number | null | undefined): string | null => {
  if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) {
    return null;
  }

  return count > 99 ? "99+" : `${count}`;
};

export function TabCountBadge({
  count,
}: {
  readonly count: number | null | undefined;
}) {
  const label = formatTabCount(count);

  if (label === null) {
    return null;
  }

  return (
    <span className="tw-relative -tw-top-2 tw-inline-flex tw-h-4 tw-min-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-indigo-500 tw-px-1 tw-text-[10px] tw-font-medium tw-leading-none tw-text-white tw-shadow-sm">
      {label}
    </span>
  );
}
