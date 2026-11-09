import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import { SortDirection } from "@/entities/ISort";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";

export function CardCollectorsSortHeader({
  label,
  accessibleLabel = label,
  locale,
  direction,
  onSort,
  className = "",
}: Readonly<{
  label: string;
  accessibleLabel?: string;
  locale: SupportedLocale;
  direction?: SortDirection | undefined;
  onSort: (direction: SortDirection) => void;
  className?: string;
}>) {
  const nextDirection =
    direction === SortDirection.DESC ? SortDirection.ASC : SortDirection.DESC;
  let Icon = ChevronUpDownIcon;
  let ariaSort: "ascending" | "descending" | undefined;
  if (direction === SortDirection.ASC) {
    Icon = ArrowUpIcon;
    ariaSort = "ascending";
  }
  if (direction === SortDirection.DESC) {
    Icon = ArrowDownIcon;
    ariaSort = "descending";
  }

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`tw-whitespace-nowrap tw-border-0 tw-px-2 tw-py-2 tw-text-right tw-text-xs tw-leading-4 last:tw-pr-0 ${direction === undefined ? "tw-font-medium tw-text-iron-400" : "tw-font-semibold tw-text-iron-100"} ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(nextDirection)}
        aria-label={t(
          locale,
          nextDirection === SortDirection.ASC
            ? "theMemes.detail.collectors.sortAscending"
            : "theMemes.detail.collectors.sortDescending",
          { label: accessibleLabel }
        )}
        className="tw-inline-flex tw-min-h-8 tw-cursor-pointer tw-items-center tw-justify-end tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-py-1 tw-text-inherit tw-transition-colors hover:tw-bg-iron-900 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:-tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none"
      >
        {label}
        <Icon className="tw-size-3.5 tw-shrink-0" aria-hidden="true" />
      </button>
    </th>
  );
}
