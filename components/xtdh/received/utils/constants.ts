import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faList, faTableCellsLarge } from "@fortawesome/free-solid-svg-icons";
import { SortDirection } from "@/entities/ISort";

export const COLLECTIONS_PAGE_SIZE = 20;
export const NFTS_PAGE_SIZE = 20;

export const COLLECTION_QUERY_PARAM = "collection";
export const MIN_RATE_QUERY_PARAM = "min_rate";
export const MIN_GRANTORS_QUERY_PARAM = "min_grantors";

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
  | "token_count"
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
    { key: "token_count", label: "Token Count", value: "token_count" },
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
