import CommonSelect from "@/components/utils/select/CommonSelect";
import type { XtdhCollectionsSortField } from "@/hooks/useXtdhCollectionsQuery";
import { SortDirection } from "@/entities/ISort";

import {
  COLLECTION_SORT_ITEMS,
} from "../constants";

interface XtdhCollectionsControlsProps {
  readonly activeSortField: XtdhCollectionsSortField;
  readonly activeSortDirection: SortDirection;
  readonly onSortChange: (sort: XtdhCollectionsSortField) => void;

  readonly isDisabled?: boolean;
}

export function XtdhCollectionsControls({
  activeSortField,
  activeSortDirection,
  onSortChange,

  isDisabled = false,
}: Readonly<XtdhCollectionsControlsProps>) {
  return (
    <section className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between" aria-label="Sort received collections">
      <div className="tw-w-full lg:tw-w-auto tw-overflow-x-auto horizontal-menu-hide-scrollbar">
        <CommonSelect
          items={COLLECTION_SORT_ITEMS}
          activeItem={activeSortField}
          filterLabel="Sort collections by"
          setSelected={onSortChange}
          sortDirection={activeSortDirection}
          disabled={isDisabled}
          fill={false}
        />
      </div>

    </section>
  );
}


