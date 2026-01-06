import CommonSelect from "@/components/utils/select/CommonSelect";
import type { SortDirection } from "@/entities/ISort";
import type { XtdhTokensSortField } from "@/hooks/useXtdhTokensQuery";

import { TOKENS_SORT_ITEMS } from "../constants";

interface XtdhTokensControlsProps {
  readonly activeSortField: XtdhTokensSortField;
  readonly activeSortDirection: SortDirection;
  readonly onSortChange: (sort: XtdhTokensSortField) => void;

  readonly isDisabled?: boolean | undefined;
}

export function XtdhTokensControls({
  activeSortField,
  activeSortDirection,
  onSortChange,

  isDisabled = false,
}: Readonly<XtdhTokensControlsProps>) {
  return (
    <section
      className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between"
      aria-label="Sort received tokens"
    >
      <div className="tw-w-full md:tw-w-auto tw-overflow-x-auto horizontal-menu-hide-scrollbar">
        <CommonSelect
          items={TOKENS_SORT_ITEMS}
          activeItem={activeSortField}
          filterLabel="Sort tokens by"
          setSelected={onSortChange}
          sortDirection={activeSortDirection}
          disabled={isDisabled}
          fill={false}
        />
      </div>

    </section>
  );
}


