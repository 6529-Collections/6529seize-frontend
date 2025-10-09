import { useMemo } from "react";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import type {
  XtdhCollectionsSort,
  XtdhTokensSort,
  XtdhSortDirection,
} from "../types";

type XtdhSortValue = XtdhCollectionsSort | XtdhTokensSort;

interface SortSummaryProps<SortValue extends XtdhSortValue> {
  readonly sortOptions: ReadonlyArray<CommonSelectItem<SortValue>>;
  readonly sort: SortValue;
  readonly direction: XtdhSortDirection;
}

export default function SortSummary<SortValue extends XtdhSortValue>({
  sortOptions,
  sort,
  direction,
}: Readonly<SortSummaryProps<SortValue>>) {
  const activeOption = useMemo(
    () => sortOptions.find((option) => option.value === sort),
    [sortOptions, sort]
  );

  if (!activeOption) {
    return null;
  }

  return (
    <div className="tw-text-xs tw-font-medium tw-text-iron-300">
      {activeOption.label} {direction === "asc" ? "↑" : "↓"}
    </div>
  );
}
