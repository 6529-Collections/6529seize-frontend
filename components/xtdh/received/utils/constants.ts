import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faList, faTableCellsLarge } from "@fortawesome/free-solid-svg-icons";
import { SortDirection } from "@/entities/ISort";

export const COLLECTIONS_PAGE_SIZE = 20;
export const NFTS_PAGE_SIZE = 20;

export const COLLECTION_QUERY_PARAM = "collection";
export const MIN_RATE_QUERY_PARAM = "min_rate";
export const MIN_GRANTORS_QUERY_PARAM = "min_grantors";
export const NEWLY_ALLOCATED_WINDOW_DAYS = 7;
export const TRENDING_RATE_CHANGE_THRESHOLD = 0.1;

export type XtdhReceivedView = "collections" | "nfts";

export const XTDH_RECEIVED_VIEW_ORDER: XtdhReceivedView[] = ["collections", "nfts"];

export const XTDH_RECEIVED_VIEW_LABELS: Record<XtdhReceivedView, string> = {
  collections: "Collections",
  nfts: "NFTs",
};

export const XTDH_RECEIVED_VIEW_ICONS: Record<XtdhReceivedView, IconDefinition> = {
  collections: faTableCellsLarge,
  nfts: faList,
};

export type XtdhCollectionsSortField =
  | "total_rate"
  | "total_received"
  | "grantor_count"
  | "token_count"
  | "rate_change_7d"
  | "last_allocation_at"
  | "collection_name";

export type XtdhNftSortField =
  | "xtdh_rate"
  | "total_received"
  | "token_id"
  | "collection_name";

export const DEFAULT_COLLECTION_SORT: XtdhCollectionsSortField = "total_rate";
export const DEFAULT_NFT_SORT: XtdhNftSortField = "xtdh_rate";
export const DEFAULT_DIRECTION = SortDirection.DESC;

export const XTDH_COLLECTION_SORT_ITEMS: CommonSelectItem<XtdhCollectionsSortField>[] =
  [
    { key: "total_rate", label: "Total xTDH Rate", value: "total_rate" },
    { key: "total_received", label: "Total xTDH Received", value: "total_received" },
    { key: "grantor_count", label: "Grantor Count", value: "grantor_count" },
    { key: "token_count", label: "Token Count", value: "token_count" },
    {
      key: "rate_change_7d",
      label: "xTDH Rate Change (7d)",
      value: "rate_change_7d",
    },
    {
      key: "last_allocation_at",
      label: "Last Allocation Date",
      value: "last_allocation_at",
    },
    {
      key: "collection_name",
      label: "Collection Name",
      value: "collection_name",
    },
  ];

export const XTDH_NFT_SORT_ITEMS: CommonSelectItem<XtdhNftSortField>[] = [
  { key: "xtdh_rate", label: "xTDH Rate", value: "xtdh_rate" },
  { key: "total_received", label: "Total xTDH Received", value: "total_received" },
  { key: "token_id", label: "Token ID", value: "token_id" },
  { key: "collection_name", label: "Collection Name", value: "collection_name" },
];

export type XtdhCollectionOwnershipFilter = "all" | "granted" | "received";

export const XTDH_COLLECTION_OWNERSHIP_LABELS: Record<XtdhCollectionOwnershipFilter, string> = {
  all: "All",
  granted: "I Have Granted",
  received: "I Have Received",
};

export type XtdhCollectionDiscoveryToggle = "trending" | "newly_allocated";

export const XTDH_COLLECTION_DISCOVERY_LABELS: Record<XtdhCollectionDiscoveryToggle, string> = {
  trending: "🔥 Trending (7d)",
  newly_allocated: "🆕 Newly Allocated",
};
