import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import { SortDirection } from "@/entities/ISort";
import type { XtdhCollectionsSortField } from "@/hooks/useXtdhCollectionsQuery";
import type { XtdhTokensSortField } from "@/hooks/useXtdhTokensQuery";

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

export const TOKENS_SORT_LABELS: Record<XtdhTokensSortField, string> = {
  xtdh: "xTDH",
  xtdh_rate: "xTDH Rate",
};

export const TOKENS_SORT_ITEMS = [
  { key: "xtdh", label: TOKENS_SORT_LABELS.xtdh, value: "xtdh" },
  {
    key: "xtdh_rate",
    label: TOKENS_SORT_LABELS.xtdh_rate,
    value: "xtdh_rate",
  },
] as const satisfies ReadonlyArray<CommonSelectItem<XtdhTokensSortField>>;

export const DEFAULT_TOKENS_SORT_FIELD: XtdhTokensSortField = "xtdh";
export const DEFAULT_TOKENS_SORT_DIRECTION = SortDirection.DESC;

export function parseTokensSortField(
  value: string | null
): XtdhTokensSortField {
  if (!value) {
    return DEFAULT_TOKENS_SORT_FIELD;
  }
  const normalized = value.trim().toLowerCase();
  return (
    TOKENS_SORT_ITEMS.find((item) => item.value === normalized)?.value ??
    DEFAULT_TOKENS_SORT_FIELD
  );
}

export function parseTokensSortDirection(value: string | null): SortDirection {
  if (!value) {
    return DEFAULT_TOKENS_SORT_DIRECTION;
  }
  const normalized = value.trim().toUpperCase();
  return normalized === SortDirection.ASC
    ? SortDirection.ASC
    : SortDirection.DESC;
}

export type XtdhTokenContributorsGroupBy = "grant" | "grantor";

export const TOKEN_CONTRIBUTORS_GROUP_BY_LABELS: Record<
  XtdhTokenContributorsGroupBy,
  string
> = {
  grant: "By Grant",
  grantor: "By Grantor",
};

export const TOKEN_CONTRIBUTORS_GROUP_BY_ITEMS = [
  {
    key: "grant",
    label: TOKEN_CONTRIBUTORS_GROUP_BY_LABELS.grant,
    value: "grant",
  },
  {
    key: "grantor",
    label: TOKEN_CONTRIBUTORS_GROUP_BY_LABELS.grantor,
    value: "grantor",
  },
] as const satisfies ReadonlyArray<
  CommonSelectItem<XtdhTokenContributorsGroupBy>
>;

export const DEFAULT_TOKEN_CONTRIBUTORS_GROUP_BY: XtdhTokenContributorsGroupBy =
  "grant";
export const DEFAULT_TOKEN_CONTRIBUTORS_SORT_FIELD: XtdhTokensSortField = "xtdh";
export const DEFAULT_TOKEN_CONTRIBUTORS_SORT_DIRECTION = SortDirection.DESC;

export function parseTokenContributorsGroupBy(
  value: string | null
): XtdhTokenContributorsGroupBy {
  if (!value) {
    return DEFAULT_TOKEN_CONTRIBUTORS_GROUP_BY;
  }
  const normalized = value.trim().toLowerCase();
  return (
    TOKEN_CONTRIBUTORS_GROUP_BY_ITEMS.find(
      (item) => item.value === normalized
    )?.value ?? DEFAULT_TOKEN_CONTRIBUTORS_GROUP_BY
  );
}
