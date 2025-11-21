import CommonSelect from "@/components/utils/select/CommonSelect";
import { SortDirection } from "@/entities/ISort";
import type { XtdhTokensSortField } from "@/hooks/useXtdhTokensQuery";

import {
  TOKEN_CONTRIBUTORS_GROUP_BY_ITEMS,
  TOKEN_CONTRIBUTORS_GROUP_BY_LABELS,
  TOKENS_SORT_ITEMS,
  TOKENS_SORT_LABELS,
  type XtdhTokenContributorsGroupBy,
} from "@/components/xtdh/received/constants";

interface XtdhTokenContributorsControlsProps {
  readonly activeSortField: XtdhTokensSortField;
  readonly activeSortDirection: SortDirection;
  readonly activeGroupBy: XtdhTokenContributorsGroupBy;
  readonly onSortChange: (sort: XtdhTokensSortField) => void;
  readonly onGroupByChange: (groupBy: XtdhTokenContributorsGroupBy) => void;
  readonly resultSummary: string | null;
  readonly isDisabled?: boolean;
}

export function XtdhTokenContributorsControls({
  activeSortField,
  activeSortDirection,
  activeGroupBy,
  onSortChange,
  onGroupByChange,
  resultSummary,
  isDisabled = false,
}: Readonly<XtdhTokenContributorsControlsProps>) {
  return (
    <section className="tw-flex tw-flex-col tw-gap-4" aria-label="Filter token contributors">
      <div className="tw-flex tw-flex-col tw-gap-3 md:tw-flex-row md:tw-items-center md:tw-justify-between">
        <div className="tw-flex tw-w-full tw-flex-col tw-gap-3 lg:tw:flex-row">
          <CommonSelect
            items={TOKENS_SORT_ITEMS}
            activeItem={activeSortField}
            filterLabel="Sort contributors by"
            setSelected={onSortChange}
            sortDirection={activeSortDirection}
            disabled={isDisabled}
          />
          <CommonSelect
            items={TOKEN_CONTRIBUTORS_GROUP_BY_ITEMS}
            activeItem={activeGroupBy}
            filterLabel="Group contributors by"
            setSelected={onGroupByChange}
            disabled={isDisabled}
          />
        </div>
        {resultSummary ? (
          <output
            aria-live="polite"
            aria-atomic="true"
            className="tw-text-sm tw-text-iron-300"
          >
            {resultSummary}
          </output>
        ) : null}
      </div>
    </section>
  );
}

export function buildTokenContributorsResultSummary(
  contributorCount: number,
  sortField: XtdhTokensSortField,
  direction: SortDirection,
  groupBy: XtdhTokenContributorsGroupBy
): string {
  const label = TOKENS_SORT_LABELS[sortField];
  const dirLabel = direction === SortDirection.ASC ? "ascending" : "descending";
  const groupLabel = TOKEN_CONTRIBUTORS_GROUP_BY_LABELS[groupBy];
  const entityWord = contributorCount === 1 ? groupLabel : `${groupLabel}s`;
  return `${contributorCount.toLocaleString()} ${entityWord} · Sorted by ${label} (${dirLabel}) · Grouped by ${groupLabel}`;
}
