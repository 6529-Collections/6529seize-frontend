import CommonSelect from "@/components/utils/select/CommonSelect";
import { SortDirection } from "@/entities/ISort";
import type { XtdhTokensSortField } from "@/hooks/useXtdhTokensQuery";
import { RECEIVED_TOKENS_SUMMARY_NOUNS } from "@/i18n/messages";

import { TOKENS_SORT_ITEMS, TOKENS_SORT_LABELS } from "../constants";
import { buildResultSummary } from "../utils/resultSummary";

interface XtdhTokensControlsProps {
  readonly activeSortField: XtdhTokensSortField;
  readonly activeSortDirection: SortDirection;
  readonly onSortChange: (sort: XtdhTokensSortField) => void;
  readonly resultSummary: string | null;
  readonly isDisabled?: boolean;
}

export function XtdhTokensControls({
  activeSortField,
  activeSortDirection,
  onSortChange,
  resultSummary,
  isDisabled = false,
}: Readonly<XtdhTokensControlsProps>) {
  return (
    <section
      className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between"
      aria-label="Sort received tokens"
    >
      <div className="tw-w-full lg:tw-flex-1 lg:tw-min-w-[16rem] tw-overflow-x-auto horizontal-menu-hide-scrollbar">
        <CommonSelect
          items={TOKENS_SORT_ITEMS}
          activeItem={activeSortField}
          filterLabel="Sort tokens by"
          setSelected={onSortChange}
          sortDirection={activeSortDirection}
          disabled={isDisabled}
        />
      </div>
      {resultSummary && (
        <output
          aria-live="polite"
          aria-atomic="true"
          className="tw-text-sm tw-text-iron-300"
        >
          {resultSummary}
        </output>
      )}
    </section>
  );
}

export function buildTokensResultSummary(
  tokenCount: number,
  sortField: XtdhTokensSortField,
  direction: SortDirection
): string {
  return buildResultSummary({
    count: tokenCount,
    labels: TOKENS_SORT_LABELS,
    sortField,
    direction,
    singularLabel: RECEIVED_TOKENS_SUMMARY_NOUNS.singular,
    pluralLabel: RECEIVED_TOKENS_SUMMARY_NOUNS.plural,
  });
}
