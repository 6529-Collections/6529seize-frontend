import { SortDirection } from "../../entities/ISort";
import { cicToType } from "../../helpers/Helpers";
import { commonApiFetch } from "../../services/api/common-api";
import { Content, Collector } from "./Leaderboard";

export enum LeaderboardCardsCollectedSort {
  level = "level",
  balance = "balance",
  unique_memes = "unique_memes",
  memes_cards_sets = "memes_cards_sets",
  boosted_tdh = "boosted_tdh",
  day_change = "day_change",
}

export enum LeaderboardInteractionsSort {
  "primary_purchases_count" = "primary_purchases_count",
  "primary_purchases_value" = "primary_purchases_value",
  "secondary_purchases_count" = "secondary_purchases_count",
  "secondary_purchases_value" = "secondary_purchases_value",
  "sales_count" = "sales_count",
  "sales_value" = "sales_value",
  "transfers_in" = "transfers_in",
  "transfers_out" = "transfers_out",
  "airdrops" = "airdrops",
  "burns" = "burns",
}

export type LeaderboardSortType =
  | LeaderboardCardsCollectedSort
  | LeaderboardInteractionsSort;

export function getLeaderboardDownloadFileName(
  title: string,
  block: number,
  page: number
) {
  const tdhBlockSuffix = block ? `-${block}` : "";
  const csvFileName = `${title}${tdhBlockSuffix}`;
  if (page) {
    return `${csvFileName}-page${page}.csv`;
  }
  return `${csvFileName}.csv`;
}

export async function fetchLeaderboardData<T>(
  endpoint: string,
  pageSize: number,
  page: number,
  searchWallets: string[],
  sort: {
    sort: string;
    sort_direction: SortDirection;
  },
  content: Content,
  collector: Collector,
  selectedSeason: number
): Promise<{
  count: number;
  data: T[];
  url: string;
}> {
  let walletFilter = "";
  if (searchWallets && searchWallets.length > 0) {
    walletFilter = `&search=${searchWallets.join(",")}`;
  }
  let mysort = sort.sort;
  let contentFilter = "";
  if (content !== Content.ALL) {
    contentFilter = `&content=${content.toLowerCase()}`;
  }
  let collectorFilter = "";
  if (collector !== Collector.ALL) {
    collectorFilter = `&collector=${collector.toLowerCase()}`;
  }
  let seasonFilter = "";
  if (selectedSeason > 0) {
    seasonFilter = `&season=${selectedSeason}`;
  }
  const url = `${endpoint}?page_size=${pageSize}&page=${page}&sort=${mysort}&sort_direction=${sort.sort_direction}${walletFilter}${contentFilter}${collectorFilter}${seasonFilter}`;
  const response = await commonApiFetch<{
    count: number;
    page: number;
    next: any;
    data: T[];
  }>({
    endpoint: url,
  });
  response.data.forEach((lead: any) => {
    lead.cic_type = cicToType(lead.cic_score);
  });
  return {
    count: response.count,
    data: response.data,
    url: url,
  };
}
