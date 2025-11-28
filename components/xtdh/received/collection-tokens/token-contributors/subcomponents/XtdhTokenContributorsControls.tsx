import CommonSelect from "@/components/utils/select/CommonSelect";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { SortDirection } from "@/entities/ISort";
import type { XtdhTokensSortField } from "@/hooks/useXtdhTokensQuery";

import {
  TOKEN_CONTRIBUTORS_GROUP_BY_ITEMS,
  TOKENS_SORT_ITEMS,
  type XtdhTokenContributorsGroupBy,
} from "@/components/xtdh/received/constants";

interface XtdhTokenContributorsControlsProps {
  readonly activeSortField: XtdhTokensSortField;
  readonly activeSortDirection: SortDirection;
  readonly activeGroupBy: XtdhTokenContributorsGroupBy;
  readonly onSortChange: (sort: XtdhTokensSortField) => void;
  readonly onGroupByChange: (groupBy: XtdhTokenContributorsGroupBy) => void;

  readonly isDisabled?: boolean;
}

export function XtdhTokenContributorsControls({
  activeSortField,
  activeSortDirection,
  activeGroupBy,
  onSortChange,
  onGroupByChange,

  isDisabled = false,
}: Readonly<XtdhTokenContributorsControlsProps>) {
  return (
    <section className="tw-flex tw-flex-col tw-gap-4" aria-label="Filter token contributors">
      <div className="tw-flex tw-flex-col tw-gap-3 md:tw-flex-row md:tw-items-center md:tw-justify-between">
        <div className="tw-flex tw-w-full tw-flex-col tw-gap-3 md:tw-flex-row md:tw-items-center md:tw-justify-between">
          <div className="tw-w-full md:tw-w-auto">
            <CommonSelect
              items={TOKENS_SORT_ITEMS}
              activeItem={activeSortField}
              filterLabel="Sort contributors by"
              setSelected={onSortChange}
              sortDirection={activeSortDirection}
              disabled={isDisabled}
              fill={false}
            />
          </div>
          <div className="tw-flex tw-items-center tw-gap-3 tw-w-full md:tw-w-auto">
            <span className="tw-text-sm tw-font-semibold tw-text-iron-400 tw-whitespace-nowrap">
              Group by
            </span>
            <div className="tw-w-full md:tw-w-48">
              <CommonDropdown
                items={TOKEN_CONTRIBUTORS_GROUP_BY_ITEMS}
                activeItem={activeGroupBy}
                filterLabel="Group contributors by"
                setSelected={onGroupByChange}
                disabled={isDisabled}
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}


