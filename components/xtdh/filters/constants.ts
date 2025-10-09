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
  { key: "total_rate", label: "Total xTDH Rate", value: "total_rate" },
  { key: "total_allocated", label: "Total xTDH Allocated", value: "total_allocated" },
  { key: "recent", label: "Recently Updated", value: "recent" },
  { key: "grantors", label: "Number of Grantors", value: "grantors" },
  { key: "name", label: "Collection Name", value: "name" },
];

export const TOKEN_SORT_OPTIONS: ReadonlyArray<
  CommonSelectItem<XtdhTokensSort>
> = [
  { key: "rate", label: "xTDH Rate", value: "rate" },
  { key: "recent", label: "Recently Granted", value: "recent" },
  { key: "grantors", label: "Grantors", value: "grantors" },
  { key: "collection", label: "Collection Name", value: "collection" },
  { key: "name", label: "Token Name", value: "name" },
];

export const SORT_OPTIONS: Record<
  XtdhView,
  ReadonlyArray<CommonSelectItem<XtdhCollectionsSort | XtdhTokensSort>>
> = {
  collections: COLLECTION_SORT_OPTIONS,
  tokens: TOKEN_SORT_OPTIONS,
};

export const ACTIVITY_LABELS: Record<XtdhView, ActivityLabels> = {
  collections: {
    allocated: "Collections I've allocated to",
    receiving: "Collections where I'm receiving",
  },
  tokens: {
    allocated: "Tokens I've allocated to",
    receiving: "Tokens where I'm receiving",
  },
};
