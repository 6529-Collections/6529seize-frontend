import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import SortSummary from "./SortSummary";
import type {
  XtdhCollectionsSort,
  XtdhTokensSort,
  XtdhSortDirection,
} from "../types";

type XtdhSortValue = XtdhCollectionsSort | XtdhTokensSort;

interface MobileControlsProps<SortValue extends XtdhSortValue> {
  readonly activeFilterCount: number;
  readonly sortOptions: ReadonlyArray<CommonSelectItem<SortValue>>;
  readonly sort: SortValue;
  readonly direction: XtdhSortDirection;
  readonly onOpenFilters: () => void;
}

export default function MobileControls<SortValue extends XtdhSortValue>({
  activeFilterCount,
  sortOptions,
  sort,
  direction,
  onOpenFilters,
}: Readonly<MobileControlsProps<SortValue>>) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-iron-800 tw-pb-4 md:tw-hidden">
      <button
        type="button"
        onClick={onOpenFilters}
        className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-50 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0"
      >
        <span aria-hidden="true">☰</span>
        <span>Filters &amp; Sort</span>
        {activeFilterCount > 0 ? (
          <span className="tw-inline-flex tw-h-6 tw-min-w-[1.5rem] tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500 tw-px-2 tw-text-xs tw-font-bold tw-text-iron-950">
            {activeFilterCount}
          </span>
        ) : null}
      </button>
      <SortSummary<SortValue>
        sortOptions={sortOptions}
        sort={sort}
        direction={direction}
      />
    </div>
  );
}
