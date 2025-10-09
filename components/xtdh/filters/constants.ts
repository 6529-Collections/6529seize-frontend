import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import type {
  XtdhCollectionsSort,
  XtdhTokensSort,
  XtdhView,
  XtdhSortDirection,
} from "./types";

export const DEFAULT_DIRECTION: XtdhSortDirection = "desc";
export const DEFAULT_COLLECTION_SORT: XtdhCollectionsSort = "total_rate";
export const DEFAULT_TOKEN_SORT: XtdhTokensSort = "rate";
export const ALL_NETWORKS_OPTION = "__xtdh_network_all__";

export interface ActivityLabels {
  readonly allocated: string;
  readonly receiving: string;
}

export const COLLECTION_SORT_OPTIONS: ReadonlyArray<
  CommonSelectItem<XtdhCollectionsSort>
> = [
  { key: "total_rate", label: "xTDH Rate", value: "total_rate" },
  { key: "total_allocated", label: "Total xTDH", value: "total_allocated" },
  { key: "grantors", label: "Grantors", value: "grantors" },
];

export const TOKEN_SORT_OPTIONS: ReadonlyArray<
  CommonSelectItem<XtdhTokensSort>
> = [
  { key: "rate", label: "xTDH Rate", value: "rate" },
  { key: "total_allocated", label: "Total xTDH", value: "total_allocated" },
  { key: "grantors", label: "Grantors", value: "grantors" },
];

export const SORT_OPTIONS: Record<
  XtdhView,
  ReadonlyArray<CommonSelectItem<XtdhCollectionsSort | XtdhTokensSort>>
> = {
  collections: COLLECTION_SORT_OPTIONS,
  tokens: TOKEN_SORT_OPTIONS,
};

const SHARED_ACTIVITY_LABELS: ActivityLabels = {
  allocated: "I've allocated to",
  receiving: "I'm receiving",
};

export const ACTIVITY_LABELS: Record<XtdhView, ActivityLabels> = {
  collections: SHARED_ACTIVITY_LABELS,
  tokens: SHARED_ACTIVITY_LABELS,
};
