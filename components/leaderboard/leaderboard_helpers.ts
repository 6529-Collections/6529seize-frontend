import { useState, useCallback, useEffect } from "react";
import { SortDirection } from "../../entities/ISort";
import { cicToType } from "../../helpers/Helpers";
import { commonApiFetch } from "../../services/api/common-api";
import { Content, Collector } from "./Leaderboard";
import { CICType } from "../../entities/IProfile";

export const LEADERBOARD_PAGE_SIZE = 50;

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

export interface LeaderboardMetrics {
  handle: string;
  consolidation_key: string;
  consolidation_display: string;
  pfp_url: string;
  balance: number;
  unique_memes: number;
  unique_memes_total: number;
  memes_cards_sets: number;
  rep_score: number;
  cic_score: number;
  primary_wallet: string;
  boosted_tdh: number;
  day_change: number;
  level: number;
  cic_type?: CICType;
}

type LeaderboardItem = LeaderboardMetrics | LeaderboardInteractions;

export interface LeaderboardInteractions {
  handle: string;
  consolidation_key: string;
  consolidation_display: string;
  pfp_url: string;
  rep_score: number;
  cic_score: number;
  primary_wallet: string;
  boosted_tdh: number;
  day_change: number;
  level: number;
  primary_purchases_count: number;
  primary_purchases_value: number;
  secondary_purchases_count: number;
  secondary_purchases_value: number;
  sales_count: number;
  sales_value: number;
  transfers_in: number;
  transfers_out: number;
  airdrops: number;
  burns: number;
  cic_type?: CICType;
}

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

export async function fetchLeaderboardData(
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
  data: LeaderboardItem[];
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
    data: LeaderboardItem[];
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

export function useFetchLeaderboard(
  endpoint: string,
  page: number,
  sort: {
    sort: string;
    sort_direction: SortDirection;
  },
  searchWallets: string[],
  content: Content,
  collector: Collector,
  selectedSeason: number,
  setIsLoading: (isLoading: boolean) => void
) {
  const [myFetchUrl, setMyFetchUrl] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchLeaderboardData(
      endpoint,
      LEADERBOARD_PAGE_SIZE,
      page,
      searchWallets,
      sort,
      content,
      collector,
      selectedSeason
    );
    setTotalResults(data.count);
    setLeaderboard(data.data);
    setIsLoading(false);
    setMyFetchUrl(`${process.env.API_ENDPOINT}/api/${data.url}`);
  }, [sort, searchWallets, content, collector, selectedSeason]);

  useEffect(() => {
    fetchResults();
    const top = document.getElementById(`leaderboard-page`)?.offsetTop;
    if (top && window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  }, [page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return { myFetchUrl, totalResults, leaderboard };
}
