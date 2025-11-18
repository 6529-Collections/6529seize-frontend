import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import { SortDirection } from "@/entities/ISort";
import type { XtdhCollectionsSortField } from "@/hooks/useXtdhCollectionsQuery";

export const COLLECTION_SORT_LABELS: Record<XtdhCollectionsSortField, string> = {
  xtdh: "xTDH",
  xtdh_rate: "xTDH Rate",
};

export const COLLECTION_SORT_ITEMS = [
  { key: "xtdh", label: COLLECTION_SORT_LABELS.xtdh, value: "xtdh" },
  {
    key: "xtdh_rate",
    label: COLLECTION_SORT_LABELS.xtdh_rate,
    value: "xtdh_rate",
  },
] as const satisfies ReadonlyArray<
  CommonSelectItem<XtdhCollectionsSortField>
>;

export const DEFAULT_COLLECTION_SORT_FIELD: XtdhCollectionsSortField = "xtdh";
export const DEFAULT_COLLECTION_SORT_DIRECTION = SortDirection.DESC;

export function parseCollectionSortField(
  value: string | null
): XtdhCollectionsSortField {
  if (!value) {
    return DEFAULT_COLLECTION_SORT_FIELD;
  }
  const normalized = value.trim().toLowerCase();
  return (
    COLLECTION_SORT_ITEMS.find((item) => item.value === normalized)
      ?.value ?? DEFAULT_COLLECTION_SORT_FIELD
  );
}

export function parseCollectionSortDirection(
  value: string | null
): SortDirection {
  if (!value) {
    return DEFAULT_COLLECTION_SORT_DIRECTION;
  }
  const normalized = value.trim().toUpperCase();
  return normalized === SortDirection.ASC
    ? SortDirection.ASC
    : SortDirection.DESC;
}
